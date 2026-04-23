use std::sync::Arc;

use async_graphql::dataloader::DataLoader;

use crate::server::extractors::ResolvedPersona;
use crate::server::handlers::api::v1::graphql::loader::{
    DatabaseLoader, NoteId, ScopeId, ScopePermissionId,
};
use crate::server::handlers::api::v1::graphql::types::scope_permissions::ScopePermissions;

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
        let loader = ctx.data_unchecked::<Arc<DataLoader<DatabaseLoader>>>();

        let note = loader.load_one(NoteId(id)).await.map_err(|e| {
            tracing::error!(err = %e, note_id = %id, "GRAPHQL.NOTE.FAILED_TO_FETCH");
            async_graphql::Error::new("Internal server error")
        })?;

        let Some(note) = note else {
            return Ok(None);
        };

        let mut permission = None;

        if persona.is_default_persona {
            let scope = loader.load_one(ScopeId(note.scope_id)).await
                .map_err(|e| {
                    tracing::error!(err = %e, scope_id = %note.scope_id, "GRAPHQL.NOTE.FAILED_TO_FETCH_SCOPE");
                    async_graphql::Error::new("Internal server error")
                })?;
            let Some(scope) = scope else {
                tracing::error!(scope_id = %note.scope_id, "GRAPHQL.NOTE.SCOPE_NOT_FOUND");
                return Ok(None);
            };
            if scope.owner_account_id == persona.token.account_id {
                permission = Some(ScopePermissions::owner());
            }
        }

        if permission.is_none() {
            permission = loader.load_one(ScopePermissionId {
                scope_id: note.scope_id,
                persona_id: persona.persona_id
            }).await.map_err(|e| {
                tracing::error!(err = %e, scope_id = %note.scope_id, persona_id = %persona.persona_id, "GRAPHQL.NOTE.FAILED_TO_FETCH_PERMISSION");
                async_graphql::Error::new("Internal server error")
            })?.map(|x| ScopePermissions { can_read_note_revisions: x.can_read_note_revisions, can_modify_notes: x.can_modify_notes, can_add_their_notes_to_child: x.can_add_their_notes_to_child });
        }

        if permission.is_none() {
            return Ok(None);
        }

        Ok(Some(note))
    }
}
