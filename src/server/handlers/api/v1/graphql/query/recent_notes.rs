use std::sync::Arc;

use crate::server::AppState;
use crate::server::extractors::ResolvedPersona;
use crate::server::handlers::api::v1::graphql::types::note::Note;
use crate::server::handlers::api::v1::graphql::types::note_external::NoteExternal;
use crate::server::handlers::api::v1::graphql::types::recent_notes::RecentNotes;

#[derive(async_graphql::Enum, Clone, Copy, PartialEq, Eq, Default)]
pub enum NoteOrderBy {
    #[default]
    WrittenAt,
    InsertedAt,
}

const GRAPHQL_CURSOR_VERSION: &str = "1";

#[derive(Clone, Copy, PartialEq)]
enum RecentNotesCursorOrderBy {
    WrittenAt,
    InsertedAt,
}

#[derive(Clone, Copy, PartialEq)]
enum RecentNotesCursorDirection {
    Next,
    Prev,
}

struct RecentNotesCursor {
    order_by: RecentNotesCursorOrderBy,
    direction: RecentNotesCursorDirection,
    revision_id: uuid::Uuid,
}

impl RecentNotesCursor {
    fn encode(
        order_by: RecentNotesCursorOrderBy,
        direction: RecentNotesCursorDirection,
        revision_id: &uuid::Uuid,
    ) -> String {
        let ob = match order_by {
            RecentNotesCursorOrderBy::WrittenAt => "w",
            RecentNotesCursorOrderBy::InsertedAt => "i",
        };
        let dir = match direction {
            RecentNotesCursorDirection::Next => "n",
            RecentNotesCursorDirection::Prev => "p",
        };
        format!("g{GRAPHQL_CURSOR_VERSION}:{ob}{dir}{revision_id}")
    }

    fn decode(s: &str) -> Option<Self> {
        let s = s.strip_prefix('g')?;
        let (version, rest) = s.split_once(':')?;
        if version != GRAPHQL_CURSOR_VERSION {
            return None;
        }
        let order_by = match rest.get(0..1)? {
            "w" => RecentNotesCursorOrderBy::WrittenAt,
            "i" => RecentNotesCursorOrderBy::InsertedAt,
            _ => return None,
        };
        let direction = match rest.get(1..2)? {
            "n" => RecentNotesCursorDirection::Next,
            "p" => RecentNotesCursorDirection::Prev,
            _ => return None,
        };
        let revision_id = uuid::Uuid::parse_str(rest.get(2..)?).ok()?;
        Some(Self {
            order_by,
            direction,
            revision_id,
        })
    }
}

// notes.scope_id を参照する。クエリの FROM 句で notes テーブルを別名なしで使うこと
fn push_scope_filter(qb: &mut sqlx::QueryBuilder<sqlx::Postgres>, persona: &ResolvedPersona) {
    qb.push(
        " AND (EXISTS (
            SELECT 1 FROM scope_personas
            WHERE scope_personas.scope_id = notes.scope_id
                AND scope_personas.persona_id = ",
    );
    qb.push_bind(persona.persona_id);
    qb.push(")");
    if persona.is_default_persona {
        qb.push(
            " OR EXISTS (
            SELECT 1 FROM scopes
            WHERE scopes.id = notes.scope_id
                AND scopes.owner_account_id = ",
        );
        qb.push_bind(persona.token.account_id);
        qb.push(")");
    }
    qb.push(")");
}

#[derive(sqlx::FromRow)]
struct RecentNoteRow {
    id: uuid::Uuid,
    external_service: Option<String>,
    external_id: Option<String>,
    scope_id: uuid::Uuid,
    latest_revision_id: uuid::Uuid,
}

#[derive(Default)]
pub struct RecentNotesQuery;

