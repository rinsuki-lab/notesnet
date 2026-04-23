use chrono::{DateTime, Utc};

use crate::server::{AppState, extractors::ResolvedPersona};

struct Viewer {
    id: uuid::Uuid,
    name: String,
    persona_id: uuid::Uuid,
}

#[derive(async_graphql::SimpleObject)]
struct ScopePermissions {
    can_read_note_revisions: bool,
    can_modify_notes: bool,
    can_add_their_notes_to_child: bool,
}

struct Scope {
    id: uuid::Uuid,
    name: String,
    permissions: ScopePermissions,
    created_at: DateTime<Utc>,
}

#[async_graphql::Object]
impl Scope {
    async fn id(&self) -> String {
        self.id.to_string()
    }

    async fn name(&self) -> &str {
        &self.name
    }

    async fn permissions(&self) -> &ScopePermissions {
        &self.permissions
    }
}

#[async_graphql::Object]
impl Viewer {
    async fn id(&self) -> &uuid::Uuid {
        &self.id
    }

    async fn name(&self) -> &str {
        &self.name
    }

    async fn scopes(&self, ctx: &async_graphql::Context<'_>) -> async_graphql::Result<Vec<Scope>> {
        let state = ctx.data_unchecked::<AppState>();
        let persona_id = self.persona_id;

        struct OwnedScopeRow {
            id: uuid::Uuid,
            name: String,
            created_at: DateTime<Utc>,
        }

        struct MemberScopeRow {
            id: uuid::Uuid,
            name: String,
            created_at: DateTime<Utc>,
            can_read_note_revisions: bool,
            can_modify_notes: bool,
            can_add_their_notes_to_child: bool,
        }

        let owned_rows = sqlx::query_as!(
            OwnedScopeRow,
            r#"
            SELECT
                scopes.id,
                scopes.name,
                scopes.created_at
            FROM scopes
            JOIN personas ON personas.account_id = scopes.owner_account_id AND personas.name IS NULL AND personas.id = $1
            "#,
            persona_id,
        )
        .fetch_all(&state.db)
        .await
        .map_err(|e| {
            tracing::error!(err = %e, "VIEWER_SCOPES.FAILED_TO_FETCH_OWNED");
            async_graphql::Error::new("Internal server error")
        })?;

        let member_rows = sqlx::query_as!(
            MemberScopeRow,
            r#"
            SELECT
                scopes.id,
                scopes.name,
                scopes.created_at,
                scope_personas.can_read_note_revisions,
                scope_personas.can_modify_notes,
                scope_personas.can_add_their_notes_to_child
            FROM scope_personas
            JOIN scopes ON scopes.id = scope_personas.scope_id
            WHERE scope_personas.persona_id = $1
            AND NOT EXISTS (
                SELECT 1 FROM personas
                WHERE personas.account_id = scopes.owner_account_id
                    AND personas.name IS NULL
                    AND personas.id = $1
            )
            "#,
            persona_id,
        )
        .fetch_all(&state.db)
        .await
        .map_err(|e| {
            tracing::error!(err = %e, "VIEWER_SCOPES.FAILED_TO_FETCH_MEMBER");
            async_graphql::Error::new("Internal server error")
        })?;

        let mut items: Vec<Scope> = owned_rows
            .into_iter()
            .map(|r| Scope {
                id: r.id,
                name: r.name,
                permissions: ScopePermissions {
                    can_read_note_revisions: true,
                    can_modify_notes: true,
                    can_add_their_notes_to_child: true,
                },
                created_at: r.created_at,
            })
            .collect();

        items.extend(member_rows.into_iter().map(|r| Scope {
            id: r.id,
            name: r.name,
            permissions: ScopePermissions {
                can_read_note_revisions: r.can_read_note_revisions,
                can_modify_notes: r.can_modify_notes,
                can_add_their_notes_to_child: r.can_add_their_notes_to_child,
            },
            created_at: r.created_at,
        }));

        items.sort_by_key(|item| item.created_at);

        Ok(items)
    }
}

#[derive(Default)]
pub struct ViewerQuery;

#[async_graphql::Object]
impl ViewerQuery {
    async fn viewer(&self, ctx: &async_graphql::Context<'_>) -> Viewer {
        let state = ctx.data_unchecked::<AppState>();
        let persona = ctx.data_unchecked::<ResolvedPersona>();

        let account = sqlx::query!(
            "SELECT id, name FROM accounts WHERE id = $1",
            persona.token.account_id
        )
        .fetch_one(&state.db)
        .await
        .unwrap();
        Viewer {
            id: account.id,
            name: account.name,
            persona_id: persona.persona_id,
        }
    }
}
