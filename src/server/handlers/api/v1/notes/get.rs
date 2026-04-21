use axum::{
    Json,
    extract::{Path, State},
    response::IntoResponse,
};

use crate::server::AppState;
use crate::server::extractors::ResolvedPersona;

use super::{ListNotesItem, NoteRow};

pub enum GetNoteError {
    ServerError,
    NoteNotFound,
}

impl IntoResponse for GetNoteError {
    fn into_response(self) -> axum::response::Response {
        match self {
            GetNoteError::ServerError => (
                axum::http::StatusCode::INTERNAL_SERVER_ERROR,
                "Internal Server Error",
            ),
            GetNoteError::NoteNotFound => (axum::http::StatusCode::NOT_FOUND, "Note not found"),
        }
        .into_response()
    }
}

#[utoipa::path(
    get,
    path = "/api/v1/notes/{note_id}",
    params(
        ("note_id" = uuid::Uuid, Path, description = "Note ID")
    ),
    responses(
        (status = 200, description = "Note", body = ListNotesItem),
        (status = 400, description = "Invalid note_id or X-NotesNet-Persona header"),
        (status = 401, description = "Unauthorized"),
        (status = 403, description = "Persona mismatch"),
        (status = 404, description = "Note or persona not found"),
        (status = 500, description = "Internal server error"),
    ),
    security(
        ("bearer" = [])
    )
)]
pub async fn get_note(
    State(state): State<AppState>,
    ResolvedPersona { persona_id, .. }: ResolvedPersona,
    Path(note_id): Path<uuid::Uuid>,
) -> Result<Json<ListNotesItem>, GetNoteError> {
    let mut qb = super::latest_note_rows_query();
    qb.push(" AND notes.id = ");
    qb.push_bind(note_id);
    super::push_scope_filter(&mut qb, persona_id);

    let row: Option<NoteRow> = qb
        .build_query_as()
        .fetch_optional(&state.db)
        .await
        .map_err(|e| {
            tracing::error!(err = %e, note_id = %note_id, "GET_NOTE.FAILED_TO_FETCH");
            GetNoteError::ServerError
        })?;

    let row = row.ok_or(GetNoteError::NoteNotFound)?;

    Ok(Json(row.into()))
}
