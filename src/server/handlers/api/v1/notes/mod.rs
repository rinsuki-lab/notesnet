use chrono::{DateTime, Utc};

use crate::server::AppState;

pub mod create;

pub fn router() -> axum::Router<AppState> {
    axum::Router::new().route("/", axum::routing::post(create::create_note))
}

#[derive(serde::Serialize, utoipa::ToSchema)]
pub struct ListNotesItem {
    note_id: String,
    revision_id: String,
    note_author_persona_id: String,
    revision_author_persona_id: String,
    scope_id: String,
    summary: Option<String>,
    text_for_search: String,
    content_type: String,
    attributes: serde_json::Value,
    content: serde_json::Value,
    started_at: Option<DateTime<Utc>>,
    written_at: DateTime<Utc>,
    inserted_at: DateTime<Utc>,
}

#[derive(sqlx::FromRow)]
struct NoteRow {
    note_id: uuid::Uuid,
    revision_id: uuid::Uuid,
    note_author_persona_id: uuid::Uuid,
    revision_author_persona_id: uuid::Uuid,
    scope_id: uuid::Uuid,
    summary: Option<String>,
    text_for_search: String,
    content_type: String,
    attributes: serde_json::Value,
    content: serde_json::Value,
    started_at: Option<DateTime<Utc>>,
    written_at: DateTime<Utc>,
    inserted_at: DateTime<Utc>,
}

impl From<NoteRow> for ListNotesItem {
    fn from(r: NoteRow) -> Self {
        Self {
            note_id: r.note_id.to_string(),
            revision_id: r.revision_id.to_string(),
            note_author_persona_id: r.note_author_persona_id.to_string(),
            revision_author_persona_id: r.revision_author_persona_id.to_string(),
            scope_id: r.scope_id.to_string(),
            summary: r.summary,
            text_for_search: r.text_for_search,
            content_type: r.content_type,
            attributes: r.attributes,
            content: r.content,
            started_at: r.started_at,
            written_at: r.written_at,
            inserted_at: r.inserted_at,
        }
    }
}

const SELECT_LATEST_NOTE_ROWS: &str = "SELECT
        notes.id as note_id,
        note_revisions.id as revision_id,
        notes.author_persona_id as note_author_persona_id,
        note_revisions.author_persona_id as revision_author_persona_id,
        notes.scope_id,
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
     WHERE note_revisions.next_revision_id IS NULL";

fn latest_note_rows_query() -> sqlx::QueryBuilder<'static, sqlx::Postgres> {
    sqlx::QueryBuilder::new(SELECT_LATEST_NOTE_ROWS)
}

fn push_scope_filter(qb: &mut sqlx::QueryBuilder<sqlx::Postgres>, persona_id: uuid::Uuid) {
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
    qb.push(
        "
            )
        )",
    );
}
