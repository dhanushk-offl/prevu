#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use prevu_core::{
    batch_inspect_urls as batch_inspect_urls_core, clipboard_watcher,
    compare_environments as compare_environments_core, inspect_url as inspect_url_core,
    monitor_site_metadata as monitor_site_metadata_core, BatchInspectResult, CompareResult,
    InspectResult, SiteMonitorResult,
};
use rfd::FileDialog;
use std::fs;

#[cfg(target_os = "linux")]
fn set_env_if_unset(key: &str, value: &str) {
    if std::env::var_os(key).is_none() {
        std::env::set_var(key, value);
    }
}

#[cfg(target_os = "linux")]
fn configure_linux_graphics_fallbacks() {
    let allow_hardware = std::env::var("PREVU_ALLOW_HARDWARE_ACCELERATION")
        .map(|value| matches!(value.as_str(), "1" | "true" | "TRUE" | "yes" | "on"))
        .unwrap_or(false);

    if allow_hardware {
        return;
    }

    // Keep WebKitGTK on a software-safe path for problematic EGL/Wayland stacks.
    set_env_if_unset("WEBKIT_DISABLE_COMPOSITING_MODE", "1");
    set_env_if_unset("WEBKIT_DISABLE_DMABUF_RENDERER", "1");
    set_env_if_unset("LIBGL_ALWAYS_SOFTWARE", "1");
    set_env_if_unset("LIBGL_DRI3_DISABLE", "1");

    let has_wayland = std::env::var_os("WAYLAND_DISPLAY").is_some();
    let has_x11 = std::env::var_os("DISPLAY").is_some();
    let has_gdk_backend = std::env::var_os("GDK_BACKEND").is_some();

    // Prefer X11 when both are available to avoid Wayland/EGL init crashes.
    if has_wayland && has_x11 && !has_gdk_backend {
        std::env::set_var("GDK_BACKEND", "x11");
    }
}

#[cfg(not(target_os = "linux"))]
fn configure_linux_graphics_fallbacks() {}

#[tauri::command]
async fn inspect_url(url: String) -> Result<InspectResult, String> {
    inspect_url_core(&url).await.map_err(|err| err.to_string())
}

#[tauri::command]
async fn batch_inspect_urls(urls: Vec<String>) -> Result<BatchInspectResult, String> {
    Ok(batch_inspect_urls_core(urls).await)
}

#[tauri::command]
async fn compare_environments(staging_url: String, production_url: String) -> Result<CompareResult, String> {
    compare_environments_core(&staging_url, &production_url)
        .await
        .map_err(|err| err.to_string())
}

#[tauri::command]
async fn monitor_site_metadata(site_url: String, max_pages: Option<usize>) -> Result<SiteMonitorResult, String> {
    monitor_site_metadata_core(&site_url, max_pages.unwrap_or(200))
        .await
        .map_err(|err| err.to_string())
}

#[tauri::command]
fn read_clipboard_url() -> Result<Option<String>, String> {
    clipboard_watcher::read_clipboard_url()
}

#[tauri::command]
fn save_workspace_dialog(default_name: String, payload: String) -> Result<Option<String>, String> {
    let file_path = FileDialog::new()
        .add_filter("PREVU Workspace", &["json"])
        .set_file_name(&default_name)
        .save_file();

    let Some(path) = file_path else {
        return Ok(None);
    };

    fs::write(&path, payload).map_err(|err| format!("failed to save workspace file: {err}"))?;
    Ok(Some(path.display().to_string()))
}

#[tauri::command]
fn open_workspace_dialog() -> Result<Option<String>, String> {
    let file_path = FileDialog::new()
        .add_filter("PREVU Workspace", &["json"])
        .pick_file();

    let Some(path) = file_path else {
        return Ok(None);
    };

    let content = fs::read_to_string(&path).map_err(|err| format!("failed to read workspace file: {err}"))?;
    Ok(Some(content))
}

#[tauri::command]
fn save_binary_dialog(default_name: String, bytes: Vec<u8>) -> Result<Option<String>, String> {
    let file_path = FileDialog::new().set_file_name(&default_name).save_file();

    let Some(path) = file_path else {
        return Ok(None);
    };

    fs::write(&path, bytes).map_err(|err| format!("failed to save file: {err}"))?;
    Ok(Some(path.display().to_string()))
}

#[tauri::command]
fn open_external_url(url: String) -> Result<(), String> {
    open::that(url).map_err(|err| format!("failed to open url: {err}"))?;
    Ok(())
}

fn main() {
    configure_linux_graphics_fallbacks();

    tauri::Builder::default()
        .invoke_handler(tauri::generate_handler![
            inspect_url,
            batch_inspect_urls,
            compare_environments,
            monitor_site_metadata,
            read_clipboard_url,
            save_workspace_dialog,
            open_workspace_dialog,
            save_binary_dialog,
            open_external_url
        ])
        .run(tauri::generate_context!())
        .expect("error while running PREVU desktop app");
}
