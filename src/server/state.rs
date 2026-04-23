use std::sync::Arc;

use async_graphql::dataloader::DataLoader;

use crate::server::handlers::api::v1::graphql::loader::DatabaseLoader;

#[derive(Clone)]
pub struct AppState {
    pub db: sqlx::PgPool,
    pub dataloader: Arc<DataLoader<DatabaseLoader>>,
}

impl AppState {
    pub fn new(db: sqlx::PgPool) -> Self {
        Self {
            db: db.clone(),
            dataloader: Arc::new(DataLoader::new(DatabaseLoader { db }, tokio::spawn)),
        }
    }
}
