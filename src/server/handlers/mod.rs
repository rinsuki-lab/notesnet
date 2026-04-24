use axum::http::{HeaderValue, header::CACHE_CONTROL};
use crate::server::AppState;

pub mod api;

pub fn router() -> axum::Router<AppState> {
    axum::Router::new()
        .nest("/api", api::router())
        .nest_service(
            "/assets",
            tower::ServiceBuilder::new()
                .layer(tower_http::set_header::SetResponseHeaderLayer::if_not_present(
                    CACHE_CONTROL,
                    HeaderValue::from_static("public, max-age=86400, immutable"),
                ))
                .service(tower_http::services::ServeDir::new("dist/assets")),
        )
        .fallback_service(tower_http::services::ServeFile::new("dist/index.html"))
}
