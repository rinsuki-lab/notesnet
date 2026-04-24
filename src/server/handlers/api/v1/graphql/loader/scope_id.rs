use std::{collections::HashMap, sync::Arc};

use async_graphql::dataloader::Loader;

use crate::server::handlers::api::v1::graphql::types;

#[derive(Clone, Debug, PartialEq, Eq, Hash)]
pub struct ScopeId(pub uuid::Uuid);

impl Loader<ScopeId> for super::DatabaseLoaderInner {
    type Value = Arc<types::scope::Scope>;
    type Error = Arc<sqlx::Error>;

    async fn load(&self, keys: &[ScopeId]) -> Result<HashMap<ScopeId, Self::Value>, Self::Error> {
        let scope_ids: Vec<uuid::Uuid> = keys.iter().map(|key| key.0).collect();
        let scopes = sqlx::query_as!(
            types::scope::Scope,
            r#"
            SELECT id, name, owner_account_id
            FROM scopes
            WHERE id = ANY($1)
            "#,
            &scope_ids
        )
        .fetch_all(&self.db)
        .await?;

        let scope_map = scopes
            .into_iter()
            .map(|scope| (ScopeId(scope.id), Arc::new(scope)))
            .collect();

        Ok(scope_map)
    }
}
