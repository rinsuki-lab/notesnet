mod note;
mod viewer;

#[derive(async_graphql::MergedObject, Default)]
pub struct Query(pub viewer::ViewerQuery, pub note::NoteQuery);
