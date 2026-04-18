use axum::{Json, extract::State, response::IntoResponse};

use crate::server::AppState;
use crate::server::extractors::MaybeAccessToken;

#[derive(serde::Serialize)]
pub struct GetMeResponse {
    id: String,
    name: String,
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

    Ok(Json(GetMeResponse {
        id: account.id.to_string(),
        name: account.name,
    }))
}
