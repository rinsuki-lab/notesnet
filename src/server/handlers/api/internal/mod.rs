use axum::routing::{get, post};

use crate::server::AppState;

mod accounts;

pub fn router() -> axum::Router<AppState> {
    axum::Router::new().nest("/accounts", accounts::router())
}
