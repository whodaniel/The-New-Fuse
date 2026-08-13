// The New Fuse - WebSocket Bridge
// Handles secure tunnel to CloudRuntime cloud sandbox

use futures_util::{SinkExt, StreamExt};
use serde::{Deserialize, Serialize};
use std::sync::atomic::{AtomicBool, Ordering};
use std::sync::Arc;
use std::time::Duration;
use tokio::sync::{mpsc, Mutex};
use tokio::task::JoinHandle;
use tokio_tungstenite::{connect_async, tungstenite::protocol::Message};

// ============================================================================
// TYPES
// ============================================================================

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct MCPMessage {
    pub jsonrpc: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub id: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub method: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub params: Option<serde_json::Value>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub result: Option<serde_json::Value>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub error: Option<MCPError>,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct MCPError {
    pub code: i32,
    pub message: String,
}

pub struct BridgeConnection {
    pub url: String,
    pub connected: bool,
    pub tx: Option<mpsc::Sender<String>>,
}

impl BridgeConnection {
    pub fn new(url: String) -> Self {
        Self {
            url,
            connected: false,
            tx: None,
        }
    }
}

// ============================================================================
// BRIDGE MANAGER
// ============================================================================

pub struct BridgeManager {
    connection: Arc<Mutex<BridgeConnection>>,
    response_handlers:
        Arc<Mutex<std::collections::HashMap<String, tokio::sync::oneshot::Sender<MCPMessage>>>>,
    /// Operator wants the tunnel up (drives reconnect). Cleared by disconnect().
    want_connected: Arc<AtomicBool>,
    supervisor: Arc<Mutex<Option<JoinHandle<()>>>>,
}

impl BridgeManager {
    pub fn new(sandbox_url: String) -> Self {
        Self {
            connection: Arc::new(Mutex::new(BridgeConnection::new(sandbox_url))),
            response_handlers: Arc::new(Mutex::new(std::collections::HashMap::new())),
            want_connected: Arc::new(AtomicBool::new(false)),
            supervisor: Arc::new(Mutex::new(None)),
        }
    }

    pub async fn connect(&self) -> Result<(), String> {
        // Tear down any prior supervisor so we don't double-connect.
        self.disconnect().await?;

        self.want_connected.store(true, Ordering::SeqCst);

        // First establishment must succeed synchronously so invoke('connect_bridge') fails closed.
        self.open_socket_once().await?;

        self.spawn_supervisor().await;
        Ok(())
    }

    async fn spawn_supervisor(&self) {
        let connection = self.connection.clone();
        let response_handlers = self.response_handlers.clone();
        let want_connected = self.want_connected.clone();

        let handle = tokio::spawn(async move {
            let mut backoff_secs: u64 = 1;
            loop {
                // Wait until the current session drops, or exit if operator disconnected.
                loop {
                    if !want_connected.load(Ordering::SeqCst) {
                        return;
                    }
                    let still_up = {
                        let conn = connection.lock().await;
                        conn.connected
                    };
                    if !still_up {
                        break;
                    }
                    tokio::time::sleep(Duration::from_millis(500)).await;
                }

                if !want_connected.load(Ordering::SeqCst) {
                    return;
                }

                println!(
                    "🔁 Bridge reconnect in {}s…",
                    backoff_secs
                );
                tokio::time::sleep(Duration::from_secs(backoff_secs)).await;

                if !want_connected.load(Ordering::SeqCst) {
                    return;
                }

                match Self::establish(
                    connection.clone(),
                    response_handlers.clone(),
                    want_connected.clone(),
                )
                .await
                {
                    Ok(()) => {
                        backoff_secs = 1;
                        println!("✅ Bridge reconnected");
                    }
                    Err(e) => {
                        println!("⚠️ Bridge reconnect failed: {}", e);
                        backoff_secs = (backoff_secs.saturating_mul(2)).min(30);
                    }
                }
            }
        });

        let mut slot = self.supervisor.lock().await;
        *slot = Some(handle);
    }

    async fn open_socket_once(&self) -> Result<(), String> {
        Self::establish(
            self.connection.clone(),
            self.response_handlers.clone(),
            self.want_connected.clone(),
        )
        .await
    }

    async fn establish(
        connection: Arc<Mutex<BridgeConnection>>,
        response_handlers: Arc<
            Mutex<std::collections::HashMap<String, tokio::sync::oneshot::Sender<MCPMessage>>>,
        >,
        want_connected: Arc<AtomicBool>,
    ) -> Result<(), String> {
        let url = {
            let conn = connection.lock().await;
            conn.url.clone()
        };

        println!("🔌 Connecting to cloud sandbox: {}", url);

        let (ws_stream, _) = connect_async(&url)
            .await
            .map_err(|e| format!("WebSocket connection failed: {}", e))?;

        let (mut write, mut read) = ws_stream.split();
        let (tx, mut rx) = mpsc::channel::<String>(32);

        {
            let mut conn = connection.lock().await;
            conn.tx = Some(tx);
            conn.connected = true;
        }

        println!("✅ Connected to cloud sandbox");

        // Write + ping task
        let write_want = want_connected.clone();
        let _write_handle = tokio::spawn(async move {
            let mut ping = tokio::time::interval(Duration::from_secs(25));
            ping.set_missed_tick_behavior(tokio::time::MissedTickBehavior::Delay);
            loop {
                if !write_want.load(Ordering::SeqCst) {
                    let _ = write.close().await;
                    break;
                }
                tokio::select! {
                    msg = rx.recv() => {
                        match msg {
                            Some(text) => {
                                if write.send(Message::Text(text)).await.is_err() {
                                    break;
                                }
                            }
                            None => break,
                        }
                    }
                    _ = ping.tick() => {
                        if write.send(Message::Ping(Vec::new())).await.is_err() {
                            break;
                        }
                    }
                }
            }
        });

        // Read task
        let handlers = response_handlers.clone();
        let conn_ref = connection.clone();
        let read_want = want_connected.clone();
        let _read_handle = tokio::spawn(async move {
            while let Some(msg) = read.next().await {
                if !read_want.load(Ordering::SeqCst) {
                    break;
                }
                match msg {
                    Ok(Message::Text(text)) => {
                        if let Ok(mcp_msg) = serde_json::from_str::<MCPMessage>(&text) {
                            if let Some(id) = &mcp_msg.id {
                                let mut handlers_lock = handlers.lock().await;
                                if let Some(sender) = handlers_lock.remove(id) {
                                    let _ = sender.send(mcp_msg);
                                }
                            }
                        }
                    }
                    Ok(Message::Ping(payload)) => {
                        // Library usually auto-pongs; ignore payload.
                        let _ = payload;
                    }
                    Ok(Message::Pong(_)) => {}
                    Ok(Message::Close(_)) => {
                        println!("❌ Cloud sandbox connection closed");
                        break;
                    }
                    Err(e) => {
                        println!("⚠️ WebSocket error: {}", e);
                        break;
                    }
                    _ => {}
                }
            }

            let mut conn = conn_ref.lock().await;
            conn.connected = false;
            conn.tx = None;
        });

        Ok(())
    }

    pub async fn disconnect(&self) -> Result<(), String> {
        self.want_connected.store(false, Ordering::SeqCst);

        if let Some(handle) = self.supervisor.lock().await.take() {
            handle.abort();
        }

        {
            let mut conn = self.connection.lock().await;
            conn.connected = false;
            // Dropping tx closes the write loop; read loop exits on next message/error.
            conn.tx = None;
        }

        // Fail pending RPC waiters so callers don't hang for 30s.
        {
            let mut handlers = self.response_handlers.lock().await;
            handlers.clear();
        }

        Ok(())
    }

    pub async fn is_connected(&self) -> bool {
        let conn = self.connection.lock().await;
        conn.connected
    }

    pub async fn send_request(
        &self,
        method: &str,
        params: Option<serde_json::Value>,
    ) -> Result<MCPMessage, String> {
        let conn = self.connection.lock().await;

        if !conn.connected {
            return Err("Not connected to cloud sandbox".to_string());
        }

        let tx = conn.tx.clone().ok_or("No sender available")?;
        drop(conn);

        let id = uuid::Uuid::new_v4().to_string();

        let request = MCPMessage {
            jsonrpc: "2.0".to_string(),
            id: Some(id.clone()),
            method: Some(method.to_string()),
            params,
            result: None,
            error: None,
        };

        let (response_tx, response_rx) = tokio::sync::oneshot::channel();

        {
            let mut handlers = self.response_handlers.lock().await;
            handlers.insert(id.clone(), response_tx);
        }

        let request_json =
            serde_json::to_string(&request).map_err(|e| format!("Serialization error: {}", e))?;

        tx.send(request_json)
            .await
            .map_err(|e| format!("Send error: {}", e))?;

        match tokio::time::timeout(Duration::from_secs(30), response_rx).await {
            Ok(Ok(response)) => Ok(response),
            Ok(Err(_)) => Err("Response channel closed".to_string()),
            Err(_) => {
                let mut handlers = self.response_handlers.lock().await;
                handlers.remove(&id);
                Err("Request timeout".to_string())
            }
        }
    }

    pub async fn call_tool(
        &self,
        tool_name: &str,
        arguments: serde_json::Value,
    ) -> Result<serde_json::Value, String> {
        let params = serde_json::json!({
            "name": tool_name,
            "arguments": arguments
        });

        let response = self.send_request("tools/call", Some(params)).await?;

        if let Some(error) = response.error {
            return Err(error.message);
        }

        Ok(response.result.unwrap_or(serde_json::Value::Null))
    }

    pub async fn list_tools(&self) -> Result<Vec<serde_json::Value>, String> {
        let response = self.send_request("tools/list", None).await?;

        if let Some(error) = response.error {
            return Err(error.message);
        }

        if let Some(result) = response.result {
            if let Some(tools) = result.get("tools") {
                if let Some(tools_array) = tools.as_array() {
                    return Ok(tools_array.clone());
                }
            }
        }

        Ok(vec![])
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_mcp_message_serialization() {
        let msg = MCPMessage {
            jsonrpc: "2.0".to_string(),
            id: Some("123".to_string()),
            method: Some("test".to_string()),
            params: None,
            result: None,
            error: None,
        };

        let json = serde_json::to_string(&msg).unwrap();
        assert!(json.contains("\"jsonrpc\":\"2.0\""));
    }
}
