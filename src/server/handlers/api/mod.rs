use crate::server::AppState;

mod internal;

pub fn router() -> axum::Router<AppState> {
    axum::Router::new().nest("/internal", internal::router())
}
