use argon2::{
    Argon2, PasswordHash, PasswordVerifier,
    password_hash::rand_core::{OsRng, RngCore},
};
use axum::{Json, extract::State, response::IntoResponse};
use sha2::{Digest, Sha256};

use crate::constants::PASSWORD_MAX_LENGTH;
use crate::server::AppState;

#[derive(serde::Deserialize, utoipa::ToSchema)]
pub struct CreateSessionRequest {
    username: String,
    password: String,
}

#[derive(serde::Serialize, utoipa::ToSchema)]
pub struct CreateSessionResponse {
    access_token: String,
}

pub enum CreateSessionError {
    ServerError,
    InvalidCredentials,
}

impl IntoResponse for CreateSessionError {
    fn into_response(self) -> axum::response::Response {
        match self {
            CreateSessionError::ServerError => (
                axum::http::StatusCode::INTERNAL_SERVER_ERROR,
                "Internal Server Error",
            ),
            CreateSessionError::InvalidCredentials => {
                (axum::http::StatusCode::UNAUTHORIZED, "Invalid credentials")
            }
        }
        .into_response()
    }
}

#[utoipa::path(
    post,
    path = "/api/internal/sessions/create",
    request_body = CreateSessionRequest,
    responses(
        (status = 200, description = "Session created", body = CreateSessionResponse),
        (status = 401, description = "Invalid credentials"),
        (status = 500, description = "Internal server error"),
    )
)]
pub async fn create_session(
    State(state): State<AppState>,
    Json(body): Json<CreateSessionRequest>,
) -> Result<Json<CreateSessionResponse>, CreateSessionError> {
    if body.password.len() > PASSWORD_MAX_LENGTH {
        return Err(CreateSessionError::InvalidCredentials);
    }

    let account = sqlx::query!(
        "SELECT id, hashed_password FROM accounts WHERE name = $1",
        body.username
    )
    .fetch_optional(&state.db)
    .await
    .map_err(|e| {
        tracing::error!(err = %e, "CREATE_SESSION.FAILED_TO_FETCH_ACCOUNT");
        CreateSessionError::ServerError
    })?
    .ok_or(CreateSessionError::InvalidCredentials)?;

    let parsed_hash = PasswordHash::new(&account.hashed_password).map_err(|e| {
        tracing::error!(err = %e, "CREATE_SESSION.FAILED_TO_PARSE_HASH");
        CreateSessionError::ServerError
    })?;

    Argon2::default()
        .verify_password(body.password.as_bytes(), &parsed_hash)
        .map_err(|e| match e {
            argon2::password_hash::Error::Password => {
                tracing::warn!("CREATE_SESSION.INVALID_PASSWORD");
                CreateSessionError::InvalidCredentials
            }
            _ => {
                tracing::error!(err = %e, "CREATE_SESSION.FAILED_TO_VERIFY_PASSWORD");
                CreateSessionError::ServerError
            }
        })?;

    let token_id = uuid::Uuid::new_v4();
    let mut random_bytes = [0u8; 64];
    OsRng.fill_bytes(&mut random_bytes);
    let access_token = format!("{}.{}", token_id, hex::encode(random_bytes));

    let hashed_token = Sha256::digest(access_token.as_bytes()).to_vec();

    sqlx::query!(
        "INSERT INTO access_tokens(id, account_id, persona_id, hashed_token, description, is_super_token) VALUES ($1, $2, NULL, $3, 'Web Session', TRUE)",
        token_id,
        account.id,
        hashed_token,
    )
    .execute(&state.db)
    .await
    .map_err(|e| {
        tracing::error!(err = %e, "CREATE_SESSION.FAILED_TO_INSERT_TOKEN");
        CreateSessionError::ServerError
    })?;

    tracing::info!(account_id = %account.id, "CREATE_SESSION.SUCCESS");

    Ok(Json(CreateSessionResponse { access_token }))
}
