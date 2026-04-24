use crate::server::AppState;

pub mod graphql;

pub fn router() -> axum::Router<AppState> {
    axum::Router::new().nest("/graphql", graphql::router())
}
