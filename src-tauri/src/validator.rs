use serde::{Deserialize, Serialize};

use crate::image_checker::ImageInfo;
use crate::parser::MetaData;

const RECOMMENDED_WIDTH: u32 = 1200;
const RECOMMENDED_HEIGHT: u32 = 630;
const MIN_WIDTH: u32 = 600;
const MIN_HEIGHT: u32 = 315;
const RECOMMENDED_ASPECT: f32 = 1200.0 / 630.0;

#[derive(Debug, Serialize, Deserialize, Clone, Default)]
#[serde(rename_all = "camelCase")]
pub struct ValidationReport {
    pub passed: Vec<String>,
    pub warnings: Vec<String>,
}

pub fn validate(meta: &MetaData, image_info: Option<&ImageInfo>) -> ValidationReport {
    let mut passed = Vec::new();
    let mut warnings = Vec::new();

    validate_required(meta, &mut passed, &mut warnings);
    validate_twitter(meta, &mut passed, &mut warnings);
    validate_image(image_info, &mut passed, &mut warnings);

    ValidationReport { passed, warnings }
}

fn validate_required(meta: &MetaData, passed: &mut Vec<String>, warnings: &mut Vec<String>) {
    check_required("og:title", meta.og_title.as_ref(), passed, warnings);
    check_required(
        "og:description",
        meta.og_description.as_ref(),
        passed,
        warnings,
    );
    check_required("og:image", meta.og_image.as_ref(), passed, warnings);
}

fn validate_twitter(meta: &MetaData, passed: &mut Vec<String>, warnings: &mut Vec<String>) {
    if meta.twitter_card.is_some() {
        passed.push("twitter:card detected".to_owned());
    } else {
        warnings.push("Missing twitter:card".to_owned());
    }
}

fn validate_image(image_info: Option<&ImageInfo>, passed: &mut Vec<String>, warnings: &mut Vec<String>) {
    let Some(info) = image_info else {
        warnings.push("OG image could not be inspected".to_owned());
        return;
    };

    if info.width >= MIN_WIDTH && info.height >= MIN_HEIGHT {
        passed.push(format!(
            "Image resolution looks valid ({}x{})",
            info.width, info.height
        ));
    } else {
        warnings.push(format!(
            "Image resolution too small ({}x{}). Minimum is {}x{}",
            info.width, info.height, MIN_WIDTH, MIN_HEIGHT
        ));
    }

    if info.width >= RECOMMENDED_WIDTH && info.height >= RECOMMENDED_HEIGHT {
        passed.push(format!(
            "Image meets recommended resolution ({}x{})",
            RECOMMENDED_WIDTH, RECOMMENDED_HEIGHT
        ));
    } else {
        warnings.push(format!(
            "Recommended image is {}x{}",
            RECOMMENDED_WIDTH, RECOMMENDED_HEIGHT
        ));
    }

    let ratio_diff = (info.aspect_ratio - RECOMMENDED_ASPECT).abs();
    if ratio_diff <= 0.15 {
        passed.push("Image aspect ratio is close to 1.91:1".to_owned());
    } else {
        warnings.push(format!(
            "Incorrect aspect ratio ({:.2}). Expected close to 1.91:1",
            info.aspect_ratio
        ));
    }

    if info.file_size_bytes <= 5 * 1024 * 1024 {
        passed.push("Image file size is below 5MB".to_owned());
    } else {
        warnings.push("Image file is larger than 5MB".to_owned());
    }
}

fn check_required(
    tag: &str,
    value: Option<&String>,
    passed: &mut Vec<String>,
    warnings: &mut Vec<String>,
) {
    if value.is_some() {
        passed.push(format!("{tag} detected"));
    } else {
        warnings.push(format!("Missing {tag}"));
    }
}
