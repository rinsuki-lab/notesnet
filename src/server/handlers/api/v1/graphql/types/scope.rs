pub struct Scope {
    pub id: uuid::Uuid,
    pub name: String,
    pub owner_account_id: uuid::Uuid,
}

#[async_graphql::Object]
impl Scope {
    async fn id(&self) -> &uuid::Uuid {
        &self.id
    }

    async fn name(&self) -> &str {
        &self.name
    }
}
