use arboard::Clipboard;

pub fn read_clipboard_url() -> Result<Option<String>, String> {
    let mut clipboard = Clipboard::new().map_err(|err| format!("clipboard unavailable: {err}"))?;
    let text = clipboard
        .get_text()
        .map_err(|err| format!("unable to read clipboard text: {err}"))?;

    let trimmed = text.trim();
    if looks_like_url(trimmed) {
        return Ok(Some(trimmed.to_owned()));
    }

    Ok(None)
}

fn looks_like_url(value: &str) -> bool {
    value.starts_with("http://") || value.starts_with("https://")
}
