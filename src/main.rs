use sqlx::PgPool;
use tokio::{fs::File, io::AsyncWriteExt as _};
mod constants;
mod server;

fn init_registry() {
    use tracing_subscriber::layer::SubscriberExt as _;
    use tracing_subscriber::util::SubscriberInitExt as _;

    let registry = tracing_subscriber::registry().with(
        tracing_subscriber::filter::EnvFilter::try_from_default_env()
            .unwrap_or_else(|_| "debug,hyper_util=info".into()),
    );
    if cfg!(debug_assertions) {
        registry.with(tracing_subscriber::fmt::layer()).init();
    } else {
        registry
            .with(tracing_subscriber::fmt::layer().json())
            .init();
    }
}

#[tokio::main]
async fn main() {
    init_registry();

    if std::env::args().any(|a| a == "--dump-schema-and-exit") {
        // OpenAPI
        use utoipa::OpenApi as _;
        let oa = server::handlers::api::openapi::ApiDoc::openapi();
        File::create("openapi.json")
            .await
            .expect("failed to create openapi.json")
            .write_all(serde_json::to_string_pretty(&oa).unwrap().as_bytes())
            .await
            .expect("failed to write openapi.json");
        // GraphQL
        let schema = server::handlers::api::v1::graphql::schema();
        File::create("schema.graphql")
            .await
            .expect("failed to create schema.graphql")
            .write_all(schema.sdl().as_bytes())
            .await
            .expect("failed to write schema.graphql");
        return;
    }

    let pool = PgPool::connect(&std::env::var("DATABASE_URL").expect("DATABASE_URL must be set"))
        .await
        .expect("failed to connect to database");

    if std::env::args().any(|a| a == "--migrate-and-run") {
        migrate(&pool).await;
    }

    if std::env::args().any(|a| a == "--migrate-and-exit") {
        migrate(&pool).await;
        return;
    }

    let state = server::AppState::new(pool);

    server::run_server(state).await;
}

async fn migrate(pool: &PgPool) {
    sqlx::migrate!()
        .run(pool)
        .await
        .expect("failed to run migrations");
}