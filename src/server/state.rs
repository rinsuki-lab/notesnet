#[derive(Clone)]
pub struct State {
    pub db: sqlx::PgPool,
}