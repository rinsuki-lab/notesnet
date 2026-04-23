use std::sync::Arc;

use async_graphql::dataloader::Loader;

use crate::server::handlers::api::v1::graphql::types;

#[derive(Clone, Debug, PartialEq, Eq, Hash)]
pub struct NoteRevisionId(pub uuid::Uuid);

impl Loader<NoteRevisionId> for super::DatabaseLoader {
    type Value = Arc<types::note_revision::NoteRevision>;
    type Error = Arc<sqlx::Error>;

    async fn load(
        &self,
        keys: &[NoteRevisionId],
    ) -> Result<std::collections::HashMap<NoteRevisionId, Self::Value>, Self::Error> {
        let res = sqlx::query!(
            "
            SELECT id, summary, text_for_search, content_type, content, attributes, started_at, written_at, inserted_at
            FROM note_revisions
            WHERE id = ANY($1)
            ",
            &keys.iter().map(|k| k.0).collect::<Vec<_>>()
        )
        .fetch_all(&self.db)
        .await
        .map_err(Arc::new)?;

        let mut map = std::collections::HashMap::new();
        for row in res {
            let revision = types::note_revision::NoteRevision {
                id: row.id,
                summary: row.summary,
                text_for_search: row.text_for_search,
                content_type: row.content_type,
                content: row.content,
                attributes: row.attributes,
                started_at: row.started_at,
                written_at: row.written_at,
                inserted_at: row.inserted_at,
            };
            map.insert(NoteRevisionId(row.id), Arc::new(revision));
        }
        Ok(map)
    }
}
