// The New Fuse - Tauri Backend
// Handles MCP communication, bridge sidecar, and local permissions

mod bridge;
mod antigravity;
mod oagi;
mod browser_webview;
mod agent_browser_backend;
mod tnf_browser_bridge;
mod service_lifecycle;
mod chrome_extension;
mod host_policy;

// HashMap imported on demand via bridge module
use std::net::TcpStream;
use std::path::{Path, PathBuf};
use std::sync::Arc;
use std::time::Duration;
use tokio::sync::Mutex;
use tauri::{Manager, State};
use serde::{Deserialize, Serialize};

use bridge::BridgeManager;
use antigravity::{AntigravityClient, AntigravityCredentials, AntigravityStatus, PageInfo, UserSettings};
use tnf_browser_bridge::TnfBrowserBridge;

// ============================================================================
// PATH SANDBOXING — Security boundary for filesystem commands
// ============================================================================

/// Returns the list of directories that file system commands are allowed to access.
/// Any path outside these roots is rejected.
fn allowed_roots() -> Vec<PathBuf> {
    let mut roots = Vec::new();

    // Primary sandbox directory
    if let Some(home) = dirs::home_dir() {
        roots.push(home.join(".tnf-sandbox"));
    }

    // Tauri app data directory
    if let Some(data) = dirs::data_dir() {
        roots.push(data.join("com.thenewfuse.desktop"));
    }

    // Voice bridge state under configured project root
    if let Ok(root) = std::env::var("TNF_PROJECT_ROOT") {
        roots.push(PathBuf::from(root).join(".voicebridge"));
    }

    roots
}

/// True when path is under $HOME and includes a `.voicebridge` path segment.
fn is_voicebridge_path(resolved: &Path) -> bool {
    let has_segment = resolved.components().any(|c| c.as_os_str() == ".voicebridge");
    if !has_segment {
        return false;
    }
    if let Some(home) = dirs::home_dir() {
        if let Ok(home_canon) = home.canonicalize() {
            return resolved.starts_with(&home_canon);
        }
        return resolved.starts_with(&home);
    }
    false
}

/// Validates that `path` resolves to a location within one of the allowed roots.
/// Returns the canonicalized path on success, or an error message on failure.
fn validate_sandboxed_path(path: &str) -> Result<PathBuf, String> {
    // Resolve the path (handles .., symlinks, etc.)
    let candidate = Path::new(path);

    // For paths that don't exist yet (write_file), resolve parent
    let resolved = if candidate.exists() {
        candidate.canonicalize()
            .map_err(|e| format!("Path resolution failed: {}", e))?
    } else {
        // For new files, check that the parent directory is in the sandbox
        let parent = candidate.parent()
            .ok_or_else(|| "Invalid path: no parent directory".to_string())?;
        if !parent.exists() {
            return Err(format!("Parent directory does not exist: {}", parent.display()));
        }
        let resolved_parent = parent.canonicalize()
            .map_err(|e| format!("Parent path resolution failed: {}", e))?;
        resolved_parent.join(candidate.file_name().unwrap_or_default())
    };

    let roots = allowed_roots();
    for root in &roots {
        // Ensure the root exists for comparison (create sandbox dir if needed)
        if let Ok(canonical_root) = root.canonicalize() {
            if resolved.starts_with(&canonical_root) {
                return Ok(resolved);
            }
        }
        // Also check non-canonicalized for new sandbox dirs
        if resolved.starts_with(root) {
            return Ok(resolved);
        }
    }

    if is_voicebridge_path(&resolved) {
        return Ok(resolved);
    }

    Err(format!(
        "Access denied: path '{}' is outside the sandbox. Allowed roots: {:?}",
        path, roots
    ))
}

