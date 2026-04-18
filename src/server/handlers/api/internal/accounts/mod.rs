use axum::routing::{get, post};

use crate::server::AppState;

pub mod create;
pub mod me;

pub fn router() -> axum::Router<AppState> {
    axum::Router::new()
        .route("/create", post(create::create_account))
        .route("/me", get(me::get_me))
}
