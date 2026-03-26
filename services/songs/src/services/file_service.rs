use std::{io::Error};
use uuid::Uuid; 
use tokio::fs;

type FilePathReturned = String;

// Should be a &string not 
pub struct FileService {
    upload_directory: String
}

trait FileStorage {
    async fn upload_song(&self, file: Vec<u8>, extension: &str) -> Result<FilePathReturned, Error>;
}

fn create_uuid() -> Uuid {
    Uuid::new_v4()
}

async fn write_file(path: String, file: Vec<u8>) -> Result<String, Error> {
        match fs::write(&path, file).await {
            Ok(_) => Ok(path),
            Err(err) => return Err(err)
        }
    }

impl FileService {
    fn new (upload_directory: String) -> Self {
        FileService { upload_directory }
    }
}

impl FileStorage for FileService {
    // Is it <u8> enough for a song?
    /* 
    Even though that's going to depend on the file,
    I don't know if that should be the limit. But what if the
    User just wants to store a podcast, for example mp4 or mp3?
    That should be possible.
    
     */
    
    
    async fn upload_song(&self, file: Vec<u8>, extension: &str) -> Result<FilePathReturned, Error> {
        let uuid = create_uuid();
        // uuid format on audio file so we don't repeat files
        let raw_audio_path = format!("{}.{}", uuid, extension);
        let full_upload_route = format!("/{}/{}", self.upload_directory, raw_audio_path);
        
        write_file(full_upload_route, file).await
    } 

    
}