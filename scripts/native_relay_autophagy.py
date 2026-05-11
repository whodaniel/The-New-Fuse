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
use std::collections::HashMap;
use std::sync::Arc;
use tokio::sync::{mpsc, RwLock};
use warp::Filter;
use futures_util::{StreamExt, SinkExt};
use serde::{Deserialize, Serialize};
use dashmap::DashMap;
use uuid::Uuid;
use chrono::Utc;

#[derive(Debug, Serialize, Deserialize, Clone)]
struct SynapticEnvelope {
    #[serde(rename = "type")]
    msg_type: String,
    source: Option<String>,
    payload: serde_json::Value,
    timestamp: Option<String>,
}

type Clients = Arc<DashMap<String, mpsc::UnboundedSender<warp::ws::Message>>>;

#[tokio::main]
async fn main() {
    let clients: Clients = Arc::new(DashMap::new());
    let clients_filter = warp::any().map(move || clients.clone());

    let ws_route = warp::path("synapse")
        .and(warp::ws())
        .and(clients_filter)
        .map(|ws: warp::ws::Ws, clients| {
            ws.on_upgrade(move |socket| handle_connection(socket, clients))
        });

    println!("[🧠] Native Relay Synapse Active on Port 3006");
    warp::serve(ws_route).run(([0, 0, 0, 0], 3006)).await;
}

async fn handle_connection(ws: warp::ws::WebSocket, clients: Clients) {
    let client_id = Uuid::new_v4().to_string();
    let (mut user_ws_tx, mut user_ws_rx) = ws.split();
    let (tx, mut rx) = mpsc::unbounded_channel();

    clients.insert(client_id.clone(), tx);
    println!("[+] Synapse Node Joined: {}", client_id);

    // Forward internal channel to WebSocket
    tokio::task::spawn(async move {
        while let Some(message) = rx.recv().await {
            if let Err(e) = user_ws_tx.send(message).await {
                eprintln!("[!] Synapse Tx Error: {}", e);
                break;
            }
        }
    });

    // Handle incoming messages (The Synaptic Routing)
    while let Some(result) = user_ws_rx.next().await {
        let msg = match result {
            Ok(msg) => msg,
            Err(e) => {
                eprintln!("[!] Synapse Rx Error: {}", e);
                break;
            }
        };

        if msg.is_text() {
            if let Ok(text) = msg.to_str() {
                if let Ok(mut envelope) = serde_json::from_str::<SynapticEnvelope>(text) {
                    if envelope.msg_type == "BROADCAST" {
                        // High-speed routing pass
                        envelope.timestamp = Some(Utc::now().to_rfc3339());
                        if envelope.source.is_none() {
                            envelope.source = Some(client_id.clone());
                        }
                        
                        let broadcast_payload = serde_json::to_string(&envelope).unwrap();
                        
                        for entry in clients.iter() {
                            if *entry.key() != client_id {
                                let _ = entry.value().send(warp::ws::Message::text(broadcast_payload.clone()));
                            }
                        }
                    }
                } else {
                   // Fallback for non-envelope broadcasts
                   for entry in clients.iter() {
                       if *entry.key() != client_id {
                           let _ = entry.value().send(msg.clone());
                       }
                   }
                }
            }
        }
    }

    clients.remove(&client_id);
    println!("[-] Synapse Node Left: {}", client_id);
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
