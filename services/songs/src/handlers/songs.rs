use actix_multipart::Multipart;
use actix_web::{HttpResponse, web};
use crate::services::song_service::{SongService, SongServiceContract};

use futures::StreamExt;

// Handler for POST /songs/upload.
// actix-web injects `service` from app_data (shared state wrapped in Arc via web::Data)
// and `payload` from the incoming multipart/form-data request body.
// The return type is Result<HttpResponse, actix_web::Error> so we can use ? to propagate
// errors — actix-web automatically converts them into the appropriate HTTP error response.
pub async fn upload(service: web::Data<SongService>, mut payload: Multipart) -> Result<HttpResponse, actix_web::Error> {
    // Accumulators for each expected form field.
    // Refactor later with a hashmap.
    let mut title = String::new();
    let mut artist = String::new();
    let mut uploaded_by = String::new();
    let mut file_bytes: Vec<u8> = Vec::new();
    let mut extension = String::new();

    // Multipart is an async stream — each iteration yields one form field.
    // `payload.next().await` returns Some(field) until the stream is exhausted.
    while let Some(item) = payload.next().await {
        // Unwrap the field or propagate the error as a 500.
        let mut field = item.map_err(actix_web::error::ErrorInternalServerError)?;

        // content_disposition holds the field metadata (name, filename).
        // If a field has no content disposition we skip it — it's malformed.
        let Some(content_disposition) = field.content_disposition() else {
            continue;
        };

        // `name` is the form field name, e.g. "file", "title", "artist".
        // `filename` is only present for file fields.
        let name = content_disposition.get_name().unwrap_or("").to_string();
        let filename = content_disposition.get_filename().map(|f| f.to_string());

        // Each field is itself a stream of byte chunks (the field's content may
        // arrive in multiple packets). We collect them all into a single Vec<u8>.
        let mut bytes = Vec::new();
        while let Some(chunk) = field.next().await {
            // Propagate chunk errors as 400 — malformed body from the client.
            let data = chunk.map_err(actix_web::error::ErrorBadRequest)?;
            bytes.extend_from_slice(&data);
        }

        // Route the collected bytes to the right variable based on the field name.
        match name.as_str() {
            "file" => {
                // Extract the file extension from the original filename (e.g. "mp3" from "song.mp3").
                // rsplit('.') splits from the right, so .next() gives us the last segment.
                if let Some(fname) = filename {
                    extension = fname.rsplit('.').next().unwrap_or("").to_string();
                }
                file_bytes = bytes;
            }
            // Text fields arrive as UTF-8 bytes — convert them to String.
            // from_utf8_lossy replaces invalid sequences with ? instead of failing.
            "title" => title = String::from_utf8_lossy(&bytes).to_string(),
            "artist" => artist = String::from_utf8_lossy(&bytes).to_string(),
            "uploaded_by" => uploaded_by = String::from_utf8_lossy(&bytes).to_string(),
            // Ignore any unexpected fields.
            _ => {}
        }
    }

    // Delegate to the service layer which handles file storage and DB insertion.
    // map_err converts the service error into a 500 so ? can propagate it.
    let response = service
        .load_song(title, file_bytes, artist, &extension, uploaded_by)
        .await
        .map_err(actix_web::error::ErrorInternalServerError)?;

    // 201 Created with the new song's ID in the response body.
    Ok(HttpResponse::Created().json(response.id))
}
