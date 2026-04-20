use axum::{Json, extract::State, response::IntoResponse};
use chrono::{DateTime, Utc};

use crate::server::AppState;
use crate::server::extractors::ResolvedPersona;

#[derive(serde::Serialize, utoipa::ToSchema)]
pub struct GetMeScopePermissions {
    can_read_note_revisions: bool,
    can_modify_notes: bool,
    can_add_their_notes_to_child: bool,
}

#[derive(serde::Serialize, utoipa::ToSchema)]
pub struct GetMeScopesItem {
    id: String,
    name: String,
    owner_account_id: String,
    is_owner: bool,
    permissions: GetMeScopePermissions,
    created_at: DateTime<Utc>,
}

#[derive(serde::Serialize, utoipa::ToSchema)]
pub struct GetMeScopesResponse {
    items: Vec<GetMeScopesItem>,
}

pub enum GetMeScopesError {
    ServerError,
}

impl IntoResponse for GetMeScopesError {
    fn into_response(self) -> axum::response::Response {
        match self {
            GetMeScopesError::ServerError => (
                axum::http::StatusCode::INTERNAL_SERVER_ERROR,
                "Internal Server Error",
            ),
        }
        .into_response()
    }
}

struct OwnedScopeRow {
    id: uuid::Uuid,
    name: String,
    owner_account_id: uuid::Uuid,
    created_at: DateTime<Utc>,
}

struct MemberScopeRow {
    id: uuid::Uuid,
    name: String,
    owner_account_id: uuid::Uuid,
    created_at: DateTime<Utc>,
    can_read_note_revisions: bool,
    can_modify_notes: bool,
    can_add_their_notes_to_child: bool,
}

#[utoipa::path(
    get,
    path = "/api/v1/me/scopes",
    responses(
        (status = 200, description = "List of accessible scopes", body = GetMeScopesResponse),
        (status = 400, description = "Invalid X-NotesNet-Persona header"),
        (status = 401, description = "Unauthorized"),
        (status = 403, description = "Persona mismatch"),
        (status = 404, description = "Persona not found"),
        (status = 500, description = "Internal server error"),
    ),
    security(
        ("bearer" = [])
    )
)]
pub async fn get_me_scopes(
    State(state): State<AppState>,
    ResolvedPersona { token: _, persona_id }: ResolvedPersona,
) -> Result<Json<GetMeScopesResponse>, GetMeScopesError> {
    let owned_rows = sqlx::query_as!(
        OwnedScopeRow,
        r#"
        SELECT
            scopes.id,
            scopes.name,
            scopes.owner_account_id,
            scopes.created_at
        FROM scopes
        JOIN personas ON personas.account_id = scopes.owner_account_id AND personas.name IS NULL AND personas.id = $1
        "#,
        persona_id,
    )
    .fetch_all(&state.db)
    .await
    .map_err(|e| {
        tracing::error!(err = %e, "GET_ME_SCOPES.FAILED_TO_FETCH_OWNED");
        GetMeScopesError::ServerError
    })?;

    let member_rows = sqlx::query_as!(
        MemberScopeRow,
        r#"
        SELECT
            scopes.id,
            scopes.name,
            scopes.owner_account_id,
            scopes.created_at,
            scope_personas.can_read_note_revisions,
            scope_personas.can_modify_notes,
            scope_personas.can_add_their_notes_to_child
        FROM scope_personas
        JOIN scopes ON scopes.id = scope_personas.scope_id
        WHERE scope_personas.persona_id = $1
        AND NOT EXISTS (
            SELECT 1 FROM personas
            WHERE personas.account_id = scopes.owner_account_id
                AND personas.name IS NULL
                AND personas.id = $1
        )
        "#,
        persona_id,
    )
    .fetch_all(&state.db)
    .await
    .map_err(|e| {
        tracing::error!(err = %e, "GET_ME_SCOPES.FAILED_TO_FETCH_MEMBER");
        GetMeScopesError::ServerError
    })?;

    let mut items: Vec<GetMeScopesItem> = owned_rows
        .into_iter()
        .map(|r| GetMeScopesItem {
            id: r.id.to_string(),
            name: r.name,
            owner_account_id: r.owner_account_id.to_string(),
            is_owner: true,
            permissions: GetMeScopePermissions {
                can_read_note_revisions: true,
                can_modify_notes: true,
                can_add_their_notes_to_child: true,
            },
            created_at: r.created_at,
        })
        .collect();

    items.extend(member_rows.into_iter().map(|r| GetMeScopesItem {
        id: r.id.to_string(),
        name: r.name,
        owner_account_id: r.owner_account_id.to_string(),
        is_owner: false,
        permissions: GetMeScopePermissions {
            can_read_note_revisions: r.can_read_note_revisions,
            can_modify_notes: r.can_modify_notes,
            can_add_their_notes_to_child: r.can_add_their_notes_to_child,
        },
        created_at: r.created_at,
    }));

    items.sort_by_key(|item| item.created_at);

    Ok(Json(GetMeScopesResponse { items }))
}
