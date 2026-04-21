use axum::{Json, extract::Query, extract::State, response::IntoResponse};

use crate::server::AppState;
use crate::server::extractors::ResolvedPersona;

use super::{ListNotesItem, NoteRow};

#[derive(serde::Deserialize, utoipa::ToSchema, Default, Clone, Copy, PartialEq)]
#[serde(rename_all = "snake_case")]
pub enum ListNotesOrderBy {
    #[default]
    WrittenAt,
    InsertedAt,
}

impl ListNotesOrderBy {
    fn prefix(self) -> &'static str {
        match self {
            Self::WrittenAt => "w",
            Self::InsertedAt => "i",
        }
    }

    fn from_prefix(s: &str) -> Option<Self> {
        match s {
            "w" => Some(Self::WrittenAt),
            "i" => Some(Self::InsertedAt),
            _ => None,
        }
    }

    fn cursor_columns(self) -> &'static str {
        match self {
            Self::WrittenAt => "written_at, inserted_at, id",
            Self::InsertedAt => "inserted_at, id",
        }
    }

    fn cursor_columns_qualified(self) -> &'static str {
        match self {
            Self::WrittenAt => {
                "note_revisions.written_at, note_revisions.inserted_at, note_revisions.id"
            }
            Self::InsertedAt => "note_revisions.inserted_at, note_revisions.id",
        }
    }

    fn order_clause(self, dir: &str) -> String {
        match self {
            Self::WrittenAt => format!(
                " ORDER BY note_revisions.written_at {dir},
                    note_revisions.inserted_at {dir},
                    note_revisions.id {dir}"
            ),
            Self::InsertedAt => format!(
                " ORDER BY note_revisions.inserted_at {dir},
                    note_revisions.id {dir}"
            ),
        }
    }
}

#[derive(serde::Deserialize, utoipa::IntoParams)]
pub struct ListNotesQuery {
    /// Sort order field (default: written_at)
    #[serde(default)]
    order_by: ListNotesOrderBy,
    /// Number of items per page (default: 20, max: 100)
    limit: Option<i64>,
    /// Pagination cursor (obtained from next_cursor / prev_cursor in response)
    cursor: Option<String>,
}

#[derive(serde::Serialize, utoipa::ToSchema)]
pub struct ListNotesResponse {
    items: Vec<ListNotesItem>,
    next_cursor: Option<String>,
    prev_cursor: Option<String>,
}

pub enum ListNotesError {
    ServerError,
    InvalidCursor,
}

impl IntoResponse for ListNotesError {
    fn into_response(self) -> axum::response::Response {
        match self {
            ListNotesError::ServerError => (
                axum::http::StatusCode::INTERNAL_SERVER_ERROR,
                "Internal Server Error",
            ),
            ListNotesError::InvalidCursor => {
                (axum::http::StatusCode::BAD_REQUEST, "Invalid cursor")
            }
        }
        .into_response()
    }
}

#[derive(Clone, Copy, PartialEq)]
enum CursorDirection {
    Next,
    Prev,
}

impl CursorDirection {
    fn prefix(self) -> &'static str {
        match self {
            Self::Next => "n",
            Self::Prev => "p",
        }
    }

    fn from_prefix(s: &str) -> Option<Self> {
        match s {
            "n" => Some(Self::Next),
            "p" => Some(Self::Prev),
            _ => None,
        }
    }
}

struct Cursor {
    order_by: ListNotesOrderBy,
    direction: CursorDirection,
    revision_id: uuid::Uuid,
}

const CURSOR_VERSION: &str = "1";

impl Cursor {
    fn encode(
        order_by: ListNotesOrderBy,
        direction: CursorDirection,
        revision_id: &uuid::Uuid,
    ) -> String {
        format!(
            "{CURSOR_VERSION}:{}{}{}",
            order_by.prefix(),
            direction.prefix(),
            revision_id,
        )
    }

    fn decode(s: &str) -> Option<Self> {
        let (version, rest) = s.split_once(':')?;
        if version != CURSOR_VERSION {
            return None;
        }
        let (order_prefix, rest) = rest.split_at_checked(1)?;
        let (dir_prefix, uuid_str) = rest.split_at_checked(1)?;
        Some(Cursor {
            order_by: ListNotesOrderBy::from_prefix(order_prefix)?,
            direction: CursorDirection::from_prefix(dir_prefix)?,
            revision_id: uuid::Uuid::parse_str(uuid_str).ok()?,
        })
    }
}

