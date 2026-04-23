use chrono::{DateTime, Utc};

pub struct NoteRevision {
    pub id: uuid::Uuid,
    pub summary: Option<String>,
    pub text_for_search: String,
    pub content_type: String,
    pub content: serde_json::Value,
    pub attributes: serde_json::Value,
    pub started_at: Option<DateTime<Utc>>,
    pub written_at: DateTime<Utc>,
    pub inserted_at: DateTime<Utc>,
}

#[async_graphql::Object]
impl NoteRevision {
    async fn id(&self) -> &uuid::Uuid {
        &self.id
    }

    async fn summary(&self) -> Option<&str> {
        self.summary.as_deref()
    }

    async fn text_for_search(&self) -> &str {
        &self.text_for_search
    }

    async fn content_type(&self) -> &str {
        &self.content_type
    }

    async fn content(&self) -> async_graphql::Json<&serde_json::Value> {
        async_graphql::Json(&self.content)
    }

    async fn attributes(&self) -> async_graphql::Json<&serde_json::Value> {
        async_graphql::Json(&self.attributes)
    }

    async fn started_at(&self) -> Option<DateTime<Utc>> {
        self.started_at
    }

    async fn written_at(&self) -> DateTime<Utc> {
        self.written_at
    }

    async fn inserted_at(&self) -> DateTime<Utc> {
        self.inserted_at
    }
}
