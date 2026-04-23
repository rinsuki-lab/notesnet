mod note;
mod recent_notes;
mod viewer;

#[derive(async_graphql::MergedObject, Default)]
pub struct Query(
    pub viewer::ViewerQuery,
    pub note::NoteQuery,
    pub recent_notes::RecentNotesQuery,
);