/// Validates that a URL is allowed for WebSocket bridge connections.
/// Only permits wss:// to known hosts, or ws:// to localhost/127.0.0.1.
fn validate_sandbox_url(url: &str) -> Result<(), String> {
    let parsed = url::Url::parse(url)
        .map_err(|e| format!("Invalid URL: {}", e))?;

    match parsed.scheme() {
        "ws" => {
            let host = parsed.host_str().unwrap_or("");
            if host_policy::host_allowed(host, &["localhost", "127.0.0.1", "[::1]", "::1"], &[]) {
                Ok(())
            } else {
                Err(format!("ws:// connections only allowed to localhost, got: {}", host))
            }
        }
        "wss" => {
            let host = parsed.host_str().unwrap_or("");
            if host_policy::cloud_control_plane_host_allowed(host) {
                Ok(())
            } else {
                Err(format!("wss:// host not in allowlist: {}", host))
            }
        }
        other => Err(format!("Unsupported scheme: {}", other)),
    }
}

/// Probe a service URL with a short TCP (and optional HTTP) check.
/// Rejects non-allowlisted hosts so this command cannot be used as an SSRF oracle.
async fn probe_service_url(raw_url: &str) -> bool {
    let parsed = match url::Url::parse(raw_url) {
        Ok(u) => u,
        Err(_) => return false,
    };

    let host = match parsed.host_str() {
        Some(h) => h,
        None => return false,
    };

    if !host_policy::health_probe_host_allowed(host) {
        return false;
    }

    let port = match parsed.port_or_known_default() {
        Some(p) => p,
        None => match parsed.scheme() {
            "ws" | "http" => 80,
            "wss" | "https" => 443,
            _ => return false,
        },
    };

    let tcp_host = if host.contains(':') && !host.starts_with('[') {
        format!("[{}]", host)
    } else {
        host.to_string()
    };
    let addr = format!("{}:{}", tcp_host, port);
    let tcp_ok = tokio::task::spawn_blocking(move || {
        addr.parse::<std::net::SocketAddr>()
            .ok()
            .map(|a| TcpStream::connect_timeout(&a, Duration::from_millis(600)).is_ok())
            .unwrap_or(false)
    })
    .await
    .unwrap_or(false);

    if !tcp_ok {
        return false;
    }

    // Prefer an HTTP(S) status probe when the URL is http(s); TCP open alone is enough for ws(s).
    match parsed.scheme() {
        "http" | "https" => {
            let client = match reqwest::Client::builder()
                .timeout(Duration::from_millis(900))
                .redirect(reqwest::redirect::Policy::none())
                .build()
            {
                Ok(c) => c,
                Err(_) => return tcp_ok,
            };
            match client.get(parsed.clone()).send().await {
                Ok(resp) => resp.status().as_u16() < 500,
                Err(_) => tcp_ok,
            }
        }
        "ws" | "wss" => tcp_ok,
        _ => false,
    }
}

// ============================================================================
// STATE MANAGEMENT
// ============================================================================

pub struct AppState {
    pub bridge_manager: Arc<Mutex<Option<BridgeManager>>>,
    pub sandbox_url: Mutex<String>,
    pub antigravity_client: Arc<Mutex<AntigravityClient>>,
}

impl Default for AppState {
    fn default() -> Self {
        Self {
            bridge_manager: Arc::new(Mutex::new(None)),
            sandbox_url: Mutex::new(String::from("wss://api-gateway-241337102384.us-central1.run.app/ws")),
            antigravity_client: Arc::new(Mutex::new(AntigravityClient::new())),
        }
    }
}

// ============================================================================
// MCP MESSAGE TYPES
// ============================================================================

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct ServiceStatus {
    pub name: String,
    pub url: String,
    pub online: bool,
}

// ============================================================================
// TAURI COMMANDS - Core
// ============================================================================

#[tauri::command]
fn greet(name: &str) -> String {
    format!("Welcome to TNF (The New Fuse) Desktop App, {}!", name)
}

#[tauri::command]
fn get_app_version() -> String {
    env!("CARGO_PKG_VERSION").to_string()
}

// ============================================================================
// TAURI COMMANDS - Bridge Management
// ============================================================================

