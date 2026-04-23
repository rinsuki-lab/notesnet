pub struct DatabaseLoader {
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
