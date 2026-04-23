use crate::server::AppState;

pub mod graphql;
pub mod notes;

pub fn router() -> axum::Router<AppState> {
    axum::Router::new()
        .nest("/notes", notes::router())
        .nest("/graphql", graphql::router())
}