#[async_graphql::Object]
impl RecentNotesQuery {
    async fn recent_notes(
        &self,
        ctx: &async_graphql::Context<'_>,
        first: i32,
        #[graphql(default)] order_by: NoteOrderBy,
        cursor: Option<String>,
    ) -> async_graphql::Result<RecentNotes> {
        if first < 1 || first > 100 {
            return Err(async_graphql::Error::new("first must be between 1 and 100"));
        }
        let limit = first as usize;

        let persona = ctx.data_unchecked::<ResolvedPersona>();
        let state = ctx.data_unchecked::<AppState>();

        let cursor_order_by = match order_by {
            NoteOrderBy::WrittenAt => RecentNotesCursorOrderBy::WrittenAt,
            NoteOrderBy::InsertedAt => RecentNotesCursorOrderBy::InsertedAt,
        };

        let parsed_cursor = cursor
            .as_deref()
            .map(|s| -> async_graphql::Result<RecentNotesCursor> {
                let c = RecentNotesCursor::decode(s)
                    .ok_or_else(|| async_graphql::Error::new("Invalid cursor"))?;
                if c.order_by != cursor_order_by {
                    return Err(async_graphql::Error::new("Cursor orderBy mismatch"));
                }
                Ok(c)
            })
            .transpose()?;

        let is_before = parsed_cursor
            .as_ref()
            .is_some_and(|c| c.direction == RecentNotesCursorDirection::Prev);

        if let Some(ref c) = parsed_cursor {
            let mut qb: sqlx::QueryBuilder<sqlx::Postgres> = sqlx::QueryBuilder::new(
                "SELECT EXISTS(SELECT 1 FROM note_revisions \
                 JOIN notes ON note_revisions.note_id = notes.id \
                 WHERE note_revisions.next_revision_id IS NULL AND note_revisions.id = ",
            );
            qb.push_bind(c.revision_id);
            push_scope_filter(&mut qb, persona);
            qb.push(")");

            let has_access: bool =
                qb.build_query_scalar()
                    .fetch_one(&state.db)
                    .await
                    .map_err(|e| {
                        tracing::error!(err = %e, "GRAPHQL.RECENT_NOTES.CURSOR_VALIDATION_FAILED");
                        async_graphql::Error::new("Internal server error")
                    })?;

            if !has_access {
                return Err(async_graphql::Error::new("Invalid cursor"));
            }
        }

        let dir = if is_before { "ASC" } else { "DESC" };
        let order_clause = match order_by {
            NoteOrderBy::WrittenAt => format!(
                " ORDER BY
                    note_revisions.written_at {dir},
                    note_revisions.inserted_at {dir},
                    note_revisions.id {dir}"
            ),
            NoteOrderBy::InsertedAt => format!(
                " ORDER BY
                    note_revisions.inserted_at {dir},
                    note_revisions.id {dir}"
            ),
        };

        let mut qb: sqlx::QueryBuilder<sqlx::Postgres> = sqlx::QueryBuilder::new(
            "SELECT
                notes.id,
                notes.external_service,
                notes.external_id,
                notes.scope_id,
                note_revisions.id AS latest_revision_id
             FROM note_revisions
             JOIN notes ON note_revisions.note_id = notes.id
             WHERE note_revisions.next_revision_id IS NULL",
        );

        push_scope_filter(&mut qb, persona);

        if let Some(ref c) = parsed_cursor {
            let cmp = if is_before { ">" } else { "<" };
            match order_by {
                NoteOrderBy::WrittenAt => {
                    qb.push(format!(
                        " AND (note_revisions.written_at, note_revisions.inserted_at, note_revisions.id)
                         {cmp} (SELECT written_at, inserted_at, id FROM note_revisions WHERE id = "
                    ));
                }
                NoteOrderBy::InsertedAt => {
                    qb.push(format!(
                        " AND (note_revisions.inserted_at, note_revisions.id)
                         {cmp} (SELECT inserted_at, id FROM note_revisions WHERE id = "
                    ));
                }
            }
            qb.push_bind(c.revision_id);
            qb.push(")");
        }

        qb.push(order_clause);
        qb.push(" LIMIT ");
        qb.push_bind(limit as i64 + 1);

        let mut rows: Vec<RecentNoteRow> =
            qb.build_query_as()
                .fetch_all(&state.db)
                .await
                .map_err(|e| {
                    tracing::error!(err = %e, "GRAPHQL.RECENT_NOTES.FAILED_TO_FETCH");
                    async_graphql::Error::new("Internal server error")
                })?;

        let has_more = rows.len() > limit;
        if has_more {
            rows.truncate(limit);
        }
        if is_before {
            rows.reverse();
        }

        let next_cursor = if is_before || has_more {
            rows.last()
                .map(|r| &r.latest_revision_id)
                .or_else(|| parsed_cursor.as_ref().map(|c| &c.revision_id))
                .map(|id| {
                    RecentNotesCursor::encode(cursor_order_by, RecentNotesCursorDirection::Next, id)
                })
        } else {
            None
        };

        let prev_cursor = if (is_before && has_more) || (!is_before && parsed_cursor.is_some()) {
            rows.first()
                .map(|r| &r.latest_revision_id)
                .or_else(|| parsed_cursor.as_ref().map(|c| &c.revision_id))
                .map(|id| {
                    RecentNotesCursor::encode(cursor_order_by, RecentNotesCursorDirection::Prev, id)
                })
        } else {
            None
        };

        let nodes: Vec<Arc<Note>> = rows
            .into_iter()
            .map(|r| {
                Arc::new(Note {
                    id: r.id,
                    scope_id: r.scope_id,
                    external: r.external_service.map(|service| NoteExternal {
                        service,
                        id: r.external_id.unwrap_or_default(),
                    }),
                    latest_revision_id: Some(r.latest_revision_id),
                })
            })
            .collect();

        Ok(RecentNotes {
            nodes,
            next_cursor,
            prev_cursor,
        })
    }
}
