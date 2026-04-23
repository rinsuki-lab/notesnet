use chrono::{DateTime, Utc};

use crate::server::{AppState, extractors::ResolvedPersona};

use super::super::types::note::Note;
use super::super::types::note_external::NoteExternal;
use super::super::types::note_revision::NoteRevision;

#[derive(sqlx::FromRow)]
struct NoteQueryRow {
    note_id: uuid::Uuid,
    external_service: Option<String>,
    external_id: Option<String>,
    revision_id: uuid::Uuid,
    summary: Option<String>,
    text_for_search: String,
    content_type: String,
    attributes: serde_json::Value,
    content: serde_json::Value,
    started_at: Option<DateTime<Utc>>,
    written_at: DateTime<Utc>,
    inserted_at: DateTime<Utc>,
}

#[derive(Default)]
pub struct NoteQuery;

#[async_graphql::Object]
impl NoteQuery {
    async fn note(
        &self,
        ctx: &async_graphql::Context<'_>,
        id: uuid::Uuid,
    ) -> async_graphql::Result<Option<Note>> {
        let state = ctx.data_unchecked::<AppState>();
        let persona = ctx.data_unchecked::<ResolvedPersona>();
        let persona_id = persona.persona_id;

        let mut qb = sqlx::QueryBuilder::new(
            "SELECT
                notes.id as note_id,
                notes.external_service,
                notes.external_id,
                note_revisions.id as revision_id,
                note_revisions.summary,
                note_revisions.text_for_search,
                note_revisions.content_type,
                note_revisions.attributes,
                note_revisions.content,
                note_revisions.started_at,
                note_revisions.written_at,
                note_revisions.inserted_at
            FROM note_revisions
            JOIN notes ON note_revisions.note_id = notes.id
            WHERE note_revisions.next_revision_id IS NULL
            AND notes.id = ",
        );
        qb.push_bind(id);
        qb.push(
            " AND (
                EXISTS (
                    SELECT 1 FROM scopes
                    JOIN personas
                        ON personas.account_id = scopes.owner_account_id
                        AND personas.name IS NULL
                    WHERE scopes.id = notes.scope_id
                        AND personas.id = ",
        );
        qb.push_bind(persona_id);
        qb.push(
            "
                )
                OR EXISTS (
                    SELECT 1 FROM scope_personas
                    WHERE scope_personas.scope_id = notes.scope_id
                        AND scope_personas.persona_id = ",
        );
        qb.push_bind(persona_id);
        qb.push("
                )
            )");

        let row: Option<NoteQueryRow> = qb
            .build_query_as()
            .fetch_optional(&state.db)
            .await
            .map_err(|e| {
                tracing::error!(err = %e, note_id = %id, "GRAPHQL.NOTE.FAILED_TO_FETCH");
                async_graphql::Error::new("Internal server error")
            })?;

        Ok(row.map(|r| Note {
            id: r.note_id,
            external: match (r.external_service, r.external_id) {
                (Some(service), Some(id)) => Some(NoteExternal { service, id }),
                _ => None,
            },
            latest_revision: NoteRevision {
                id: r.revision_id,
                summary: r.summary,
                text_for_search: r.text_for_search,
                content_type: r.content_type,
                content: r.content,
                attributes: r.attributes,
                started_at: r.started_at,
                written_at: r.written_at,
                inserted_at: r.inserted_at,
            },
        }))
    }
}
