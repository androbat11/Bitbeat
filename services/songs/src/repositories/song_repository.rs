use mongodb::Collection;
use mongodb::error::Error as MongoError;
use crate::models::song::Song;

pub struct SongRepository {
    collection: Collection<Song>
}

impl SongRepository {
    pub fn new(collection: Collection<Song>) -> Self {
        Self { collection }
    }

    pub async fn insert(&self, song: Song) -> Result<String, MongoError> {
        let result = self.collection.insert_one(song).await?;
        let id = result
            .inserted_id
            .as_object_id()
            .ok_or(MongoError::custom("invalid inserted id"))?;
        Ok(id.to_hex())
    }
}