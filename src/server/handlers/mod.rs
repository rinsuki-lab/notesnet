use crate::server::AppState;

pub mod api;

pub fn router() -> axum::Router<AppState> {
    axum::Router::new().nest("/api", api::router())
}