#[tauri::command]
async fn connect_bridge(state: State<'_, AppState>) -> Result<bool, String> {
    let sandbox_url = {
        let url_lock = state.sandbox_url.lock().await;
        url_lock.clone()
    };

    println!("🔌 Connecting to sandbox: {}", sandbox_url);

    // Create new bridge manager
    let bridge = BridgeManager::new(sandbox_url);

    // Connect
    bridge.connect().await?;

    // Store the bridge
    {
        let mut bridge_lock = state.bridge_manager.lock().await;
        *bridge_lock = Some(bridge);
    }

    Ok(true)
}

#[tauri::command]
async fn disconnect_bridge(state: State<'_, AppState>) -> Result<bool, String> {
    let mut bridge_lock = state.bridge_manager.lock().await;

    if let Some(bridge) = bridge_lock.as_ref() {
        bridge.disconnect().await?;
    }

    *bridge_lock = None;
    Ok(true)
}

#[tauri::command]
async fn get_bridge_status(state: State<'_, AppState>) -> Result<bool, String> {
    let bridge_lock = state.bridge_manager.lock().await;

    if let Some(bridge) = bridge_lock.as_ref() {
        Ok(bridge.is_connected().await)
    } else {
        Ok(false)
    }
}

#[tauri::command]
async fn set_sandbox_url(url: String, state: State<'_, AppState>) -> Result<(), String> {
    validate_sandbox_url(&url)?;
    let mut sandbox_url = state.sandbox_url.lock().await;
    *sandbox_url = url;
    Ok(())
}

// ============================================================================
// TAURI COMMANDS - MCP Operations
// ============================================================================

#[tauri::command]
async fn mcp_call_tool(
    tool_name: String,
    arguments: serde_json::Value,
    state: State<'_, AppState>
) -> Result<serde_json::Value, String> {
    let bridge_lock = state.bridge_manager.lock().await;

    if let Some(bridge) = bridge_lock.as_ref() {
        bridge.call_tool(&tool_name, arguments).await
    } else {
        // Fallback: return mock response when not connected
        Ok(serde_json::json!({
            "success": false,
            "error": "Not connected to cloud sandbox"
        }))
    }
}

#[tauri::command]
async fn mcp_list_tools(state: State<'_, AppState>) -> Result<Vec<serde_json::Value>, String> {
    let bridge_lock = state.bridge_manager.lock().await;

    if let Some(bridge) = bridge_lock.as_ref() {
        bridge.list_tools().await
    } else {
        // Return local tool definitions when not connected
        Ok(vec![
            serde_json::json!({
                "name": "browser_navigate",
                "description": "Navigate headless browser to URL (requires cloud connection)",
                "inputSchema": {
                    "type": "object",
                    "properties": {
                        "url": { "type": "string" }
                    },
                    "required": ["url"]
                }
            }),
            serde_json::json!({
                "name": "run_build",
                "description": "Execute build command in cloud sandbox (requires cloud connection)",
                "inputSchema": {
                    "type": "object",
                    "properties": {
                        "command": { "type": "string" },
                        "cwd": { "type": "string" }
                    },
                    "required": ["command"]
                }
            }),
            serde_json::json!({
                "name": "browser_semantic_snapshot",
                "description": "Get a semantic snapshot (accessibility tree) of the current page, optimized for LLMs.",
                "inputSchema": {
                    "type": "object",
                    "properties": {
                        "interestingOnly": { "type": "boolean" }
                    }
                }
            }),
            serde_json::json!({
                "name": "browser_annotated_screenshot",
                "description": "Take a screenshot of the current page with numbered bounding boxes over interactive elements for Vision models.",
                "inputSchema": {
                    "type": "object",
                    "properties": {
                        "path": { "type": "string" }
                    }
                }
            }),
            serde_json::json!({
                "name": "read_local_file",
                "description": "Read file from local machine",
                "inputSchema": {
                    "type": "object",
                    "properties": {
                        "path": { "type": "string" }
                    },
                    "required": ["path"]
                }
            }),
            serde_json::json!({
                "name": "write_local_file",
                "description": "Write file to local machine",
                "inputSchema": {
                    "type": "object",
                    "properties": {
                        "path": { "type": "string" },
                        "content": { "type": "string" }
                    },
                    "required": ["path", "content"]
                }
            })
        ])
    }
}

