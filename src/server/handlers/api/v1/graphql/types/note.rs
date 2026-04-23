use super::note_external::NoteExternal;
use super::note_revision::NoteRevision;

pub struct Note {
    pub id: uuid::Uuid,
    pub external: Option<NoteExternal>,
    pub latest_revision: NoteRevision,
}

#[async_graphql::Object]
impl Note {
    async fn id(&self) -> &uuid::Uuid {
        &self.id
    }

    async fn external(&self) -> Option<&NoteExternal> {
        self.external.as_ref()
    }

    async fn latest_revision(&self) -> &NoteRevision {
        &self.latest_revision
    }
}
