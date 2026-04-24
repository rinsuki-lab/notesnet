pub type DatabaseDataLoader =
    std::sync::Arc<async_graphql::dataloader::DataLoader<DatabaseLoaderInner>>;

pub struct DatabaseLoaderInner {
    pub db: sqlx::PgPool,
}

mod note_id;
mod note_revision_id;
mod scope_id;
mod scope_permission_id;

pub use note_id::NoteId;
pub use note_revision_id::NoteRevisionId;
pub use scope_id::ScopeId;
pub use scope_permission_id::ScopePermissionId;

use crate::server::extractors::ResolvedPersona;

use super::types::scope_permissions::ScopePermissions;

pub trait DatabaseDataLoaderExt {
    async fn get_permission_by_scope_id(
        &self,
        scope_id: uuid::Uuid,
        persona: &ResolvedPersona,
    ) -> async_graphql::Result<Option<ScopePermissions>>;
}

impl DatabaseDataLoaderExt for DatabaseDataLoader {
    async fn get_permission_by_scope_id(
        &self,
        scope_id: uuid::Uuid,
        persona: &ResolvedPersona,
    ) -> async_graphql::Result<Option<ScopePermissions>> {
        if persona.is_default_persona {
            let scope = self.load_one(ScopeId(scope_id)).await
                .map_err(|e| {
                    tracing::error!(err = %e, scope_id = %scope_id, "GRAPHQL.SCOPE_PERMISSION_FETCHER.FAILED_TO_FETCH_SCOPE");
                    async_graphql::Error::new("Internal server error")
                })?;
            let Some(scope) = scope else {
                tracing::error!(scope_id = %scope_id, "GRAPHQL.SCOPE_PERMISSION_FETCHER.SCOPE_NOT_FOUND");
                return Ok(None);
            };
            if scope.owner_account_id == persona.token.account_id {
                return Ok(Some(ScopePermissions::owner()));
            }
        }

        self
            .load_one(ScopePermissionId {
                scope_id,
                persona_id: persona.persona_id
            })
            .await
            .map_err(|e| {
                tracing::error!(err = %e, scope_id = %scope_id, persona_id = %persona.persona_id, "GRAPHQL.SCOPE_PERMISSION_FETCHER.FAILED_TO_FETCH_PERMISSION");
                async_graphql::Error::new("Internal server error")
            })
            .map(|x| x.map(|x| ScopePermissions {
                can_read_note_revisions: x.can_read_note_revisions,
                can_modify_notes: x.can_modify_notes,
                can_add_their_notes_to_child: x.can_add_their_notes_to_child
            }))
    }
}
