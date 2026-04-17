use argon2::{
    Argon2, PasswordHasher,
    password_hash::{SaltString, rand_core::OsRng},
};
use axum::{Json, extract::State, response::IntoResponse};

use crate::server::AppState;

#[derive(serde::Deserialize)]
pub struct CreateUserRequest {
    username: String,
    password: String,
}

pub enum CreateAccountError {
    ServerError,
    UserNameAlreadyUsed,
    InvalidUsername,
    InvalidPassword,
}

impl IntoResponse for CreateAccountError {
    fn into_response(self) -> axum::response::Response {
        match self {
            CreateAccountError::ServerError => (
                axum::http::StatusCode::INTERNAL_SERVER_ERROR,
                "Internal Server Error",
            ),
            CreateAccountError::UserNameAlreadyUsed => (
                axum::http::StatusCode::CONFLICT,
                "This username is already in use",
            ),
            CreateAccountError::InvalidUsername => (
                axum::http::StatusCode::UNPROCESSABLE_ENTITY,
                "Username must be 4-20 characters, lowercase alphanumeric only",
            ),
            CreateAccountError::InvalidPassword => (
                axum::http::StatusCode::UNPROCESSABLE_ENTITY,
                "Password must be 16-128 characters",
            ),
        }
        .into_response()
    }
}

fn is_valid_username(username: &str) -> bool {
    if username.len() < 4 || username.len() > 20 {
        return false;
    }
    if !username
        .chars()
        .all(|b| b.is_ascii_lowercase() || b.is_ascii_digit())
    {
        return false;
    }
    true
}

pub async fn create_account(
    State(state): State<AppState>,
    Json(body): Json<CreateUserRequest>,
) -> Result<(), CreateAccountError> {
    if !is_valid_username(&body.username) {
        return Err(CreateAccountError::InvalidUsername);
    }
    if !(16..=128).contains(&body.password.len()) {
        return Err(CreateAccountError::InvalidPassword);
    }

    let mut tx = state.db.begin().await.map_err(|e| {
        tracing::error!(err = %e, "CREATE_ACCOUNT.FAILED_TO_BEGIN_TX");
        CreateAccountError::ServerError
    })?;

    let hasher = Argon2::default();
    let salt = SaltString::generate(&mut OsRng);
    let hashed_password = hasher
        .hash_password(body.password.as_bytes(), &salt)
        .map_err(|e| {
            tracing::error!(err = %e, "CREATE_ACCOUNT.FAILED_TO_HASH_PASSWORD");
            CreateAccountError::ServerError
        })?
        .to_string();

    let res = sqlx::query!("
        INSERT INTO accounts(id, name, hashed_password) VALUES (gen_random_uuid(), $1, $2) RETURNING id
    ", body.username, hashed_password)
        .fetch_one(&mut *tx).await
        .map_err(|e| {
            if let sqlx::Error::Database(db_err) = &e {
                if db_err.constraint() == Some("accounts_name_key") {
                    tracing::warn!(username = %body.username, "CREATE_ACCOUNT.USERNAME_ALREADY_EXISTS");
                    return CreateAccountError::UserNameAlreadyUsed;
                }
            }
            tracing::error!(err = %e, "CREATE_ACCOUNT.FAILED_TO_INSERT_ACCOUNT");
            CreateAccountError::ServerError
        })?;

    sqlx::query!(
        "INSERT INTO personas(id, account_id, name) VALUES ($1, $1, NULL)",
        res.id
    )
    .execute(&mut *tx)
    .await
    .map_err(|e| {
        tracing::error!(err = %e, "CREATE_ACCOUNT.FAILED_TO_INSERT_PERSONA");
        CreateAccountError::ServerError
    })?;

    sqlx::query!(
        "INSERT INTO scopes(id, name, owner_account_id) VALUES ($1, 'Only for me', $1)",
        res.id
    )
    .execute(&mut *tx)
    .await
    .map_err(|e| {
        tracing::error!(err = %e, "CREATE_ACCOUNT.FAILED_TO_INSERT_SCOPE");
        CreateAccountError::ServerError
    })?;

    tx.commit().await.map_err(|e| {
        tracing::error!(err = %e, "CREATE_ACCOUNT.FAILED_TO_COMMIT_TX");
        CreateAccountError::ServerError
    })?;

    tracing::info!(user_id = %res.id, username = %body.username, "CREATE_ACCOUNT.SUCCESS");

    Ok(())
}
