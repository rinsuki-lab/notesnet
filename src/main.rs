use axum::{Router, routing::get};
use sqlx::PgPool;
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

    let state = server::State {
        db: PgPool::connect(&std::env::var("DATABASE_URL").expect("DATABASE_URL must be set")).await.expect("failed to connect to database"),
    };

    let app = Router::new()
        .route("/", get(|| async { "Hello, World!" }))
        .with_state(state)
        .layer(
            tower_http::trace::TraceLayer::new_for_http()
                .make_span_with(|r: &axum::http::Request<_>| {
                    let request_id = r.headers().get("x-request-id")
                        .and_then(|x| x.to_str().ok())
                        .map(|x| x.to_string())
                        .unwrap_or_default();
                    tracing::info_span!("request", request_id = %request_id)
                })
        );

    let addr = std::env::var("BIND").unwrap_or_else(|_| "0.0.0.0:3000".to_string());
    let listener = tokio::net::TcpListener::bind(&addr).await.expect(&format!("failed to bind {}", addr));
    let local_addr = listener.local_addr().expect("failed to get local address");
    tracing::info!(%local_addr, "listening on http");
    axum::serve(listener, app).await.unwrap();
}
