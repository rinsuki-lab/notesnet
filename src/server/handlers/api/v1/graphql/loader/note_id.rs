use std::sync::Arc;

use async_graphql::dataloader::Loader;

use crate::server::handlers::api::v1::graphql::types;

#[derive(Clone, Debug, PartialEq, Eq, Hash)]
pub struct NoteId(pub uuid::Uuid);

impl Loader<NoteId> for super::DatabaseLoaderInner {
    type Value = Arc<types::note::Note>;
    type Error = Arc<sqlx::Error>;

    async fn load(
        &self,
        keys: &[NoteId],
    ) -> Result<std::collections::HashMap<NoteId, Self::Value>, Self::Error> {
        let res = sqlx::query!(
            "
            SELECT
                notes.id,
                external_service,
                external_id,
                scope_id,
                note_revisions.id AS latest_revision_id
            FROM notes
            LEFT JOIN note_revisions ON notes.id = note_revisions.note_id AND note_revisions.next_revision_id IS NULL
            WHERE notes.id = ANY($1)
            ",
            &keys.iter().map(|k| k.0).collect::<Vec<_>>()
        )
        .fetch_all(&self.db)
        .await
        .map_err(Arc::new)?;

        let mut map = std::collections::HashMap::new();
        for row in res {
            let note = types::note::Note {
                id: row.id,
                scope_id: row.scope_id,
                external: row
                    .external_service
                    .map(|service| types::note_external::NoteExternal {
                        service,
                        id: row.external_id.unwrap_or_default(),
                    }),
                latest_revision_id: row.latest_revision_id,
            };
            map.insert(NoteId(row.id), Arc::new(note));
        }
        Ok(map)
    }
}
