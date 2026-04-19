use sqlx::PgPool;
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

    if std::env::args().any(|a| a == "--output-openapi-and-exit") {
        use utoipa::OpenApi as _;
        let oa = server::handlers::api::openapi::ApiDoc::openapi();
        println!("{}", serde_json::to_string_pretty(&oa).unwrap());
        return;
    }

    let state = server::AppState {
        db: PgPool::connect(&std::env::var("DATABASE_URL").expect("DATABASE_URL must be set"))
            .await
            .expect("failed to connect to database"),
    };

    server::run_server(state).await;
}
