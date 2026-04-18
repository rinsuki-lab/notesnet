use crate::server::AppState;

pub mod accounts;
mod openapi;
pub mod sessions;

pub fn router() -> axum::Router<AppState> {
    axum::Router::new()
        .nest("/accounts", accounts::router())
        .nest("/sessions", sessions::router())
        .route("/openapi/3", axum::routing::get(openapi::openapi_json))
}
