use crate::server::{AppState, extractors::ResolvedPersona};

struct Viewer {
    id: uuid::Uuid,
    name: String,
}

#[async_graphql::Object]
impl Viewer {
    async fn id(&self) -> &uuid::Uuid {
        &self.id
    }

    async fn name(&self) -> &str {
        &self.name
    }
}

#[derive(Default)]
pub struct ViewerQuery;

#[async_graphql::Object]
impl ViewerQuery {
    async fn viewer(&self, ctx: &async_graphql::Context<'_>) -> Viewer {
        let state = ctx.data_unchecked::<AppState>();
        let persona = ctx.data_unchecked::<ResolvedPersona>();

        let account = sqlx::query!(
            "SELECT id, name FROM accounts WHERE id = $1",
            persona.token.account_id
        )
        .fetch_one(&state.db)
        .await
        .unwrap();
        Viewer {
            id: account.id,
            name: account.name,
        }
    }
}
