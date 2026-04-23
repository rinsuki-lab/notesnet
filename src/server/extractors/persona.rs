use axum::extract::FromRequestParts;
use axum::http::request::Parts;

use super::access_token::{AccessToken, AccessTokenRejection, MaybeAccessToken};
use crate::server::AppState;

/// 認証トークンと X-NotesNet-Persona ヘッダーからペルソナIDを解決する。
/// 優先順位: 1. ヘッダー指定 2. トークン紐付き 3. デフォルトペルソナ
pub struct ResolvedPersona {
    pub token: AccessToken,
    pub persona_id: uuid::Uuid,
    pub is_default_persona: bool,
}

pub enum ResolvedPersonaRejection {
    Unauthorized,
    PersonaMismatch,
    PersonaNotFound,
    InvalidPersonaHeader,
    ServerError,
}

impl axum::response::IntoResponse for ResolvedPersonaRejection {
    fn into_response(self) -> axum::response::Response {
        match self {
            ResolvedPersonaRejection::Unauthorized => {
                (axum::http::StatusCode::UNAUTHORIZED, "Unauthorized")
            }
            ResolvedPersonaRejection::PersonaMismatch => (
                axum::http::StatusCode::FORBIDDEN,
                "Access token is bound to a different persona",
            ),
            ResolvedPersonaRejection::PersonaNotFound => {
                (axum::http::StatusCode::NOT_FOUND, "Persona not found")
            }
            ResolvedPersonaRejection::InvalidPersonaHeader => (
                axum::http::StatusCode::BAD_REQUEST,
                "Invalid X-NotesNet-Persona header",
            ),
            ResolvedPersonaRejection::ServerError => (
                axum::http::StatusCode::INTERNAL_SERVER_ERROR,
                "Internal Server Error",
            ),
        }
        .into_response()
    }
}

impl FromRequestParts<AppState> for ResolvedPersona {
    type Rejection = ResolvedPersonaRejection;

    async fn from_request_parts(
        parts: &mut Parts,
        state: &AppState,
    ) -> Result<Self, Self::Rejection> {
        let MaybeAccessToken(token) = MaybeAccessToken::from_request_parts(parts, state)
            .await
            .map_err(|e| match e {
                AccessTokenRejection::Unauthorized => ResolvedPersonaRejection::Unauthorized,
                AccessTokenRejection::ServerError => ResolvedPersonaRejection::ServerError,
            })?;

        let token = token.ok_or(ResolvedPersonaRejection::Unauthorized)?;

        let header_persona_id = match parts.headers.get("x-notesnet-persona") {
            Some(v) => {
                let s = v
                    .to_str()
                    .map_err(|_| ResolvedPersonaRejection::InvalidPersonaHeader)?;
                Some(
                    uuid::Uuid::parse_str(s)
                        .map_err(|_| ResolvedPersonaRejection::InvalidPersonaHeader)?,
                )
            }
            None => None,
        };

        let (persona_id, is_default_persona) = if let Some(pid) = header_persona_id {
            // トークンがペルソナに紐付いている場合、一致しなければエラー
            if let Some(token_persona_id) = token.persona_id {
                if token_persona_id != pid {
                    return Err(ResolvedPersonaRejection::PersonaMismatch);
                }
            }
            // ペルソナがアカウントに属しているか確認
            let persona_exists = sqlx::query!(
                "SELECT name FROM personas WHERE id = $1 AND account_id = $2",
                pid,
                token.account_id,
            )
            .fetch_optional(&state.db)
            .await
            .map_err(|e| {
                tracing::error!(err = %e, "RESOLVE_PERSONA.FAILED_TO_CHECK_PERSONA");
                ResolvedPersonaRejection::ServerError
            })?;
            let Some(persona_exists) = persona_exists else {
                return Err(ResolvedPersonaRejection::PersonaNotFound);
            };
            (pid, persona_exists.name.is_none())
        } else if let Some(token_persona_id) = token.persona_id {
            // トークン紐付きペルソナがアカウントに属しているか確認
            let persona_exists = sqlx::query!(
                "SELECT name FROM personas WHERE id = $1 AND account_id = $2",
                token_persona_id,
                token.account_id,
            )
            .fetch_optional(&state.db)
            .await
            .map_err(|e| {
                tracing::error!(err = %e, "RESOLVE_PERSONA.FAILED_TO_CHECK_TOKEN_PERSONA");
                ResolvedPersonaRejection::ServerError
            })?;
            let Some(persona_exists) = persona_exists else {
                return Err(ResolvedPersonaRejection::PersonaNotFound);
            };
            (token_persona_id, persona_exists.name.is_none())
        } else {
            // デフォルトペルソナを取得
            sqlx::query_scalar!(
                "SELECT id FROM personas WHERE account_id = $1 AND name IS NULL",
                token.account_id,
            )
            .fetch_one(&state.db)
            .await
            .map(|pid| (pid, true))
            .map_err(|e| {
                tracing::error!(err = %e, "RESOLVE_PERSONA.FAILED_TO_FETCH_DEFAULT_PERSONA");
                ResolvedPersonaRejection::ServerError
            })?
        };

        Ok(ResolvedPersona {
            token,
            persona_id,
            is_default_persona,
        })
    }
}
