use axum::routing::get;

use crate::server::AppState;

pub mod create;
pub mod list;

pub fn router() -> axum::Router<AppState> {
    axum::Router::new().route("/", get(list::list_notes).post(create::create_note))
}
