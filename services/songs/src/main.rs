mod services;
mod repositories;
mod models;
mod db;

use dotenvy;
use db::{DatabaseRegistry, DbConnect};
use crate::models::song::Song;

use mongodb::{Collection};

use crate::repositories::song_repository::SongRepository;


#[tokio::main]
// The box error return type does not convince me
async fn main() -> Result<(), Box<dyn std::error::Error>> {
    // Do that in the same service.
    dotenvy::dotenv().ok();
    let mongo_uri = std::env::var("MONGO_URI").expect("Didn't load mongo uri");
    let song_uri = std::env::var("SONGS_DB").expect("Didn't get SONG_DB");
    let upload_directory = std::env::var("AUDIO_LOCAL_STORAGE").expect("Your audio storage var is not set");

    let database = DatabaseRegistry.connect(&mongo_uri, &song_uri).await;
    let connected = match database {
        Ok(connection) => connection,
        Err(err) => return Err(err)
    };

    let collection: Collection<Song> = connected.collection::<Song>("song");
    let song_repository = SongRepository::new(collection);

    

    Ok(())  
}
