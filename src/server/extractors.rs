use axum::extract::FromRequestParts;
use axum::http::request::Parts;
use sha2::{Digest, Sha256};

use super::AppState;

pub struct AccessToken {
    pub account_id: uuid::Uuid,
    pub token_id: uuid::Uuid,
    pub persona_id: Option<uuid::Uuid>,
    pub is_super_token: bool,
}

pub enum AccessTokenRejection {
    Unauthorized,
    ServerError,
}

impl axum::response::IntoResponse for AccessTokenRejection {
    fn into_response(self) -> axum::response::Response {
        match self {
            AccessTokenRejection::Unauthorized => {
                (axum::http::StatusCode::UNAUTHORIZED, "Unauthorized")
            }
            AccessTokenRejection::ServerError => (
                axum::http::StatusCode::INTERNAL_SERVER_ERROR,
                "Internal Server Error",
            ),
        }
        .into_response()
    }
}

/// Authorization ヘッダーからアクセストークンを検証して返す。
/// ヘッダーが存在しない場合は `Ok(None)` 、ヘッダーが存在するがトークンが無効な場合は `Err(Unauthorized)` を返す。
pub struct MaybeAccessToken(pub Option<AccessToken>);

impl FromRequestParts<AppState> for MaybeAccessToken {
    type Rejection = AccessTokenRejection;

    async fn from_request_parts(
        parts: &mut Parts,
        state: &AppState,
    ) -> Result<Self, Self::Rejection> {
        let header = parts
            .headers
            .get("authorization")
            .and_then(|v| v.to_str().ok());

        let header = match header {
            Some(h) => h,
            None => return Ok(MaybeAccessToken(None)),
        };

        let token = header
            .strip_prefix("Bearer ")
            .ok_or(AccessTokenRejection::Unauthorized)?;

        let token_id = token
            .split('.')
            .next()
            .and_then(|id| uuid::Uuid::parse_str(id).ok())
            .ok_or(AccessTokenRejection::Unauthorized)?;

        let hashed_token = Sha256::digest(token.as_bytes()).to_vec();

        let row = sqlx::query!(
            "SELECT account_id, persona_id, is_super_token FROM access_tokens WHERE id = $1 AND hashed_token = $2 AND revoked_at IS NULL",
            token_id,
            hashed_token,
        )
        .fetch_optional(&state.db)
        .await
        .map_err(|e| {
            tracing::error!(err = %e, "ACCESS_TOKEN_EXTRACTOR.FAILED_TO_FETCH");
            AccessTokenRejection::ServerError
        })?
        .ok_or(AccessTokenRejection::Unauthorized)?;

        Ok(MaybeAccessToken(Some(AccessToken {
            account_id: row.account_id,
            token_id,
            persona_id: row.persona_id,
            is_super_token: row.is_super_token,
        })))
    }
}
