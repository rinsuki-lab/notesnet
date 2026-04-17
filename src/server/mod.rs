mod handlers;
mod state;
pub use state::AppState;

pub async fn run_server(state: AppState) {
    let app = handlers::router().with_state(state).layer(
        tower_http::trace::TraceLayer::new_for_http().make_span_with(
            |r: &axum::http::Request<_>| {
                let request_id = r
                    .headers()
                    .get("x-request-id")
                    .and_then(|x| x.to_str().ok())
                    .map(|x| x.to_string())
                    .unwrap_or_default();
                tracing::info_span!("request", request_id = %request_id)
            },
        ),
    );

    let addr = std::env::var("BIND").unwrap_or_else(|_| "0.0.0.0:3000".to_string());
    let listener = tokio::net::TcpListener::bind(&addr)
        .await
        .expect(&format!("failed to bind {}", addr));
    let local_addr = listener.local_addr().expect("failed to get local address");
    tracing::info!(%local_addr, "listening on http");
    axum::serve(listener, app).await.unwrap();
}
