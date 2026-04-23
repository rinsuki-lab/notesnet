mod viewer;
mod note;

#[derive(async_graphql::MergedObject, Default)]
pub struct Query(pub viewer::ViewerQuery, pub note::NoteQuery);
