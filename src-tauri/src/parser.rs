use reqwest::Client;
use scraper::{Html, Selector};
use serde::{Deserialize, Serialize};
use std::collections::{HashMap, HashSet};
use std::time::Duration;
use url::Url;

use crate::image_checker::inspect_image;
use crate::validator;
use crate::{InspectError, InspectResult};

#[derive(Debug, Serialize, Deserialize, Clone, Default)]
#[serde(rename_all = "camelCase")]
pub struct MetaData {
    pub og_title: Option<String>,
    pub og_description: Option<String>,
    pub og_image: Option<String>,
    pub og_url: Option<String>,
    pub og_site_name: Option<String>,
    pub twitter_card: Option<String>,
    pub twitter_title: Option<String>,
    pub twitter_description: Option<String>,
    pub twitter_image: Option<String>,
    pub raw_tags: HashMap<String, String>,
}

pub fn build_http_client() -> Result<Client, InspectError> {
    Client::builder()
        .timeout(Duration::from_secs(15))
        .redirect(reqwest::redirect::Policy::limited(10))
        .user_agent("PREVU/0.1 (+https://github.com/your-org/prevu)")
        .build()
        .map_err(|err| InspectError::Unexpected(err.to_string()))
}

pub async fn inspect_url(url: &str) -> Result<InspectResult, InspectError> {
    let client = build_http_client()?;
    inspect_url_with_client(&client, url).await
}

pub async fn inspect_url_with_client(client: &Client, url: &str) -> Result<InspectResult, InspectError> {
    validate_url(url)?;

    let (resolved_url, html) = fetch_html(client, url).await?;

    let mut meta = extract_meta(&html);
    meta.og_image = normalize_url(meta.og_image.as_deref(), &resolved_url);
    meta.twitter_image = normalize_url(meta.twitter_image.as_deref(), &resolved_url);
    meta.og_url = normalize_url(meta.og_url.as_deref(), &resolved_url).or(meta.og_url);

    let image_url = meta
        .og_image
        .clone()
        .or_else(|| meta.twitter_image.clone())
        .unwrap_or_default();

    let image_info = if image_url.is_empty() {
        None
    } else {
        inspect_image(client, &image_url).await.ok()
    };

    let validation = validator::validate(&meta, image_info.as_ref());

    Ok(InspectResult {
        source_url: url.to_owned(),
        resolved_url,
        meta,
        validation,
        image_info,
    })
}

pub async fn discover_site_pages(site_url: &str, max_pages: usize) -> Result<(Vec<String>, String), InspectError> {
    validate_url(site_url)?;
    let client = build_http_client()?;

    let sitemap_urls = discover_from_sitemap(&client, site_url, max_pages).await?;
    if !sitemap_urls.is_empty() {
        return Ok((sitemap_urls, "sitemap".to_owned()));
    }

    let linked_urls = discover_from_links(&client, site_url, max_pages).await?;
    if !linked_urls.is_empty() {
        return Ok((linked_urls, "linked-pages".to_owned()));
    }

    Ok((vec![site_url.to_owned()], "single-url".to_owned()))
}

async fn fetch_html(client: &Client, url: &str) -> Result<(String, String), InspectError> {
    let response = client
        .get(url)
        .send()
        .await
        .map_err(|err| InspectError::Network(err.to_string()))?;

    if !response.status().is_success() {
        return Err(InspectError::Network(format!(
            "url request failed with status {}",
            response.status()
        )));
    }

    let resolved_url = response.url().to_string();
    let html = response
        .text()
        .await
        .map_err(|err| InspectError::Network(err.to_string()))?;

    Ok((resolved_url, html))
}

async fn discover_from_sitemap(client: &Client, site_url: &str, max_pages: usize) -> Result<Vec<String>, InspectError> {
    let base = Url::parse(site_url).map_err(|_| InspectError::InvalidUrl(site_url.to_owned()))?;
    let Some(host) = base.host_str() else {
        return Ok(Vec::new());
    };

    let candidates = ["sitemap.xml", "sitemap_index.xml"];
    let mut seen: HashSet<String> = HashSet::new();
    let mut urls = Vec::new();

    for candidate in candidates {
        let Ok(target) = base.join(candidate) else {
            continue;
        };

        let response = match client.get(target.as_str()).send().await {
            Ok(r) => r,
            Err(_) => continue,
        };

        if !response.status().is_success() {
            continue;
        }

        let xml = match response.text().await {
            Ok(v) => v,
            Err(_) => continue,
        };

        for loc in extract_loc_urls_from_xml(&xml) {
            let normalized = normalize_url(Some(&loc), target.as_str());
            let Some(u) = normalized else {
                continue;
            };

            let Ok(parsed) = Url::parse(&u) else {
                continue;
            };

            if parsed.host_str() != Some(host) {
                continue;
            }

            if seen.insert(u.clone()) {
                urls.push(u);
            }

            if urls.len() >= max_pages {
                return Ok(urls);
            }
        }
    }

    Ok(urls)
}

