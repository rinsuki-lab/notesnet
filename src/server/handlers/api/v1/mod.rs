use crate::server::AppState;

pub mod me;
pub mod notes;

pub fn router() -> axum::Router<AppState> {
    axum::Router::new()
        .nest("/me", me::router())
        .nest("/notes", notes::router())
}
