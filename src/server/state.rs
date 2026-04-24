use std::sync::Arc;

use async_graphql::dataloader::DataLoader;

use crate::server::handlers::api::v1::graphql::loader::{DatabaseDataLoader, DatabaseLoaderInner};

#[derive(Clone)]
pub struct AppState {
    pub db: sqlx::PgPool,
    pub dataloader: DatabaseDataLoader,
}

impl AppState {
    pub fn new(db: sqlx::PgPool) -> Self {
        Self {
            db: db.clone(),
            dataloader: Arc::new(DataLoader::new(DatabaseLoaderInner { db }, tokio::spawn)),
        }
    }
}
