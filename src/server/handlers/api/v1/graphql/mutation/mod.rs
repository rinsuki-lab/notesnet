mod create_new_note;

pub use create_new_note::CreateNewNoteMutation;

#[derive(async_graphql::MergedObject, Default)]
pub struct Mutation(pub CreateNewNoteMutation);
