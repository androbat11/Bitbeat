use mongodb::{Client, Database};

pub trait DbConnect {
    async fn connect(&self, url: &str, db: &str) -> Result<Database, mongo::error::Error>;
}

pub struct DatabaseRegistry;

impl DbConnect for DatabaseRegistry {
    async fn connect(&self, url: &str, db: &str) -> Result<Database, mongo::error::Error> {
        let client = Client::with_uri_str(url).await?;
        Ok(client.database(db))
    }
}