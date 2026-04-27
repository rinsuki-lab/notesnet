#[derive(Clone)]
pub struct AppState {
    pub db: sqlx::PgPool,
}

impl AppState {
    pub fn new(db: sqlx::PgPool) -> Self {
        Self { db: db.clone() }
    }
}
