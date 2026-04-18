use axum::{Json, response::IntoResponse};
use utoipa::OpenApi;

use super::accounts;
use super::sessions;

#[derive(OpenApi)]
#[openapi(
    paths(
        accounts::create::create_account,
        accounts::me::get_me,
        sessions::create::create_session,
    ),
    modifiers(&SecurityAddon),
)]
struct ApiDoc;

struct SecurityAddon;

impl utoipa::Modify for SecurityAddon {
    fn modify(&self, openapi: &mut utoipa::openapi::OpenApi) {
        if let Some(components) = openapi.components.as_mut() {
            components.add_security_scheme(
                "bearer",
                utoipa::openapi::security::SecurityScheme::Http(
                    utoipa::openapi::security::HttpBuilder::new()
                        .scheme(utoipa::openapi::security::HttpAuthScheme::Bearer)
                        .build(),
                ),
            );
        }
    }
}

pub async fn openapi_json() -> impl IntoResponse {
    Json(ApiDoc::openapi())
}
