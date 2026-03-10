use reqwest::Client;
use serde::{Deserialize, Serialize};

#[derive(Debug, Serialize, Deserialize, Clone)]
#[serde(rename_all = "camelCase")]
pub struct ImageInfo {
    pub url: String,
    pub width: u32,
    pub height: u32,
    pub file_size_bytes: u64,
    pub aspect_ratio: f32,
}

pub async fn inspect_image(client: &Client, image_url: &str) -> Result<ImageInfo, String> {
    let response = client
        .get(image_url)
        .send()
        .await
        .map_err(|err| format!("failed to fetch image: {err}"))?;

    if !response.status().is_success() {
        return Err(format!("image request failed with status {}", response.status()));
    }

    let bytes = response
        .bytes()
        .await
        .map_err(|err| format!("failed to read image bytes: {err}"))?;

    let dynamic = image::load_from_memory(&bytes)
        .map_err(|err| format!("failed to decode image dimensions: {err}"))?;

    let width = dynamic.width();
    let height = dynamic.height();
    let aspect_ratio = if height == 0 {
        0.0
    } else {
        width as f32 / height as f32
    };

    Ok(ImageInfo {
        url: image_url.to_owned(),
        width,
        height,
        file_size_bytes: bytes.len() as u64,
        aspect_ratio,
    })
}
