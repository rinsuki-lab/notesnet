use axum::routing::get;

use crate::server::AppState;

pub mod get;
pub mod scopes;

pub fn router() -> axum::Router<AppState> {
    axum::Router::new()
        .route("/", get(get::get_me))
        .route("/scopes", get(scopes::get_me_scopes))
}
