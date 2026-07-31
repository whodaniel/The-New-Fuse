// TNF Browser bridge (native).
//
// Default backend is agent-browser (no :7331). Set TNF_BROWSER_BACKEND=legacy
// for the old packages/tnf-browser WebSocket path. That legacy server rejects
// browser Origins, so the WS client here connects without an Origin header.

use futures_util::{SinkExt, StreamExt};
use serde::{Deserialize, Serialize};
use serde_json::Value;
use std::collections::HashMap;
use std::path::PathBuf;
use std::process::{Command, Stdio};
use std::sync::Arc;
use tauri::{AppHandle, Emitter, Manager, State};
use tokio::sync::{mpsc, oneshot, Mutex};
use tokio_tungstenite::{connect_async, tungstenite::protocol::Message};
use uuid::Uuid;

const TNF_BROWSER_EVENT: &str = "tnf-browser-event";

/// Events worth pushing to the UI. Drop high-volume frames like `response`.
fn should_forward_event(event: &str) -> bool {
    matches!(
        event,
        "extensionConnected" | "extensionDisconnected" | "urlChanged"
    )
}

const DEFAULT_PORT: u16 = 7331;

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct TnfBrowserStatus {
    pub listening: bool,
    pub has_token: bool,
    pub connected: bool,
    pub runtime_connected: bool,
    pub last_error: Option<String>,
    pub port: u16,
    pub token_path: String,
}

struct PendingRequest {
    sender: oneshot::Sender<Result<Value, String>>,
}

struct ConnectionInner {
    tx: Option<mpsc::Sender<String>>,
    connected: bool,
    runtime_connected: bool,
    last_error: Option<String>,
    pending: HashMap<String, PendingRequest>,
}

pub struct TnfBrowserBridge {
    inner: Arc<Mutex<ConnectionInner>>,
}

impl Default for TnfBrowserBridge {
    fn default() -> Self {
        Self {
            inner: Arc::new(Mutex::new(ConnectionInner {
                tx: None,
                connected: false,
                runtime_connected: false,
                last_error: None,
                pending: HashMap::new(),
            })),
        }
    }
}

fn token_path() -> PathBuf {
    dirs_home().join("tnf-browser").join("token")
}

fn dirs_home() -> PathBuf {
    std::env::var_os("HOME")
        .or_else(|| std::env::var_os("USERPROFILE"))
        .map(PathBuf::from)
        .unwrap_or_else(|| PathBuf::from("."))
}

fn read_token() -> Option<String> {
    std::fs::read_to_string(token_path())
        .ok()
        .map(|s| s.trim().to_string())
        .filter(|s| !s.is_empty())
}

async fn port_open(port: u16) -> bool {
    tokio::net::TcpStream::connect(("127.0.0.1", port))
        .await
        .is_ok()
}

impl TnfBrowserBridge {
    pub async fn status(&self) -> TnfBrowserStatus {
        let listening = port_open(DEFAULT_PORT).await;
        let has_token = read_token().is_some();
        let inner = self.inner.lock().await;
        TnfBrowserStatus {
            listening,
            has_token,
            connected: inner.connected,
            runtime_connected: inner.runtime_connected,
            last_error: inner.last_error.clone(),
            port: DEFAULT_PORT,
            token_path: token_path().display().to_string(),
        }
    }

