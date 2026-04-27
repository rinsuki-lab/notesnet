use axum::extract::State;

use crate::server::{
    AppState,
    extractors::ResolvedPersona,
    handlers::api::v1::graphql::loader::{DatabaseDataLoader, DatabaseDataLoaderExt as _},
};

pub mod loader;
mod mutation;
mod query;
mod types;

pub fn schema()
-> async_graphql::Schema<query::Query, mutation::Mutation, async_graphql::EmptySubscription> {
    async_graphql::Schema::build(
        query::Query::default(),
        mutation::Mutation::default(),
        async_graphql::EmptySubscription,
    )
    .finish()
}

pub fn router() -> axum::Router<AppState> {
    let schema = schema();

    axum::Router::new().route(
        "/",
        axum::routing::post(
            |State(state): State<AppState>,
             persona: ResolvedPersona,
             req: async_graphql_axum::GraphQLRequest| async move {
                let req = req
                    .into_inner()
                    .data(DatabaseDataLoader::new_with_db(state.db.clone()))
                    .data(state)
                    .data(persona);
                Into::<async_graphql_axum::GraphQLResponse>::into(schema.execute(req).await)
            },
        ),
    )
}
