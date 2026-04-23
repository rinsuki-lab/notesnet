#[derive(async_graphql::SimpleObject)]
pub struct NoteExternal {
    pub id: String,
    pub service: String,
}
