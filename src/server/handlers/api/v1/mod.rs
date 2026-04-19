use axum::routing::get;

use crate::server::AppState;

pub mod me;

pub fn router() -> axum::Router<AppState> {
    axum::Router::new().route("/me", get(me::get_me))
}