// ============================================================================
// TAURI COMMANDS - Local File System (Sandboxed)
// All paths are validated against ~/.tnf-sandbox and $APPDATA.
// ============================================================================

#[tauri::command]
async fn read_file(path: String) -> Result<String, String> {
    let validated = validate_sandboxed_path(&path)?;
    tokio::fs::read_to_string(&validated)
        .await
        .map_err(|e| format!("Failed to read file: {}", e))
}

#[tauri::command]
async fn write_file(path: String, content: String) -> Result<(), String> {
    let validated = validate_sandboxed_path(&path)?;
    // Ensure parent directory exists within sandbox
    if let Some(parent) = validated.parent() {
        tokio::fs::create_dir_all(parent)
            .await
            .map_err(|e| format!("Failed to create directory: {}", e))?;
    }
    tokio::fs::write(&validated, &content)
        .await
        .map_err(|e| format!("Failed to write file: {}", e))
}

#[tauri::command]
async fn list_directory(path: String) -> Result<Vec<String>, String> {
    let validated = validate_sandboxed_path(&path)?;
    let mut entries = tokio::fs::read_dir(&validated)
        .await
        .map_err(|e| format!("Failed to read directory: {}", e))?;

    let mut files = Vec::new();
    while let Some(entry) = entries.next_entry().await.map_err(|e| e.to_string())? {
        files.push(entry.path().display().to_string());
    }
    Ok(files)
}

#[tauri::command]
async fn file_exists(path: String) -> Result<bool, String> {
    let validated = validate_sandboxed_path(&path)?;
    Ok(tokio::fs::metadata(&validated).await.is_ok())
}

// NOTE: execute_command has been REMOVED (CRIT-1 remediation).
// Arbitrary shell command execution from the webview is an RCE vulnerability.
// If specific commands are needed, add them as individual, validated Tauri commands.

// ============================================================================
// TAURI COMMANDS - Service Status
// ============================================================================

#[tauri::command]
async fn check_service_status(services: Vec<ServiceStatus>) -> Vec<ServiceStatus> {
    let mut out = Vec::with_capacity(services.len());
    for mut service in services {
        service.online = probe_service_url(&service.url).await;
        out.push(service);
    }
    out
}

// ============================================================================
// TAURI COMMANDS - Antigravity Integration
// ============================================================================

#[tauri::command]
async fn antigravity_set_credentials(
    csrf_token: String,
    server_address: String,
    state: State<'_, AppState>
) -> Result<(), String> {
    let mut client = state.antigravity_client.lock().await;
    client.set_credentials(AntigravityCredentials {
        csrf_token,
        server_address,
    })
}

#[tauri::command]
async fn antigravity_get_status(state: State<'_, AppState>) -> Result<AntigravityStatus, String> {
    let client = state.antigravity_client.lock().await;
    client.get_status().await
}

#[tauri::command]
async fn antigravity_get_user_settings(state: State<'_, AppState>) -> Result<UserSettings, String> {
    let client = state.antigravity_client.lock().await;
    client.get_user_settings().await
}

#[tauri::command]
async fn antigravity_list_pages(state: State<'_, AppState>) -> Result<Vec<PageInfo>, String> {
    let client = state.antigravity_client.lock().await;
    client.list_pages().await
}

#[tauri::command]
async fn antigravity_smart_focus(
    conversation_id: String,
    state: State<'_, AppState>
) -> Result<(), String> {
    let client = state.antigravity_client.lock().await;
    client.smart_focus(&conversation_id).await
}

#[tauri::command]
async fn antigravity_cancel_cascade(
    invocation_id: String,
    state: State<'_, AppState>
) -> Result<(), String> {
    let client = state.antigravity_client.lock().await;
    client.cancel_cascade(&invocation_id).await
}

