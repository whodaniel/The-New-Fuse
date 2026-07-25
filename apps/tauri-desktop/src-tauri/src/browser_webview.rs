// The New Fuse - auxiliary browser WebView
//
// Opens a separate Tauri WebviewWindow at a URL for convenience preview.
// This is NOT the Chromium session controlled by the TNF Browser extension
// on :7331 — cookies, tabs, and DOM actions do not apply here. Prefer the
// screenshot / Discover surface for the controlled session.

use tauri::{AppHandle, Manager, WebviewUrl, WebviewWindowBuilder};

const WEBVIEW_LABEL: &str = "tnf-browser-view";

/// Open (or reopen) the TNF Browser child WebView at `url`.
/// A missing scheme defaults to https://.
#[tauri::command]
pub fn open_browser_webview(app: AppHandle, url: String) -> Result<(), String> {
    if let Some(existing) = app.get_webview_window(WEBVIEW_LABEL) {
        let _ = existing.close();
    }

    let candidate = if url.starts_with("http://") || url.starts_with("https://") {
        url
    } else {
        format!("https://{}", url)
    };
    let parsed = candidate
        .parse::<url::Url>()
        .map_err(|e| format!("Invalid URL '{}': {}", candidate, e))?;

    let builder = WebviewWindowBuilder::new(&app, WEBVIEW_LABEL, WebviewUrl::External(parsed))
        .title("TNF Browser — Live View")
        .inner_size(1280.0, 860.0)
        .resizable(true);

    builder
        .build()
        .map(|_| ())
        .map_err(|e| format!("Failed to open TNF Browser webview: {}", e))
}

/// Navigate the existing TNF Browser child WebView. Opens it if not running.
#[tauri::command]
pub fn navigate_browser_webview(app: AppHandle, url: String) -> Result<(), String> {
    if let Some(win) = app.get_webview_window(WEBVIEW_LABEL) {
        let js = format!(
            "window.location.href = {}",
            serde_json::to_string(&url).unwrap_or_else(|_| "\"\"".to_string())
        );
        win.eval(&js)
            .map_err(|e| format!("Failed to navigate TNF Browser webview: {}", e))?;
        let _ = win.set_focus();
        Ok(())
    } else {
        open_browser_webview(app, url)
    }
}

/// Bring the TNF Browser child WebView to the foreground.
#[tauri::command]
pub fn focus_browser_webview(app: AppHandle) -> Result<(), String> {
    match app.get_webview_window(WEBVIEW_LABEL) {
        Some(win) => win.set_focus().map_err(|e| e.to_string()),
        None => Err("TNF Browser webview is not open".to_string()),
    }
}

/// Close the TNF Browser child WebView if it is open.
#[tauri::command]
pub fn close_browser_webview(app: AppHandle) -> Result<(), String> {
    if let Some(win) = app.get_webview_window(WEBVIEW_LABEL) {
        win.close().map_err(|e| e.to_string())?;
    }
    Ok(())
}

/// Whether the TNF Browser child WebView is currently open.
#[tauri::command]
pub fn browser_webview_exists(app: AppHandle) -> bool {
    app.get_webview_window(WEBVIEW_LABEL).is_some()
}
