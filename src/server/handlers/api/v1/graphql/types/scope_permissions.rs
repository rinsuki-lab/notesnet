#[derive(async_graphql::SimpleObject)]
pub struct ScopePermissions {
    pub can_read_note_revisions: bool,
    pub can_modify_notes: bool,
    pub can_add_their_notes_to_child: bool,
}

impl ScopePermissions {
    pub fn owner() -> Self {
        Self {
            can_read_note_revisions: true,
            can_modify_notes: true,
            can_add_their_notes_to_child: true,
        }
    }
}
