use axum::routing::post;

use crate::server::AppState;

pub mod create;

pub fn router() -> axum::Router<AppState> {
    axum::Router::new().route("/", post(create::create_note))
}
