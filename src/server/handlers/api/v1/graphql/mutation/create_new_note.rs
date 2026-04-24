use std::collections::{HashMap, HashSet};

use chrono::{DateTime, Utc};
use itertools::Itertools;

use async_graphql::ErrorExtensions;

use crate::server::AppState;
use crate::server::extractors::ResolvedPersona;
use crate::server::handlers::api::v1::graphql::types::note::Note;

#[derive(async_graphql::InputObject)]
pub struct CreateNoteParentInput {
    pub parent_note_id: uuid::Uuid,
    #[graphql(default = true)]
    pub should_listed_as_child: bool,
    #[graphql(default = true)]
    pub should_listed_as_parent: bool,
    pub order_child: Option<i32>,
}

#[derive(async_graphql::InputObject)]
pub struct CreateNoteInput {
    pub scope_id: uuid::Uuid,
    pub summary: Option<String>,
    pub text_for_search: String,
    pub content_type: String,
    pub attributes: async_graphql::Json<serde_json::Value>,
    pub content: async_graphql::Json<serde_json::Value>,
    pub started_at: Option<DateTime<Utc>>,
    pub written_at: Option<DateTime<Utc>>,
    #[graphql(default)]
    pub parents: Vec<CreateNoteParentInput>,
}

#[derive(Default)]
pub struct CreateNewNoteMutation;

