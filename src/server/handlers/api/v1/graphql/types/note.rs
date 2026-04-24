use std::sync::Arc;

use crate::server::handlers::api::v1::graphql::loader::{DatabaseDataLoader, NoteRevisionId};

use super::note_external::NoteExternal;
use super::note_revision::NoteRevision;

pub struct Note {
    pub id: uuid::Uuid,
    pub scope_id: uuid::Uuid,
    pub external: Option<NoteExternal>,
    pub latest_revision_id: Option<uuid::Uuid>,
}

#[async_graphql::Object]
impl Note {
    async fn id(&self) -> &uuid::Uuid {
        &self.id
    }

    async fn external(&self) -> Option<&NoteExternal> {
        self.external.as_ref()
    }

    async fn latest_revision(
        &self,
        ctx: &async_graphql::Context<'_>,
    ) -> async_graphql::Result<Option<Arc<NoteRevision>>> {
        let Some(revision_id) = self.latest_revision_id else {
            return Ok(None);
        };

        let loader = ctx.data_unchecked::<DatabaseDataLoader>();
        // このnoteが見えているということは最新リビジョンを読む権限は持っているはず
        loader
            .load_one(NoteRevisionId(revision_id))
            .await
            .map_err(|e| {
                tracing::error!(err = %e, "GRAPHQL_NOTE.LATEST_REVISION.FAILED_TO_FETCH");
                async_graphql::Error::new("Internal server error")
            })
    }
}