#[tauri::command]
async fn antigravity_validate_cascade_overlay(
    invocation_id: String,
    validate: bool,
    state: State<'_, AppState>
) -> Result<(), String> {
    let client = state.antigravity_client.lock().await;
    client.validate_cascade_overlay(&invocation_id, validate).await
}

#[tauri::command]
async fn antigravity_save_recording(
    data: Vec<u8>,
    filename: String,
    conversation_id: String,
    state: State<'_, AppState>
) -> Result<(), String> {
    let client = state.antigravity_client.lock().await;
    client.save_recording(&data, &filename, &conversation_id).await
}

// ============================================================================
// APPLICATION ENTRY POINT
// ============================================================================

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .manage(AppState::default())
        .manage(Arc::new(TnfBrowserBridge::default()))
        .plugin(tauri_plugin_opener::init())
        .invoke_handler(tauri::generate_handler![
            // Core
            greet,
            get_app_version,
            // Bridge
            connect_bridge,
            disconnect_bridge,
            get_bridge_status,
            set_sandbox_url,
            // MCP
            mcp_call_tool,
            mcp_list_tools,
            // File System (sandboxed to ~/.tnf-sandbox)
            read_file,
            write_file,
            list_directory,
            file_exists,
            service_lifecycle::delete_file,
            // execute_command REMOVED — CRIT-1 RCE remediation
            // Allowlisted lifecycle (fixed argv only)
            service_lifecycle::voice_server_status,
            service_lifecycle::voice_listen_status,
            service_lifecycle::start_voice_server,
            service_lifecycle::start_voice_listen,
            service_lifecycle::ensure_voice_stack,
            service_lifecycle::start_tnf_api,
            service_lifecycle::start_local_relay,
            service_lifecycle::start_forefront_boot,
            service_lifecycle::start_story_architect_relay,
            service_lifecycle::start_kws_server,
            service_lifecycle::ensure_library_audio_stack,
            // Services
            check_service_status,
            // Chrome extension bootstrap
            chrome_extension::find_chrome_executable,
            chrome_extension::resolve_chrome_extension_path,
            chrome_extension::launch_chrome_with_extension,
            // Antigravity
            antigravity_set_credentials,
            antigravity_get_status,
            antigravity_get_user_settings,
            antigravity_list_pages,
            antigravity_smart_focus,
            antigravity_cancel_cascade,
            antigravity_validate_cascade_overlay,
            antigravity_save_recording,
            // OAGI/Lux Computer Use (automation commands require arming)
            oagi::get_computer_use_armed,
            oagi::set_computer_use_armed,
            oagi::capture_screen,
            oagi::execute_click,
            oagi::execute_drag,
            oagi::execute_scroll,
            oagi::execute_type,
            oagi::execute_hotkey,
            oagi::get_screen_size,
            oagi::get_mouse_position,
            oagi::wait_duration,
            // TNF Browser embedded WebView
            browser_webview::open_browser_webview,
            browser_webview::navigate_browser_webview,
            browser_webview::focus_browser_webview,
            browser_webview::close_browser_webview,
            browser_webview::browser_webview_exists,
            // TNF Browser protocol bridge (agent-browser default; legacy :7331 opt-in)
            tnf_browser_bridge::tnf_browser_status,
            tnf_browser_bridge::tnf_browser_connect,
            tnf_browser_bridge::tnf_browser_disconnect,
            tnf_browser_bridge::tnf_browser_command,
            tnf_browser_bridge::tnf_browser_start
        ])
        .setup(|app| {
            let window = app.get_webview_window("main").unwrap();

            // Set window title
            window.set_title("TNF (The New Fuse) Desktop App").unwrap();

            // Log startup
            println!("🚀 TNF Desktop App v{} starting...", env!("CARGO_PKG_VERSION"));
            println!("📡 MCP Bridge ready for connection");

            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
