use axum::{Json, extract::State, response::IntoResponse};

use crate::server::AppState;
use crate::server::extractors::MaybeAccessToken;

struct PersonaRow {
    id: uuid::Uuid,
    name: Option<String>,
}

#[derive(serde::Serialize, utoipa::ToSchema)]
pub struct GetMePersona {
    id: String,
    name: Option<String>,
}

#[derive(serde::Serialize, utoipa::ToSchema)]
pub struct GetMeResponse {
    id: String,
    name: String,
    personas: Vec<GetMePersona>,
}

pub enum GetMeError {
    ServerError,
    Unauthorized,
}

impl IntoResponse for GetMeError {
    fn into_response(self) -> axum::response::Response {
        match self {
            GetMeError::ServerError => (
                axum::http::StatusCode::INTERNAL_SERVER_ERROR,
                "Internal Server Error",
            ),
            GetMeError::Unauthorized => (axum::http::StatusCode::UNAUTHORIZED, "Unauthorized"),
        }
        .into_response()
    }
}

#[utoipa::path(
    get,
    path = "/api/v1/me",
    responses(
        (status = 200, description = "Current account info", body = GetMeResponse),
        (status = 401, description = "Unauthorized"),
        (status = 500, description = "Internal server error"),
    ),
    security(
        ("bearer" = [])
    )
)]
pub async fn get_me(
    State(state): State<AppState>,
    MaybeAccessToken(token): MaybeAccessToken,
) -> Result<Json<GetMeResponse>, GetMeError> {
    let token = token.ok_or(GetMeError::Unauthorized)?;

    let account = sqlx::query!(
        "SELECT id, name FROM accounts WHERE id = $1",
        token.account_id,
    )
    .fetch_one(&state.db)
    .await
    .map_err(|e| {
        tracing::error!(err = %e, "GET_ME.FAILED_TO_FETCH_ACCOUNT");
        GetMeError::ServerError
    })?;

    let personas = if let Some(persona_id) = token.persona_id {
        sqlx::query_as!(
            PersonaRow,
            "SELECT id, name FROM personas WHERE id = $1 AND account_id = $2",
            persona_id,
            token.account_id,
        )
        .fetch_all(&state.db)
        .await
    } else {
        sqlx::query_as!(
            PersonaRow,
            "SELECT id, name FROM personas WHERE account_id = $1",
            token.account_id,
        )
        .fetch_all(&state.db)
        .await
    }
    .map_err(|e| {
        tracing::error!(err = %e, "GET_ME.FAILED_TO_FETCH_PERSONAS");
        GetMeError::ServerError
    })?;

    Ok(Json(GetMeResponse {
        id: account.id.to_string(),
        name: account.name,
        personas: personas
            .into_iter()
            .map(|p| GetMePersona {
                id: p.id.to_string(),
                name: p.name,
            })
            .collect(),
    }))
}
