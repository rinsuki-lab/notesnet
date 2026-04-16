use axum::routing::get;

use crate::server::AppState;

pub fn router() -> axum::Router<AppState> {
    axum::Router::new()
        .route("/ping", get(|| async { "pong" }))
}