use utoipa::OpenApi;

use super::internal::accounts;
use super::internal::sessions;
use super::v1;

#[derive(OpenApi)]
#[openapi(
    paths(
        accounts::create::create_account,
        v1::me::get_me,
        sessions::create::create_session,
    ),
    modifiers(&SecurityAddon),
)]
pub struct ApiDoc;

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
