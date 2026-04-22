use crate::server::AppState;

mod graphql;
pub mod me;
pub mod notes;

pub fn router() -> axum::Router<AppState> {
    axum::Router::new()
        .nest("/me", me::router())
        .nest("/notes", notes::router())
        .nest("/graphql", graphql::router())
}
