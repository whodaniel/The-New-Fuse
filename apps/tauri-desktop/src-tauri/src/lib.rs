// The New Fuse - Tauri Backend
// Handles MCP communication, bridge sidecar, and local permissions

mod bridge;
mod antigravity;

// HashMap imported on demand via bridge module
use std::sync::Arc;
use tokio::sync::Mutex;
use tauri::{Manager, State};
use serde::{Deserialize, Serialize};

use bridge::BridgeManager;
use antigravity::{AntigravityClient, AntigravityCredentials, AntigravityStatus, PageInfo, UserSettings};

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
            sandbox_url: Mutex::new(String::from("wss://tnf-cloud-sandbox-production.up.railway.app/ws")),
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
    format!("Welcome to The New Fuse, {}!", name)
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
// TAURI COMMANDS - Local File System
// ============================================================================

#[tauri::command]
async fn read_file(path: String) -> Result<String, String> {
    tokio::fs::read_to_string(&path)
        .await
        .map_err(|e| format!("Failed to read file: {}", e))
}

#[tauri::command]
async fn write_file(path: String, content: String) -> Result<(), String> {
    tokio::fs::write(&path, &content)
        .await
        .map_err(|e| format!("Failed to write file: {}", e))
}

#[tauri::command]
async fn list_directory(path: String) -> Result<Vec<String>, String> {
    let mut entries = tokio::fs::read_dir(&path)
        .await
        .map_err(|e| format!("Failed to read directory: {}", e))?;

    let mut files = Vec::new();
    while let Some(entry) = entries.next_entry().await.map_err(|e| e.to_string())? {
        files.push(entry.path().display().to_string());
    }
    Ok(files)
}

#[tauri::command]
async fn file_exists(path: String) -> bool {
    tokio::fs::metadata(&path).await.is_ok()
}

// ============================================================================
// TAURI COMMANDS - Service Status
// ============================================================================

#[tauri::command]
async fn check_service_status(services: Vec<ServiceStatus>) -> Vec<ServiceStatus> {
    // In a real implementation, this would ping each service
    services.into_iter().map(|mut s| {
        s.online = false; // Default to offline
        s
    }).collect()
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
    });
    Ok(())
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
            // File System
            read_file,
            write_file,
            list_directory,
            file_exists,
            // Services
            check_service_status,
            // Antigravity
            antigravity_set_credentials,
            antigravity_get_status,
            antigravity_get_user_settings,
            antigravity_list_pages,
            antigravity_smart_focus,
            antigravity_cancel_cascade,
            antigravity_validate_cascade_overlay,
            antigravity_save_recording
        ])
        .setup(|app| {
            let window = app.get_webview_window("main").unwrap();

            // Set window title
            window.set_title("The New Fuse").unwrap();

            // Log startup
            println!("🚀 The New Fuse v{} starting...", env!("CARGO_PKG_VERSION"));
            println!("📡 MCP Bridge ready for connection");

            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
