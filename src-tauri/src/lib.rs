pub mod clipboard_watcher;
pub mod image_checker;
pub mod parser;
pub mod validator;

use image_checker::ImageInfo;
use parser::MetaData;
use serde::{Deserialize, Serialize};
use thiserror::Error;
use validator::ValidationReport;

#[derive(Debug, Serialize, Deserialize, Clone)]
#[serde(rename_all = "camelCase")]
pub struct InspectResult {
    pub source_url: String,
    pub resolved_url: String,
    pub meta: MetaData,
    pub validation: ValidationReport,
    pub image_info: Option<ImageInfo>,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
#[serde(rename_all = "camelCase")]
pub struct BatchInspectRow {
    pub url: String,
    pub title: Option<String>,
    pub og_image_present: bool,
    pub status: String,
    pub image_url: Option<String>,
    pub error: Option<String>,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
#[serde(rename_all = "camelCase")]
pub struct BatchInspectResult {
    pub rows: Vec<BatchInspectRow>,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
#[serde(rename_all = "camelCase")]
pub struct CompareDiff {
    pub field: String,
    pub staging: Option<String>,
    pub production: Option<String>,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
#[serde(rename_all = "camelCase")]
pub struct CompareResult {
    pub staging: InspectResult,
    pub production: InspectResult,
    pub differences: Vec<CompareDiff>,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
#[serde(rename_all = "camelCase")]
pub struct SiteMonitorPageResult {
    pub url: String,
    pub title: Option<String>,
    pub image_url: Option<String>,
    pub status: String,
    pub missing_og_image: bool,
    pub missing_description: bool,
    pub invalid_image_size: bool,
    pub warning_count: usize,
    pub error: Option<String>,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
#[serde(rename_all = "camelCase")]
pub struct SiteMonitorResult {
    pub site_url: String,
    pub discovery_source: String,
    pub pages_scanned: usize,
    pub missing_og_image: usize,
    pub missing_description: usize,
    pub invalid_image_size: usize,
    pub pages: Vec<SiteMonitorPageResult>,
}

#[derive(Debug, Error)]
pub enum InspectError {
    #[error("unsupported url: {0}")]
    InvalidUrl(String),
    #[error("network error: {0}")]
    Network(String),
    #[error("unexpected error: {0}")]
    Unexpected(String),
}

pub async fn inspect_url(url: &str) -> Result<InspectResult, InspectError> {
    parser::inspect_url(url).await
}

pub async fn batch_inspect_urls(urls: Vec<String>) -> BatchInspectResult {
    let mut rows = Vec::new();

    for raw in urls {
        let url = raw.trim().to_owned();
        if url.is_empty() {
            continue;
        }

        match inspect_url(&url).await {
            Ok(result) => {
                let image_url = result
                    .meta
                    .og_image
                    .clone()
                    .or_else(|| result.meta.twitter_image.clone());

                rows.push(BatchInspectRow {
                    url,
                    title: result
                        .meta
                        .og_title
                        .clone()
                        .or_else(|| result.meta.twitter_title.clone()),
                    og_image_present: image_url.is_some(),
                    status: if image_url.is_some() {
                        "OK".to_owned()
                    } else {
                        "Missing OG image".to_owned()
                    },
                    image_url,
                    error: None,
                });
            }
            Err(err) => {
                rows.push(BatchInspectRow {
                    url,
                    title: None,
                    og_image_present: false,
                    status: "Error".to_owned(),
                    image_url: None,
                    error: Some(err.to_string()),
                });
            }
        }
    }

    BatchInspectResult { rows }
}

pub async fn compare_environments(staging_url: &str, production_url: &str) -> Result<CompareResult, InspectError> {
    let staging = inspect_url(staging_url).await?;
    let production = inspect_url(production_url).await?;

    let mut differences = Vec::new();

    push_diff(
        &mut differences,
        "og:title",
        staging.meta.og_title.clone(),
        production.meta.og_title.clone(),
    );
    push_diff(
        &mut differences,
        "og:description",
        staging.meta.og_description.clone(),
        production.meta.og_description.clone(),
    );
    push_diff(
        &mut differences,
        "og:image",
        staging.meta.og_image.clone(),
        production.meta.og_image.clone(),
    );
    push_diff(
        &mut differences,
        "twitter:card",
        staging.meta.twitter_card.clone(),
        production.meta.twitter_card.clone(),
    );
    push_diff(
        &mut differences,
        "twitter:title",
        staging.meta.twitter_title.clone(),
        production.meta.twitter_title.clone(),
    );
    push_diff(
        &mut differences,
        "twitter:description",
        staging.meta.twitter_description.clone(),
        production.meta.twitter_description.clone(),
    );
    push_diff(
        &mut differences,
        "twitter:image",
        staging.meta.twitter_image.clone(),
        production.meta.twitter_image.clone(),
    );

    Ok(CompareResult {
        staging,
        production,
        differences,
    })
}

pub async fn monitor_site_metadata(site_url: &str, max_pages: usize) -> Result<SiteMonitorResult, InspectError> {
    let page_limit = max_pages.clamp(1, 500);
    let (urls, discovery_source) = parser::discover_site_pages(site_url, page_limit).await?;
    let client = parser::build_http_client()?;

    let mut missing_og_image = 0usize;
    let mut missing_description = 0usize;
    let mut invalid_image_size = 0usize;
    let mut pages = Vec::new();

    for url in urls {
        match parser::inspect_url_with_client(&client, &url).await {
            Ok(result) => {
                let missing_image = result.meta.og_image.is_none();
                let missing_desc = result.meta.og_description.is_none();
                let invalid_size = result.validation.warnings.iter().any(|w| {
                    w.contains("Image resolution too small") || w.contains("Incorrect aspect ratio")
                });

                if missing_image {
                    missing_og_image += 1;
                }
                if missing_desc {
                    missing_description += 1;
                }
                if invalid_size {
                    invalid_image_size += 1;
                }

                pages.push(SiteMonitorPageResult {
                    url,
                    title: result
                        .meta
                        .og_title
                        .clone()
                        .or_else(|| result.meta.twitter_title.clone()),
                    image_url: result
                        .meta
                        .og_image
                        .clone()
                        .or_else(|| result.meta.twitter_image.clone()),
                    status: if result.validation.warnings.is_empty() {
                        "OK".to_owned()
                    } else {
                        "Issues".to_owned()
                    },
                    missing_og_image: missing_image,
                    missing_description: missing_desc,
                    invalid_image_size: invalid_size,
                    warning_count: result.validation.warnings.len(),
                    error: None,
                });
            }
            Err(err) => {
                pages.push(SiteMonitorPageResult {
                    url,
                    title: None,
                    image_url: None,
                    status: "Error".to_owned(),
                    missing_og_image: false,
                    missing_description: false,
                    invalid_image_size: false,
                    warning_count: 0,
                    error: Some(err.to_string()),
                });
            }
        }
    }

    Ok(SiteMonitorResult {
        site_url: site_url.to_owned(),
        discovery_source,
        pages_scanned: pages.len(),
        missing_og_image,
        missing_description,
        invalid_image_size,
        pages,
    })
}

fn push_diff(differences: &mut Vec<CompareDiff>, field: &str, staging: Option<String>, production: Option<String>) {
    if staging != production {
        differences.push(CompareDiff {
            field: field.to_owned(),
            staging,
            production,
        });
    }
}