    pub async fn connect(&self, app: AppHandle) -> Result<(), String> {
        {
            let inner = self.inner.lock().await;
            if inner.connected {
                return Ok(());
            }
        }

        if !port_open(DEFAULT_PORT).await {
            return Err(format!(
                "TNF Browser is not listening on 127.0.0.1:{}. Run: tnf-browser start",
                DEFAULT_PORT
            ));
        }

        let token = read_token().ok_or_else(|| {
            format!(
                "Missing auth token at {}. Start TNF Browser first.",
                token_path().display()
            )
        })?;

        let mut url = format!("ws://127.0.0.1:{}/", DEFAULT_PORT);
        url.push_str(&format!("?token={}", token));

        let (ws_stream, _) = connect_async(&url)
            .await
            .map_err(|e| format!("TNF Browser WebSocket connection failed: {}", e))?;
        let (mut write, mut read) = ws_stream.split();
        let (tx, mut rx) = mpsc::channel::<String>(64);

        {
            let mut inner = self.inner.lock().await;
            inner.tx = Some(tx);
            inner.connected = true;
            inner.last_error = None;
        }

        let write_inner = self.inner.clone();
        tokio::spawn(async move {
            while let Some(msg) = rx.recv().await {
                if write.send(Message::Text(msg)).await.is_err() {
                    break;
                }
            }
            let mut inner = write_inner.lock().await;
            inner.connected = false;
            inner.tx = None;
        });

        let read_inner = self.inner.clone();
        let app_handle = app.clone();
        tokio::spawn(async move {
            while let Some(msg) = read.next().await {
                match msg {
                    Ok(Message::Text(text)) => {
                        if let Ok(value) = serde_json::from_str::<Value>(&text) {
                            if value.get("type").and_then(|v| v.as_str()) == Some("event") {
                                let event = value.get("event").and_then(|v| v.as_str()).unwrap_or("");
                                {
                                    let mut inner = read_inner.lock().await;
                                    if event == "extensionConnected" {
                                        inner.runtime_connected = true;
                                    } else if event == "extensionDisconnected" {
                                        inner.runtime_connected = false;
                                    }
                                }
                                if should_forward_event(event) {
                                    let _ = app_handle.emit(TNF_BROWSER_EVENT, &value);
                                }
                                continue;
                            }

                            if let Some(id) = value.get("id").and_then(|v| v.as_str()) {
                                let mut inner = read_inner.lock().await;
                                if let Some(pending) = inner.pending.remove(id) {
                                    if let Some(err) = value.get("error").and_then(|v| v.as_str()) {
                                        let _ = pending.sender.send(Err(err.to_string()));
                                    } else {
                                        let result = value.get("result").cloned().unwrap_or(Value::Null);
                                        let _ = pending.sender.send(Ok(result));
                                    }
                                }
                            }
                        }
                    }
                    Ok(Message::Close(_)) | Err(_) => break,
                    _ => {}
                }
            }
            let mut inner = read_inner.lock().await;
            inner.connected = false;
            inner.runtime_connected = false;
            inner.tx = None;
            for (_, pending) in inner.pending.drain() {
                let _ = pending.sender.send(Err("Disconnected".into()));
            }
        });

        Ok(())
    }

    pub async fn disconnect(&self) -> Result<(), String> {
        let mut inner = self.inner.lock().await;
        for (_, pending) in inner.pending.drain() {
            let _ = pending.sender.send(Err("Disconnected".into()));
        }
        inner.tx = None;
        inner.connected = false;
        inner.runtime_connected = false;
        Ok(())
    }

    pub async fn command(
        &self,
        app: AppHandle,
        action: String,
        params: Option<Value>,
        tab_id: Option<i64>,
    ) -> Result<Value, String> {
        {
            let inner = self.inner.lock().await;
            if !inner.connected {
                drop(inner);
                self.connect(app).await?;
            }
        }

        let id = format!("ui_{}", Uuid::new_v4());
        let mut payload = serde_json::json!({
            "id": id,
            "action": action,
            "params": params.unwrap_or_else(|| serde_json::json!({})),
        });
        if let Some(tab) = tab_id {
            payload["tabId"] = Value::from(tab);
        }

        let (response_tx, response_rx) = oneshot::channel();
        let tx = {
            let mut inner = self.inner.lock().await;
            inner.pending.insert(id.clone(), PendingRequest { sender: response_tx });
            inner
                .tx
                .clone()
                .ok_or_else(|| "Not connected to TNF Browser".to_string())?
        };

        tx.send(payload.to_string())
            .await
            .map_err(|e| format!("Send failed: {}", e))?;

        match tokio::time::timeout(std::time::Duration::from_secs(32), response_rx).await {
            Ok(Ok(result)) => result,
            Ok(Err(_)) => Err("Response channel closed".into()),
            Err(_) => {
                let mut inner = self.inner.lock().await;
                inner.pending.remove(&id);
                Err(format!("Command {} timed out", action))
            }
        }
    }
}

