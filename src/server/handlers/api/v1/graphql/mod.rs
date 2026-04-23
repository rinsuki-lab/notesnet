use axum::extract::State;

use crate::server::{AppState, extractors::ResolvedPersona};

mod query;
mod types;

pub fn schema() -> async_graphql::Schema<query::Query, async_graphql::EmptyMutation, async_graphql::EmptySubscription> {
    async_graphql::Schema::build(
        query::Query::default(),
        async_graphql::EmptyMutation,
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
                let mut req = req.into_inner();
                req = req.data(state).data(persona);
                Into::<async_graphql_axum::GraphQLResponse>::into(schema.execute(req).await)
            },
        ),
    )
}
