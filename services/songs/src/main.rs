mod db;
mod handlers;
mod models;
mod repositories;
mod services;

use crate::models::song::Song;
use crate::services::song_service::SongService;
use db::{DatabaseRegistry, DbConnect};
use dotenvy;

use mongodb::Collection;

use crate::repositories::song_repository::SongRepository;
use crate::services::file_service::FileService;

use actix_web::{web, App, HttpServer};

#[tokio::main]
// The box error return type does not convince me
async fn main() -> Result<(), Box<dyn std::error::Error>> {
    // Do that in the same service.
    dotenvy::dotenv().ok();
    let mongo_uri = std::env::var("MONGO_URI").expect("Didn't load mongo uri");
    let song_uri = std::env::var("SONGS_DB").expect("Didn't get SONG_DB");
    let upload_directory =
        std::env::var("AUDIO_LOCAL_STORAGE").expect("Your audio storage var is not set");

    let database = DatabaseRegistry.connect(&mongo_uri, &song_uri).await;
    let connected = match database {
        Ok(connection) => connection,
        Err(err) => return Err(err),
    };

    let collection: Collection<Song> = connected.collection::<Song>("song");
    let song_repository = SongRepository::new(collection);
    let file_service = FileService::new(upload_directory);
    let song_service = web::Data::new(SongService::new(file_service, song_repository));

    HttpServer::new(move || {
        App::new()
            .app_data(song_service.clone())
            .route("songs/upload", web::post().to(handlers::songs::upload))
    })
    .bind("127.0.0.1:8080")?
    .run()
    .await?;

    Ok(())
}