#[async_graphql::Object]
impl CreateNewNoteMutation {
    async fn create_new_note(
        &self,
        ctx: &async_graphql::Context<'_>,
        input: CreateNoteInput,
    ) -> async_graphql::Result<Note> {
        let state = ctx.data_unchecked::<AppState>();
        let persona = ctx.data_unchecked::<ResolvedPersona>();
        let token = &persona.token;
        let persona_id = persona.persona_id;

        let scope_id = input.scope_id;
        let summary = input.summary.filter(|s| !s.is_empty());
        let written_at = input.written_at.unwrap_or_else(Utc::now);

        // 重複親チェック (DB操作前)
        let mut seen_parent_ids = HashSet::new();
        for parent in &input.parents {
            if !seen_parent_ids.insert(parent.parent_note_id) {
                return Err(
                    async_graphql::Error::new("Duplicate parent_note_id in parents")
                        .extend_with(|_, e| e.set("code", "BAD_REQUEST")),
                );
            }
        }

        let mut tx = state.db.begin().await.map_err(|e| {
            tracing::error!(err = %e, "CREATE_NOTE.FAILED_TO_BEGIN_TX");
            async_graphql::Error::new("Internal server error")
        })?;

        // スコープの存在確認 & 権限確認
        let has_permission = sqlx::query!(
            r#"SELECT 1 as _e FROM scopes
                JOIN personas ON personas.account_id = scopes.owner_account_id AND personas.name IS NULL
                WHERE scopes.id = $1 AND scopes.owner_account_id = $2 AND personas.id = $3
            UNION ALL
            SELECT 1 FROM scope_personas WHERE scope_id = $1 AND persona_id = $3 AND can_modify_notes = TRUE
            LIMIT 1"#,
            scope_id,
            token.account_id,
            persona_id,
        )
        .fetch_optional(&mut *tx)
        .await
        .map_err(|e| {
            tracing::error!(err = %e, "CREATE_NOTE.FAILED_TO_CHECK_SCOPE_PERMISSION");
            async_graphql::Error::new("Internal server error")
        })?;

        if has_permission.is_none() {
            return Err(async_graphql::Error::new("Scope not found")
                .extend_with(|_, e| e.set("code", "NOT_FOUND")));
        }

        let note_id = sqlx::query_scalar!(
            "INSERT INTO notes(id, author_persona_id, scope_id) VALUES (gen_random_uuid(), $1, $2) RETURNING id",
            persona_id,
            scope_id,
        )
        .fetch_one(&mut *tx)
        .await
        .map_err(|e| {
            tracing::error!(err = %e, "CREATE_NOTE.FAILED_TO_INSERT_NOTE");
            async_graphql::Error::new("Internal server error")
        })?;

        // 親ノートの存在確認 & 権限確認
        if !input.parents.is_empty() {
            let parent_ids: Vec<uuid::Uuid> =
                input.parents.iter().map(|p| p.parent_note_id).collect();

            let locked_parents = sqlx::query!(
                "SELECT id, scope_id FROM notes WHERE id = ANY($1) FOR UPDATE",
                &parent_ids,
            )
            .fetch_all(&mut *tx)
            .await
            .map_err(|e| {
                tracing::error!(err = %e, "CREATE_NOTE.FAILED_TO_FETCH_PARENT_NOTES");
                async_graphql::Error::new("Internal server error")
            })?;

            if locked_parents.len() != parent_ids.len() {
                return Err(async_graphql::Error::new("Parent note not found")
                    .extend_with(|_, e| e.set("code", "NOT_FOUND")));
            }

            let parent_scope_map: HashMap<uuid::Uuid, uuid::Uuid> = locked_parents
                .into_iter()
                .map(|r| (r.id, r.scope_id))
                .collect();

            let unique_scope_ids: Vec<uuid::Uuid> = parent_scope_map
                .values()
                .copied()
                .collect::<HashSet<_>>()
                .into_iter()
                .collect();

            let permitted_scopes: Vec<uuid::Uuid> = sqlx::query_scalar!(
                r#"SELECT scopes.id as "id!" FROM scopes
                    JOIN personas ON personas.account_id = scopes.owner_account_id AND personas.name IS NULL
                    WHERE scopes.id = ANY($1) AND scopes.owner_account_id = $2 AND personas.id = $3
                UNION
                SELECT scope_id as "id!" FROM scope_personas
                    WHERE scope_id = ANY($1) AND persona_id = $3 AND can_add_their_notes_to_child = TRUE"#,
                &unique_scope_ids,
                token.account_id,
                persona_id,
            )
            .fetch_all(&mut *tx)
            .await
            .map_err(|e| {
                tracing::error!(err = %e, "CREATE_NOTE.FAILED_TO_CHECK_PARENT_SCOPE_PERMISSIONS");
                async_graphql::Error::new("Internal server error")
            })?;

            let permitted_set: HashSet<uuid::Uuid> = permitted_scopes.into_iter().collect();
            for sid in &unique_scope_ids {
                if !permitted_set.contains(sid) {
                    return Err(async_graphql::Error::new(
                        "No permission to add child to parent note",
                    )
                    .extend_with(|_, e| e.set("code", "FORBIDDEN")));
                }
            }
        }

        let revision_id = sqlx::query_scalar!(
            r#"INSERT INTO note_revisions(id, note_id, author_persona_id, summary, text_for_search, content_type, attributes, content, started_at, written_at)
            VALUES (gen_random_uuid(), $1, $2, $3, $4, $5, $6, $7, $8, $9)
            RETURNING id"#,
            note_id,
            persona_id,
            summary,
            input.text_for_search,
            input.content_type,
            input.attributes.0,
            input.content.0,
            input.started_at,
            written_at,
        )
        .fetch_one(&mut *tx)
        .await
        .map_err(|e| {
            tracing::error!(err = %e, "CREATE_NOTE.FAILED_TO_INSERT_REVISION");
            async_graphql::Error::new("Internal server error")
        })?;

        // note_relationships の一括挿入
        if !input.parents.is_empty() {
            let (
                parent_note_ids,
                child_note_ids,
                should_listed_as_child,
                should_listed_as_parent,
                order_child,
            ): (Vec<_>, Vec<_>, Vec<_>, Vec<_>, Vec<_>) = input
                .parents
                .iter()
                .map(|p| {
                    (
                        p.parent_note_id,
                        note_id,
                        p.should_listed_as_child,
                        p.should_listed_as_parent,
                        p.order_child,
                    )
                })
                .multiunzip();

            sqlx::query!(
                r#"INSERT INTO note_relationships(id, parent_note_id, child_note_id, should_listed_as_child, should_listed_as_parent, order_child)
                SELECT gen_random_uuid(), unnest($1::uuid[]), unnest($2::uuid[]), unnest($3::bool[]), unnest($4::bool[]), unnest($5::int[])"#,
                &parent_note_ids,
                &child_note_ids,
                &should_listed_as_child,
                &should_listed_as_parent,
                &order_child as _,
            )
            .execute(&mut *tx)
            .await
            .map_err(|e| {
                tracing::error!(err = %e, "CREATE_NOTE.FAILED_TO_INSERT_RELATIONSHIPS");
                async_graphql::Error::new("Internal server error")
            })?;
        }

        tx.commit().await.map_err(|e| {
            tracing::error!(err = %e, "CREATE_NOTE.FAILED_TO_COMMIT_TX");
            async_graphql::Error::new("Internal server error")
        })?;

        tracing::info!(note_id = %note_id, revision_id = %revision_id, "CREATE_NOTE.SUCCESS");

        Ok(Note {
            id: note_id,
            scope_id,
            external: None,
            latest_revision_id: Some(revision_id),
        })
    }
}
