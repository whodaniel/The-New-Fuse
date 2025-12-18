// The New Fuse - WebSocket Bridge
// Handles secure tunnel to Railway cloud sandbox

use std::sync::Arc;
use tokio::sync::{mpsc, Mutex};
use tokio_tungstenite::{connect_async, tungstenite::protocol::Message};
use futures_util::{SinkExt, StreamExt};
use serde::{Deserialize, Serialize};

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
    response_handlers: Arc<Mutex<std::collections::HashMap<String, tokio::sync::oneshot::Sender<MCPMessage>>>>,
}

impl BridgeManager {
    pub fn new(sandbox_url: String) -> Self {
        Self {
            connection: Arc::new(Mutex::new(BridgeConnection::new(sandbox_url))),
            response_handlers: Arc::new(Mutex::new(std::collections::HashMap::new())),
        }
    }

    pub async fn connect(&self) -> Result<(), String> {
        let connection = self.connection.clone();
        let response_handlers = self.response_handlers.clone();

        let url = {
            let conn = connection.lock().await;
            conn.url.clone()
        };

        println!("🔌 Connecting to cloud sandbox: {}", url);

        // Connect to WebSocket
        let (ws_stream, _) = connect_async(&url)
            .await
            .map_err(|e| format!("WebSocket connection failed: {}", e))?;

        let (mut write, mut read) = ws_stream.split();

        // Create channel for sending messages
        let (tx, mut rx) = mpsc::channel::<String>(32);

        // Store the sender
        {
            let mut conn = connection.lock().await;
            conn.tx = Some(tx);
            conn.connected = true;
        }

        println!("✅ Connected to cloud sandbox");

        // Spawn write task
        let _write_handle = tokio::spawn(async move {
            while let Some(msg) = rx.recv().await {
                if write.send(Message::Text(msg)).await.is_err() {
                    break;
                }
            }
        });

        // Spawn read task
        let handlers = response_handlers.clone();
        let conn_ref = connection.clone();
        let _read_handle = tokio::spawn(async move {
            while let Some(msg) = read.next().await {
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

            // Mark as disconnected
            let mut conn = conn_ref.lock().await;
            conn.connected = false;
            conn.tx = None;
        });

        Ok(())
    }

    pub async fn disconnect(&self) -> Result<(), String> {
        let mut conn = self.connection.lock().await;
        conn.connected = false;
        conn.tx = None;
        Ok(())
    }

    pub async fn is_connected(&self) -> bool {
        let conn = self.connection.lock().await;
        conn.connected
    }

    pub async fn send_request(&self, method: &str, params: Option<serde_json::Value>) -> Result<MCPMessage, String> {
        let conn = self.connection.lock().await;

        if !conn.connected {
            return Err("Not connected to cloud sandbox".to_string());
        }

        let tx = conn.tx.clone().ok_or("No sender available")?;
        drop(conn); // Release lock before sending

        // Generate request ID
        let id = uuid::Uuid::new_v4().to_string();

        // Create request
        let request = MCPMessage {
            jsonrpc: "2.0".to_string(),
            id: Some(id.clone()),
            method: Some(method.to_string()),
            params,
            result: None,
            error: None,
        };

        // Create response channel
        let (response_tx, response_rx) = tokio::sync::oneshot::channel();

        // Register handler
        {
            let mut handlers = self.response_handlers.lock().await;
            handlers.insert(id.clone(), response_tx);
        }

        // Send request
        let request_json = serde_json::to_string(&request)
            .map_err(|e| format!("Serialization error: {}", e))?;

        tx.send(request_json)
            .await
            .map_err(|e| format!("Send error: {}", e))?;

        // Wait for response with timeout
        match tokio::time::timeout(std::time::Duration::from_secs(30), response_rx).await {
            Ok(Ok(response)) => Ok(response),
            Ok(Err(_)) => Err("Response channel closed".to_string()),
            Err(_) => {
                // Remove handler on timeout
                let mut handlers = self.response_handlers.lock().await;
                handlers.remove(&id);
                Err("Request timeout".to_string())
            }
        }
    }

    pub async fn call_tool(&self, tool_name: &str, arguments: serde_json::Value) -> Result<serde_json::Value, String> {
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

// ============================================================================
// TESTS
// ============================================================================

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