#[tauri::command]
pub async fn tnf_browser_status(
    app: AppHandle,
    bridge: State<'_, Arc<TnfBrowserBridge>>,
) -> Result<TnfBrowserStatus, String> {
    if crate::agent_browser_backend::preferred_backend() == "agent-browser" {
        let last_error = bridge.inner.lock().await.last_error.clone();
        let status = crate::agent_browser_backend::status_agent_browser(last_error, Some(&app));
        return Ok(TnfBrowserStatus {
            listening: status.listening,
            has_token: status.has_token,
            connected: status.connected,
            runtime_connected: status.runtime_connected,
            last_error: status.last_error,
            port: status.port,
            token_path: status.token_path,
        });
    }
    Ok(bridge.status().await)
}

// ---------------------------------------------------------------------------
// Runtime launcher
//
// SCOPE NOTE: this is deliberately NOT a general command runner. The generic
// `execute_command` was removed as the CRIT-1 RCE remediation and must not come
// back. This spawns one fixed program (the TNF Browser CLI) with one fixed
// argument (`start`) and accepts no caller-supplied input.
// ---------------------------------------------------------------------------

#[derive(Debug, Serialize, Clone)]
pub struct TnfBrowserStartResult {
    pub ok: bool,
    pub message: String,
    /// Exact command to run by hand when we cannot launch it ourselves.
    pub command: String,
    pub already_running: bool,
}

/// Locate `bin/cli.js` — bundled resource first, then dev monorepo layouts.
fn resolve_cli_path(app: &AppHandle) -> Option<PathBuf> {
    if let Ok(dir) = std::env::var("TNF_BROWSER_CLI") {
        let explicit = PathBuf::from(dir);
        if explicit.is_file() {
            return Some(explicit);
        }
    }

    if let Ok(resource_dir) = app.path().resource_dir() {
        let bundled = resource_dir.join("tnf-browser").join("bin").join("cli.js");
        if bundled.is_file() {
            return Some(bundled);
        }
    }

    let mut roots: Vec<PathBuf> = Vec::new();
    if let Ok(cwd) = std::env::current_dir() {
        roots.push(cwd);
    }
    if let Ok(manifest) = std::env::var("CARGO_MANIFEST_DIR") {
        roots.push(PathBuf::from(manifest));
    }

    // Walk up a few levels from each root looking for the workspace package.
    for root in roots {
        let mut cursor = root.as_path();
        for _ in 0..6 {
            let candidate = cursor
                .join("packages")
                .join("tnf-browser")
                .join("bin")
                .join("cli.js");
            if candidate.is_file() {
                return Some(candidate);
            }
            match cursor.parent() {
                Some(parent) => cursor = parent,
                None => break,
            }
        }
    }

    None
}

/// Locate a node binary. A macOS .app launched from Finder inherits a minimal
/// PATH, so PATH lookup alone is not enough.
fn resolve_node() -> Option<PathBuf> {
    if let Ok(explicit) = std::env::var("NODE") {
        let path = PathBuf::from(explicit);
        if path.is_file() {
            return Some(path);
        }
    }

    if let Ok(path_var) = std::env::var("PATH") {
        for dir in std::env::split_paths(&path_var) {
            let candidate = dir.join("node");
            if candidate.is_file() {
                return Some(candidate);
            }
        }
    }

    let home = dirs_home();
    let fallbacks = [
        home.join(".local").join("bin").join("node"),
        PathBuf::from("/opt/homebrew/bin/node"),
        PathBuf::from("/usr/local/bin/node"),
        PathBuf::from("/usr/bin/node"),
    ];
    fallbacks.into_iter().find(|p| p.is_file())
}

