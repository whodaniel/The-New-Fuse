// The New Fuse - auxiliary browser WebView
//
// Opens a separate Tauri WebviewWindow at a URL for convenience preview.
// This is NOT the Chromium session controlled by agent-browser —
// cookies, tabs, and DOM actions do not apply here. Prefer the
// screenshot / Discover surface for the controlled session.

use tauri::{AppHandle, Manager, WebviewUrl, WebviewWindowBuilder};

const WEBVIEW_LABEL: &str = "tnf-browser-view";

/// Strict allowlist for child-webview navigations.
/// Blocks `javascript:`, `file:`, `data:`, `blob:`, and credentialed URLs.
pub(crate) fn validate_external_webview_url(url: &str) -> Result<url::Url, String> {
    let trimmed = url.trim();
    if trimmed.is_empty() {
        return Err("URL is required".into());
    }

    let lower = trimmed.to_ascii_lowercase();
    for bad in [
        "javascript:",
        "data:",
        "file:",
        "blob:",
        "vbscript:",
        "about:",
        "chrome:",
        "chrome-extension:",
    ] {
        if lower.starts_with(bad) {
            return Err(format!(
                "Blocked webview scheme '{}' — only http(s) is allowed",
                bad.trim_end_matches(':')
            ));
        }
    }

    // Explicit non-http schemes with `://` must fail closed before we invent https://.
    if let Some((scheme, _)) = trimmed.split_once("://") {
        let scheme_lc = scheme.to_ascii_lowercase();
        if scheme_lc != "http" && scheme_lc != "https" {
            return Err(format!(
                "Blocked webview scheme '{}://' — only http(s) is allowed",
                scheme_lc
            ));
        }
    }

    let candidate = if trimmed.starts_with("http://") || trimmed.starts_with("https://") {
        trimmed.to_string()
    } else if trimmed.starts_with("//") {
        format!("https:{}", trimmed)
    } else {
        format!("https://{}", trimmed)
    };

    let parsed = url::Url::parse(&candidate)
        .map_err(|e| format!("Invalid URL '{}': {}", candidate, e))?;

    match parsed.scheme() {
        "http" | "https" => {}
        other => {
            return Err(format!(
                "Blocked webview scheme '{}://' — only http(s) is allowed",
                other
            ));
        }
    }

    if !parsed.username().is_empty() || parsed.password().is_some() {
        return Err("Credentialed URLs are not allowed in the TNF Browser webview".into());
    }

    if parsed.host_str().is_none() {
        return Err("URL must include a host".into());
    }

    Ok(parsed)
}

/// Open (or reopen) the TNF Browser child WebView at `url`.
/// A missing scheme defaults to https://. Non-http(s) schemes are rejected.
#[tauri::command]
pub fn open_browser_webview(app: AppHandle, url: String) -> Result<(), String> {
    if let Some(existing) = app.get_webview_window(WEBVIEW_LABEL) {
        let _ = existing.close();
    }

    let parsed = validate_external_webview_url(&url)?;

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
    let parsed = validate_external_webview_url(&url)?;
    let safe = parsed.as_str().to_string();

    if let Some(win) = app.get_webview_window(WEBVIEW_LABEL) {
        let js = format!(
            "window.location.href = {}",
            serde_json::to_string(&safe).unwrap_or_else(|_| "\"\"".to_string())
        );
        win.eval(&js)
            .map_err(|e| format!("Failed to navigate TNF Browser webview: {}", e))?;
        let _ = win.set_focus();
        Ok(())
    } else {
        open_browser_webview(app, safe)
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

#[cfg(test)]
mod tests {
    use super::validate_external_webview_url;

    #[test]
    fn accepts_https_and_http() {
        assert!(validate_external_webview_url("https://thenewfuse.com").is_ok());
        assert!(validate_external_webview_url("http://127.0.0.1:3002").is_ok());
        assert!(validate_external_webview_url("thenewfuse.com/path").is_ok());
    }

    #[test]
    fn rejects_dangerous_schemes() {
        for bad in [
            "javascript:alert(1)",
            "file:///etc/passwd",
            "data:text/html,hi",
            "blob:https://x",
            "about:blank",
        ] {
            assert!(
                validate_external_webview_url(bad).is_err(),
                "expected reject for {}",
                bad
            );
        }
    }

    #[test]
    fn rejects_credentialed_urls() {
        assert!(validate_external_webview_url("https://user:pass@evil.example/").is_err());
    }
}
