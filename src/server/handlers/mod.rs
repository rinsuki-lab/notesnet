use crate::server::AppState;

pub mod api;

pub fn router() -> axum::Router<AppState> {
    axum::Router::new()
        .nest("/api", api::router())
        .nest_service(
            "/assets",
            tower_http::services::ServeDir::new("dist/assets"),
        )
        .fallback_service(tower_http::services::ServeFile::new("dist/index.html"))
}