#[tauri::command]
pub async fn tnf_browser_start(app: AppHandle) -> Result<TnfBrowserStartResult, String> {
    if crate::agent_browser_backend::preferred_backend() == "agent-browser" {
        let started = crate::agent_browser_backend::start_agent_browser(&app);
        return Ok(TnfBrowserStartResult {
            ok: started.ok,
            message: started.message,
            command: started.command,
            already_running: started.already_running,
        });
    }

    let manual = "tnf browser legacy-start".to_string();

    if port_open(DEFAULT_PORT).await {
        return Ok(TnfBrowserStartResult {
            ok: true,
            message: format!("Legacy TNF Browser already listening on :{}", DEFAULT_PORT),
            command: manual,
            already_running: true,
        });
    }

    let cli = match resolve_cli_path(&app) {
        Some(path) => path,
        None => {
            return Ok(TnfBrowserStartResult {
                ok: false,
                message: "TNF Browser CLI not found. Start it from a terminal.".to_string(),
                command: manual,
                already_running: false,
            })
        }
    };

    let node = match resolve_node() {
        Some(path) => path,
        None => {
            return Ok(TnfBrowserStartResult {
                ok: false,
                message: "Node.js not found on PATH. Start TNF Browser from a terminal."
                    .to_string(),
                command: format!("node {} start", cli.display()),
                already_running: false,
            })
        }
    };

    let resolved = format!("{} {} start", node.display(), cli.display());

    match Command::new(&node)
        .arg(&cli)
        .arg("start")
        .stdin(Stdio::null())
        .stdout(Stdio::null())
        .stderr(Stdio::null())
        .spawn()
    {
        Ok(child) => Ok(TnfBrowserStartResult {
            ok: true,
            message: format!(
                "Legacy TNF Browser starting (pid {}) — opens managed Chromium, then :{}",
                child.id(),
                DEFAULT_PORT
            ),
            command: resolved,
            already_running: false,
        }),
        Err(err) => Ok(TnfBrowserStartResult {
            ok: false,
            message: format!("Failed to launch TNF Browser: {}", err),
            command: resolved,
            already_running: false,
        }),
    }
}

#[tauri::command]
pub async fn tnf_browser_connect(
    app: AppHandle,
    bridge: State<'_, Arc<TnfBrowserBridge>>,
) -> Result<bool, String> {
    if crate::agent_browser_backend::preferred_backend() == "agent-browser" {
        if !crate::agent_browser_backend::agent_browser_available(Some(&app)) {
            return Err(
                "agent-browser is not available. Run Start Runtime or install agent-browser."
                    .into(),
            );
        }
        let mut inner = bridge.inner.lock().await;
        inner.connected = true;
        inner.runtime_connected = true;
        inner.last_error = None;
        return Ok(true);
    }
    bridge.connect(app).await?;
    Ok(true)
}

#[tauri::command]
pub async fn tnf_browser_disconnect(
    bridge: State<'_, Arc<TnfBrowserBridge>>,
) -> Result<bool, String> {
    bridge.disconnect().await?;
    Ok(true)
}

#[tauri::command]
pub async fn tnf_browser_command(
    app: AppHandle,
    action: String,
    params: Option<Value>,
    tab_id: Option<i64>,
    bridge: State<'_, Arc<TnfBrowserBridge>>,
) -> Result<Value, String> {
    if crate::agent_browser_backend::preferred_backend() == "agent-browser" {
        return crate::agent_browser_backend::run_mapped_command(&app, &action, params);
    }
    bridge.command(app, action, params, tab_id).await
}
