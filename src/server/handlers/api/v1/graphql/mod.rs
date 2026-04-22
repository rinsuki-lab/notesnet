use async_graphql_axum::GraphQL;

use crate::server::AppState;

struct QueryRoot;

#[async_graphql::Object]
impl QueryRoot {
    async fn hello(&self) -> &'static str {
        "world"
    }
}

pub fn router() -> axum::Router<AppState> {
    let schema = async_graphql::Schema::build(
        QueryRoot,
        async_graphql::EmptyMutation,
        async_graphql::EmptySubscription,
    )
    .finish();

    axum::Router::new().route("/", axum::routing::post_service(GraphQL::new(schema)))
}
