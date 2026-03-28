use std::io::Error;

use crate::services::file_service::{FileService, FileStorage};
use crate::repositories::song_repository::SongRepository;
use crate::models::song::Song;

struct CreateSongResponse {
    id: String
}

pub struct SongService {
    file_service: FileService,
    song_repository: SongRepository
}

impl SongService {
    pub fn new (file_service: FileService, song_repository: SongRepository) -> Self {
        SongService {
            file_service,
            song_repository
        }
    }
}
trait SongServiceContract {
    async fn load_song(&self, title: String, file: Vec<u8>, artist: String, extension: &str, uploaded_by: String) -> Result<CreateSongResponse, Box<dyn std::error::Error>>;
}

// * Think: Which assumpltion I might be taking for granted?
impl SongServiceContract for SongService {
    async fn load_song(&self, title: String, file: Vec<u8>, artist: String, extension: &str, uploaded_by: String) -> Result<CreateSongResponse, Box<dyn std::error::Error>> {
        let file_path = self.file_service.upload_song(file, extension).await?;
        let song = Song {
            id: None,
            title,
            artist,
            file_path,
            uploaded_by
        };
        let id = self.song_repository.insert(song).await?;
        Ok(CreateSongResponse { id })
    }   
}

