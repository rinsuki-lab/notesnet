use std::sync::Arc;

use async_graphql::dataloader::Loader;

use crate::server::handlers::api::v1::graphql::types;

#[derive(Clone, Debug, PartialEq, Eq, Hash)]
pub struct ScopePermissionId {
    pub scope_id: uuid::Uuid,
    pub persona_id: uuid::Uuid,
}

impl Loader<ScopePermissionId> for super::DatabaseLoader {
    type Value = Arc<types::scope_permissions::ScopePermissions>;
    type Error = Arc<sqlx::Error>;

    async fn load(
        &self,
        keys: &[ScopePermissionId],
    ) -> Result<std::collections::HashMap<ScopePermissionId, Self::Value>, Self::Error> {
        let scope_ids = keys.iter().map(|key| key.scope_id).collect::<Vec<_>>();
        let persona_ids = keys.iter().map(|key| key.persona_id).collect::<Vec<_>>();

        let rows = sqlx::query!(
            r#"
            SELECT scope_personas.scope_id, scope_personas.persona_id, can_read_note_revisions, can_modify_notes, can_add_their_notes_to_child
            FROM scope_personas
            JOIN UNNEST($1::uuid[], $2::uuid[]) AS k(scope_id, persona_id)
                ON scope_personas.scope_id = k.scope_id AND scope_personas.persona_id = k.persona_id
            "#,
            &scope_ids,
            &persona_ids
        ).fetch_all(&self.db)
        .await?;

        Ok(rows
            .into_iter()
            .map(|row| {
                let permissions = types::scope_permissions::ScopePermissions {
                    can_read_note_revisions: row.can_read_note_revisions,
                    can_modify_notes: row.can_modify_notes,
                    can_add_their_notes_to_child: row.can_add_their_notes_to_child,
                };
                (
                    ScopePermissionId {
                        scope_id: row.scope_id,
                        persona_id: row.persona_id,
                    },
                    Arc::new(permissions),
                )
            })
            .collect())
    }
}