async fn discover_from_links(client: &Client, site_url: &str, max_pages: usize) -> Result<Vec<String>, InspectError> {
    let (resolved_url, html) = fetch_html(client, site_url).await?;
    let base = Url::parse(&resolved_url).map_err(|_| InspectError::InvalidUrl(resolved_url.clone()))?;
    let Some(host) = base.host_str() else {
        return Ok(Vec::new());
    };

    let document = Html::parse_document(&html);
    let selector = Selector::parse("a[href]").expect("a[href] selector must compile");

    let mut seen: HashSet<String> = HashSet::new();
    let mut urls = Vec::new();

    seen.insert(resolved_url.clone());
    urls.push(resolved_url.clone());

    for node in document.select(&selector) {
        let href = node.value().attr("href");
        let Some(link) = href else {
            continue;
        };

        let normalized = normalize_url(Some(link), &resolved_url);
        let Some(u) = normalized else {
            continue;
        };

        let Ok(parsed) = Url::parse(&u) else {
            continue;
        };

        if parsed.host_str() != Some(host) {
            continue;
        }

        if seen.insert(u.clone()) {
            urls.push(u);
        }

        if urls.len() >= max_pages {
            break;
        }
    }

    Ok(urls)
}

fn extract_loc_urls_from_xml(xml: &str) -> Vec<String> {
    let mut out = Vec::new();
    for chunk in xml.split("<loc>").skip(1) {
        if let Some((value, _)) = chunk.split_once("</loc>") {
            let cleaned = value.trim();
            if !cleaned.is_empty() {
                out.push(cleaned.to_owned());
            }
        }
    }
    out
}

fn validate_url(url: &str) -> Result<(), InspectError> {
    let parsed = Url::parse(url).map_err(|_| InspectError::InvalidUrl(url.to_owned()))?;
    let scheme = parsed.scheme();
    if scheme != "http" && scheme != "https" {
        return Err(InspectError::InvalidUrl(url.to_owned()));
    }

    if parsed.host_str().is_none() {
        return Err(InspectError::InvalidUrl(url.to_owned()));
    }

    Ok(())
}

fn normalize_url(value: Option<&str>, base_url: &str) -> Option<String> {
    let Some(input) = value else {
        return None;
    };

    if let Ok(absolute) = Url::parse(input) {
        return Some(absolute.to_string());
    }

    let base = Url::parse(base_url).ok()?;
    base.join(input).ok().map(|url| url.to_string())
}

fn extract_meta(html: &str) -> MetaData {
    let document = Html::parse_document(html);
    let selector = Selector::parse("meta").expect("meta selector must compile");

    let mut map: HashMap<String, String> = HashMap::new();

    for node in document.select(&selector) {
        let value = node.value();
        let key = value
            .attr("property")
            .or_else(|| value.attr("name"))
            .map(|v| v.trim().to_lowercase());

        let content = value.attr("content").map(str::trim).map(str::to_owned);

        if let (Some(k), Some(v)) = (key, content) {
            if !v.is_empty() {
                map.insert(k, v);
            }
        }
    }

    MetaData {
        og_title: map.get("og:title").cloned(),
        og_description: map.get("og:description").cloned(),
        og_image: map.get("og:image").cloned(),
        og_url: map.get("og:url").cloned(),
        og_site_name: map.get("og:site_name").cloned(),
        twitter_card: map.get("twitter:card").cloned(),
        twitter_title: map
            .get("twitter:title")
            .cloned()
            .or_else(|| map.get("og:title").cloned()),
        twitter_description: map
            .get("twitter:description")
            .cloned()
            .or_else(|| map.get("og:description").cloned()),
        twitter_image: map
            .get("twitter:image")
            .cloned()
            .or_else(|| map.get("og:image").cloned()),
        raw_tags: map,
    }
}