async fn validate_cursor_access(
    state: &AppState,
    persona_id: uuid::Uuid,
    cursor: &Cursor,
) -> Result<(), ListNotesError> {
    let mut qb: sqlx::QueryBuilder<sqlx::Postgres> = sqlx::QueryBuilder::new(
        "SELECT EXISTS(
            SELECT 1 FROM note_revisions
            JOIN notes ON note_revisions.note_id = notes.id
            WHERE note_revisions.id = ",
    );
    qb.push_bind(cursor.revision_id);
    super::push_scope_filter(&mut qb, persona_id);
    qb.push(
        "
        )",
    );

    let has_access: bool = qb
        .build_query_scalar()
        .fetch_one(&state.db)
        .await
        .map_err(|e| {
            tracing::error!(err = %e, "LIST_NOTES.CURSOR_VALIDATION_FAILED");
            ListNotesError::ServerError
        })?;
    has_access
        .then_some(())
        .ok_or(ListNotesError::InvalidCursor)
}

#[utoipa::path(
    get,
    path = "/api/v1/notes",
    params(ListNotesQuery),
    responses(
        (status = 200, description = "List of notes", body = ListNotesResponse),
        (status = 400, description = "Invalid cursor or query parameters"),
        (status = 401, description = "Unauthorized"),
        (status = 403, description = "Persona mismatch"),
        (status = 404, description = "Persona not found"),
        (status = 500, description = "Internal server error"),
    ),
    security(
        ("bearer" = [])
    )
)]
pub async fn list_notes(
    State(state): State<AppState>,
    ResolvedPersona { persona_id, .. }: ResolvedPersona,
    Query(query): Query<ListNotesQuery>,
) -> Result<Json<ListNotesResponse>, ListNotesError> {
    let limit = query.limit.unwrap_or(20).clamp(1, 100) as usize;
    let cursor = query
        .cursor
        .as_deref()
        .map(|s| {
            let c = Cursor::decode(s).ok_or(ListNotesError::InvalidCursor)?;
            (c.order_by == query.order_by)
                .then_some(c)
                .ok_or(ListNotesError::InvalidCursor)
        })
        .transpose()?;
    let is_before = cursor
        .as_ref()
        .is_some_and(|c| c.direction == CursorDirection::Prev);

    if let Some(ref c) = cursor {
        validate_cursor_access(&state, persona_id, c).await?;
    }

    let mut qb = super::latest_note_rows_query();

    super::push_scope_filter(&mut qb, persona_id);

    if let Some(ref c) = cursor {
        let cmp = if is_before { ">" } else { "<" };
        let cols = query.order_by.cursor_columns();
        let cols_qualified = query.order_by.cursor_columns_qualified();
        qb.push(format!(
            " AND ({cols_qualified}) {cmp} (SELECT {cols} FROM note_revisions WHERE id = "
        ));
        qb.push_bind(c.revision_id);
        qb.push(")");
    }

    let dir = if is_before { "ASC" } else { "DESC" };
    qb.push(query.order_by.order_clause(dir));
    qb.push(" LIMIT ");
    qb.push_bind(limit as i64 + 1);

    let mut rows: Vec<NoteRow> = qb
        .build_query_as()
        .fetch_all(&state.db)
        .await
        .map_err(|e| {
            tracing::error!(err = %e, "LIST_NOTES.FAILED_TO_FETCH");
            ListNotesError::ServerError
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
            .map(|r| &r.revision_id)
            .or(cursor.as_ref().map(|c| &c.revision_id))
            .map(|id| Cursor::encode(query.order_by, CursorDirection::Next, id))
    } else {
        None
    };
    let prev_cursor = if (is_before && has_more) || (!is_before && cursor.is_some()) {
        rows.first()
            .map(|r| &r.revision_id)
            .or(cursor.as_ref().map(|c| &c.revision_id))
            .map(|id| Cursor::encode(query.order_by, CursorDirection::Prev, id))
    } else {
        None
    };

    Ok(Json(ListNotesResponse {
        items: rows.into_iter().map(Into::into).collect(),
        next_cursor,
        prev_cursor,
    }))
}
