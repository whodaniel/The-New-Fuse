import os
import sys
from tnf_forge import ForgeCompiler

def forge_native_synapse():
    """
    Phase 3.1: Forge the Native Relay Synapse.
    This replaces the high-latency broadcast loops of the Node.js relay.
    """
    forge = ForgeCompiler()
    
    cargo_toml = """
[package]
name = "relay-synapse"
version = "0.1.0"
edition = "2021"

[dependencies]
tokio = { version = "1", features = ["full"] }
warp = "0.3"
serde = { version = "1.0", features = ["derive"] }
serde_json = "1.0"
futures-util = "0.3"
dashmap = "5.5"
uuid = { version = "1.4", features = ["v4"] }
chrono = "0.4"
"""

    main_rs = """
use std::sync::Arc;
use tokio::sync::mpsc;
use warp::Filter;
use futures_util::{StreamExt, SinkExt};
use serde::{Deserialize, Serialize};
use dashmap::DashMap;
use uuid::Uuid;
use chrono::Utc;
use std::env;
use log::{info, error};

#[derive(Debug, Serialize, Deserialize, Clone)]
struct SynapticEnvelope {
    #[serde(rename = "type")]
    msg_type: String,
    source: Option<String>,
    payload: serde_json::Value,
    timestamp: Option<String>,
}

type Clients = Arc<DashMap<String, mpsc::UnboundedSender<warp::ws::Message>>>;

struct Client {
    id: String,
    sender: mpsc::UnboundedSender<warp::ws::Message>,
}

struct SynapseManager {
    clients: Arc<DashMap<String, mpsc::UnboundedSender<warp::ws::Message>>>,
}

impl SynapseManager {
    fn new() -> Self {
        SynapseManager {
            clients: Arc::new(DashMap::new()),
        }
    }

    fn register_client(&self, client_id: String, sender: mpsc::UnboundedSender<warp::ws::Message>) {
        self.clients.insert(client_id.clone(), sender);
        info!("[+] Synapse Node Joined: {}", client_id);
    }

    fn deregister_client(&self, client_id: &str) {
        self.clients.remove(client_id);
        info!("[-] Synapse Node Left: {}", client_id);
    }

    fn broadcast_message(&self, sender_id: &str, message_text: String) {
        for entry in self.clients.iter() {
            if *entry.key() != sender_id {
                if let Err(e) = entry.value().send(warp::ws::Message::text(message_text.clone())) {
                    error!("[!] Error broadcasting message to client {}: {}", entry.key(), e);
                }
            }
        }
    }
}

impl SynapticEnvelope {
    fn to_broadcast_payload(&self) -> String {
        serde_json::to_string(self).unwrap_or_else(|e| {
            error!("Failed to serialize SynapticEnvelope for broadcast: {}", e);
            format!("{{\"error\": \"failed to serialize message\", \"original_type\": \"{}\", \"source\": \"{}\"}}", self.msg_type, self.source.as_deref().unwrap_or("unknown"))
        })
    }
}

#[tokio::main]
async fn main() {
    env_logger::init();

    let synapse_manager = Arc::new(SynapseManager::new());
    let synapse_manager_filter = warp::any().map(move || synapse_manager.clone());

    let port_str = env::var("RELAY_SYNAPSE_PORT").unwrap_or_else(|_| "3006".to_string());
    let port: u16 = port_str.parse().expect("Invalid port number");

    let ws_route = warp::path("synapse")
        .and(warp::ws())
        .and(synapse_manager_filter)
        .map(|ws: warp::ws::Ws, synapse_manager| {
            ws.on_upgrade(move |socket| handle_connection(socket, synapse_manager))
        });

    info!("[🧠] Native Relay Synapse Active on Port {}", port);
    warp::serve(ws_route).run(([0, 0, 0, 0], port)).await;
}

async fn handle_connection(ws: warp::ws::WebSocket, synapse_manager: Arc<SynapseManager>) {
    let client_id = Uuid::new_v4().to_string();
    let (mut user_ws_tx, mut user_ws_rx) = ws.split();
    let (tx, mut rx) = mpsc::unbounded_channel();

    synapse_manager.register_client(client_id.clone(), tx);

    // Forward internal channel to WebSocket
    tokio::task::spawn(async move {
        while let Some(message) = rx.recv().await {
            if let Err(e) = user_ws_tx.send(message).await {
                error!("[!] Synapse Tx Error for {}: {}", client_id, e);
                break;
            }
        }
    });

    // Handle incoming messages (The Synaptic Routing)
    while let Some(result) = user_ws_rx.next().await {
        let msg = match result {
            Ok(msg) => msg,
            Err(e) => {
                error!("[!] Synapse Rx Error for {}: {}", client_id, e);
                break;
            }
        };

        if let Err(e) = process_websocket_message(&client_id, msg, &synapse_manager).await {
            error!("Error processing websocket message for client {}: {}", client_id, e);
        }
    }

    synapse_manager.deregister_client(&client_id);
}

async fn process_websocket_message(
    client_id: &str,
    msg: warp::ws::Message,
    synapse_manager: &Arc<SynapseManager>,
) -> Result<(), Box<dyn std::error::Error + Send + Sync>> {
    if msg.is_text() {
        let text = msg.to_str()?;
        match serde_json::from_str::<SynapticEnvelope>(text) {
            Ok(mut envelope) => {
                if envelope.msg_type == "BROADCAST" {
                    envelope.timestamp = Some(Utc::now().to_rfc3339());
                    if envelope.source.is_none() {
                        envelope.source = Some(client_id.to_string());
                    }
                    synapse_manager.broadcast_message(client_id, envelope.to_broadcast_payload());
                } else {
                    info!("Received non-broadcast envelope from {}: {:?}", client_id, envelope);
                }
            }
            Err(e) => {
                error!("Failed to deserialize message into SynapticEnvelope for {}: {}. Original message: {}", client_id, e, text);
                synapse_manager.broadcast_message(client_id, text.to_string());
            }
        }
    } else if msg.is_binary() {
        info!("Received binary message from {}. Not currently handled.", client_id);
    } else if msg.is_close() {
        info!("Received close message from {}.", client_id);
    } else if msg.is_ping() {
        info!("Received ping from {}.", client_id);
    } else if msg.is_pong() {
        info!("Received pong from {}.", client_id);
    }
    Ok(())
}
}
"""

    try:
        binary_path = forge.forge_cargo_project("relay-synapse", main_rs, cargo_toml)
        print(f"SUCCESS: Native Relay Synapse Forged at: {binary_path}")
        return binary_path
    except Exception as e:
        print(f"Synapse Forge failed: {e}")
        return None

if __name__ == "__main__":
    forge_native_synapse()
