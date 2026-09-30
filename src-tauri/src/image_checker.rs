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
    pub format: String,
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

    let content_type = response
        .headers()
        .get(reqwest::header::CONTENT_TYPE)
        .and_then(|value| value.to_str().ok())
        .map(|value| value.split(';').next().unwrap_or(value).trim().to_owned());

    let bytes = response
        .bytes()
        .await
        .map_err(|err| format!("failed to read image bytes: {err}"))?;

    let format = detect_format(&bytes, content_type.as_deref());

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
        format,
    })
}

fn detect_format(bytes: &[u8], content_type: Option<&str>) -> String {
    if let Ok(format) = image::guess_format(bytes) {
        return match format {
            image::ImageFormat::Png => "PNG".into(),
            image::ImageFormat::Jpeg => "JPEG".into(),
            image::ImageFormat::Gif => "GIF".into(),
            image::ImageFormat::WebP => "WebP".into(),
            image::ImageFormat::Bmp => "BMP".into(),
            image::ImageFormat::Tiff => "TIFF".into(),
            image::ImageFormat::Ico => "ICO".into(),
            other => format!("{other:?}"),
        };
    }

    match content_type {
        Some("image/png") => "PNG".into(),
        Some("image/jpeg") | Some("image/jpg") => "JPEG".into(),
        Some("image/gif") => "GIF".into(),
        Some("image/webp") => "WebP".into(),
        Some("image/svg+xml") => "SVG".into(),
        Some(other) => other.to_owned(),
        None => "Unknown".into(),
    }
}
