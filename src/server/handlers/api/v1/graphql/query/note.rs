use std::sync::Arc;


use crate::server::extractors::ResolvedPersona;
use crate::server::handlers::api::v1::graphql::loader::{
    DatabaseDataLoader, DatabaseDataLoaderExt, NoteId
};

use super::super::types::note::Note;

#[derive(Default)]
pub struct NoteQuery;

#[async_graphql::Object]
impl NoteQuery {
    async fn note(
        &self,
        ctx: &async_graphql::Context<'_>,
        id: uuid::Uuid,
    ) -> async_graphql::Result<Option<Arc<Note>>> {
        let persona = ctx.data_unchecked::<ResolvedPersona>();
        let loader = ctx.data_unchecked::<DatabaseDataLoader>();

        let note = loader.load_one(NoteId(id)).await.map_err(|e| {
            tracing::error!(err = %e, note_id = %id, "GRAPHQL.NOTE.FAILED_TO_FETCH");
            async_graphql::Error::new("Internal server error")
        })?;

        let Some(note) = note else {
            return Ok(None);
        };

        let permission = loader.get_permission_by_scope_id(note.scope_id, &persona).await?;

        if permission.is_none() {
            return Ok(None);
        }

        Ok(Some(note))
    }
}
