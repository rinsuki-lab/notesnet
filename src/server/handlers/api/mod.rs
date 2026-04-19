use crate::server::AppState;

mod internal;
pub mod openapi;
pub mod v1;

pub fn router() -> axum::Router<AppState> {
    axum::Router::new()
        .nest("/internal", internal::router())
        .nest("/v1", v1::router())
}
