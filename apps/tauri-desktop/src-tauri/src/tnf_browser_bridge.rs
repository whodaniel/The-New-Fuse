// TNF Browser WebSocket bridge (native, no Origin header).
// Lets the desktop UI talk to ws://127.0.0.1:7331 without being rejected
// by the browser Origin gate in packages/tnf-browser.

use futures_util::{SinkExt, StreamExt};
use serde::{Deserialize, Serialize};
use serde_json::Value;
use std::collections::HashMap;
use std::path::PathBuf;
use std::sync::Arc;
use tauri::State;
use tokio::sync::{mpsc, oneshot, Mutex};
use tokio_tungstenite::{connect_async, tungstenite::protocol::Message};
use uuid::Uuid;

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

    pub async fn connect(&self) -> Result<(), String> {
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
        tokio::spawn(async move {
            while let Some(msg) = read.next().await {
                match msg {
                    Ok(Message::Text(text)) => {
                        if let Ok(value) = serde_json::from_str::<Value>(&text) {
                            if value.get("type").and_then(|v| v.as_str()) == Some("event") {
                                let event = value.get("event").and_then(|v| v.as_str()).unwrap_or("");
                                let mut inner = read_inner.lock().await;
                                if event == "extensionConnected" {
                                    inner.runtime_connected = true;
                                } else if event == "extensionDisconnected" {
                                    inner.runtime_connected = false;
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
        action: String,
        params: Option<Value>,
        tab_id: Option<i64>,
    ) -> Result<Value, String> {
        {
            let inner = self.inner.lock().await;
            if !inner.connected {
                drop(inner);
                self.connect().await?;
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
    bridge: State<'_, Arc<TnfBrowserBridge>>,
) -> Result<TnfBrowserStatus, String> {
    Ok(bridge.status().await)
}

#[tauri::command]
pub async fn tnf_browser_connect(bridge: State<'_, Arc<TnfBrowserBridge>>) -> Result<bool, String> {
    bridge.connect().await?;
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
    action: String,
    params: Option<Value>,
    tab_id: Option<i64>,
    bridge: State<'_, Arc<TnfBrowserBridge>>,
) -> Result<Value, String> {
    bridge.command(action, params, tab_id).await
}
