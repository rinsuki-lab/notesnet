use crate::server::AppState;

pub mod accounts;
pub mod sessions;

pub fn router() -> axum::Router<AppState> {
    axum::Router::new()
        .nest("/accounts", accounts::router())
        .nest("/sessions", sessions::router())
}
