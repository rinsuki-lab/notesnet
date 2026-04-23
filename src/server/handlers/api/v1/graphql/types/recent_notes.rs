use std::sync::Arc;

use super::note::Note;

#[derive(async_graphql::SimpleObject)]
pub struct RecentNotes {
    pub nodes: Vec<Arc<Note>>,
    pub next_cursor: Option<String>,
    pub prev_cursor: Option<String>,
}
