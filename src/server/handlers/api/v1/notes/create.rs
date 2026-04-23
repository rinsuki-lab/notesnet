use axum::{Json, extract::State, response::IntoResponse};
use chrono::{DateTime, Utc};
use itertools::Itertools;
use std::collections::{HashMap, HashSet};

use crate::server::AppState;
use crate::server::extractors::ResolvedPersona;

#[derive(serde::Deserialize, utoipa::ToSchema)]
pub struct CreateNoteParent {
    parent_note_id: uuid::Uuid,
    #[serde(default = "default_true")]
    should_listed_as_child: bool,
    #[serde(default = "default_true")]
    should_listed_as_parent: bool,
    order_child: Option<i32>,
}

fn default_true() -> bool {
    true
}

#[derive(serde::Deserialize, utoipa::ToSchema)]
pub struct CreateNoteRequest {
    scope_id: uuid::Uuid,
    summary: Option<String>,
    text_for_search: String,
    content_type: String,
    attributes: serde_json::Value,
    content: serde_json::Value,
    started_at: Option<DateTime<Utc>>,
    written_at: Option<DateTime<Utc>>,
    #[serde(default)]
    parents: Vec<CreateNoteParent>,
}

#[derive(serde::Serialize, utoipa::ToSchema)]
pub struct CreateNoteResponse {
    note_id: String,
    note_revision_id: String,
}

pub enum CreateNoteError {
    ServerError,
    ScopeNotFound,
    ParentNoteNotFound,
    ParentNoteForbidden,
    DuplicateParent,
}

impl IntoResponse for CreateNoteError {
    fn into_response(self) -> axum::response::Response {
        match self {
            CreateNoteError::ServerError => (
                axum::http::StatusCode::INTERNAL_SERVER_ERROR,
                "Internal Server Error",
            ),
            CreateNoteError::ScopeNotFound => {
                (axum::http::StatusCode::NOT_FOUND, "Scope not found")
            }
            CreateNoteError::ParentNoteNotFound => {
                (axum::http::StatusCode::NOT_FOUND, "Parent note not found")
            }
            CreateNoteError::ParentNoteForbidden => (
                axum::http::StatusCode::FORBIDDEN,
                "No permission to add child to parent note",
            ),
            CreateNoteError::DuplicateParent => (
                axum::http::StatusCode::UNPROCESSABLE_ENTITY,
                "Duplicate parent_note_id in parents",
            ),
        }
        .into_response()
    }
}

#[utoipa::path(
    post,
    path = "/api/v1/notes",
    request_body = CreateNoteRequest,
    responses(
        (status = 200, description = "Note created", body = CreateNoteResponse),
        (status = 400, description = "Invalid X-NotesNet-Persona header"),
        (status = 401, description = "Unauthorized"),
        (status = 403, description = "Persona mismatch or forbidden"),
        (status = 404, description = "Scope, parent note, or persona not found"),
        (status = 422, description = "Duplicate parent"),
        (status = 500, description = "Internal server error"),
    ),
    security(
        ("bearer" = [])
    )
)]
pub async fn create_note(
    State(state): State<AppState>,
    ResolvedPersona {
        token, persona_id, ..
    }: ResolvedPersona,
    Json(body): Json<CreateNoteRequest>,
) -> Result<Json<CreateNoteResponse>, CreateNoteError> {
    let scope_id = body.scope_id;

    let summary = body.summary.filter(|s| !s.is_empty());
    let written_at = body.written_at.unwrap_or_else(Utc::now);

    // 入力値検証 (DB操作前)
    let mut seen_parent_ids = HashSet::new();
    for parent in &body.parents {
        if !seen_parent_ids.insert(parent.parent_note_id) {
            return Err(CreateNoteError::DuplicateParent);
        }
    }

    let mut tx = state.db.begin().await.map_err(|e| {
        tracing::error!(err = %e, "CREATE_NOTE.FAILED_TO_BEGIN_TX");
        CreateNoteError::ServerError
    })?;

    // スコープの存在確認 & 権限確認 (tx 内で実行)
    // デフォルトペルソナならオーナーとして全権限、それ以外は scope_personas で判定
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
        CreateNoteError::ServerError
    })?;
    if has_permission.is_none() {
        return Err(CreateNoteError::ScopeNotFound);
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
        CreateNoteError::ServerError
    })?;

    // 親ノートの存在確認 & ロック取得 (一括)
    if !body.parents.is_empty() {
        let parent_ids: Vec<uuid::Uuid> = body.parents.iter().map(|p| p.parent_note_id).collect();
        let locked_parents = sqlx::query!(
            "SELECT id, scope_id FROM notes WHERE id = ANY($1) FOR UPDATE",
            &parent_ids,
        )
        .fetch_all(&mut *tx)
        .await
        .map_err(|e| {
            tracing::error!(err = %e, "CREATE_NOTE.FAILED_TO_FETCH_PARENT_NOTES");
            CreateNoteError::ServerError
        })?;

        if locked_parents.len() != parent_ids.len() {
            return Err(CreateNoteError::ParentNoteNotFound);
        }

        let parent_scope_map: HashMap<uuid::Uuid, uuid::Uuid> = locked_parents
            .into_iter()
            .map(|r| (r.id, r.scope_id))
            .collect();

        // ユニークなscope_idごとに権限チェック
        let unique_scope_ids: Vec<uuid::Uuid> = parent_scope_map
            .values()
            .copied()
            .collect::<HashSet<_>>()
            .into_iter()
            .collect();

        // デフォルトペルソナならオーナーとして全権限、
        // それ以外は当該ペルソナ自身に can_add_their_notes_to_child が必要
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
            CreateNoteError::ServerError
        })?;

        let permitted_set: HashSet<uuid::Uuid> = permitted_scopes.into_iter().collect();
        for scope_id in &unique_scope_ids {
            if !permitted_set.contains(scope_id) {
                return Err(CreateNoteError::ParentNoteForbidden);
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
        body.text_for_search,
        body.content_type,
        body.attributes,
        body.content,
        body.started_at,
        written_at,
    )
    .fetch_one(&mut *tx)
    .await
    .map_err(|e| {
        tracing::error!(err = %e, "CREATE_NOTE.FAILED_TO_INSERT_REVISION");
        CreateNoteError::ServerError
    })?;

    // note_relationships の一括挿入
    if !body.parents.is_empty() {
        let (
            parent_note_ids,
            child_note_ids,
            should_listed_as_child,
            should_listed_as_parent,
            order_child,
        ): (Vec<_>, Vec<_>, Vec<_>, Vec<_>, Vec<_>) = body
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
            CreateNoteError::ServerError
        })?;
    }

    tx.commit().await.map_err(|e| {
        tracing::error!(err = %e, "CREATE_NOTE.FAILED_TO_COMMIT_TX");
        CreateNoteError::ServerError
    })?;

    tracing::info!(note_id = %note_id, revision_id = %revision_id, "CREATE_NOTE.SUCCESS");

    Ok(Json(CreateNoteResponse {
        note_id: note_id.to_string(),
        note_revision_id: revision_id.to_string(),
    }))
}
