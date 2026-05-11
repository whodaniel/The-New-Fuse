import os
import sys
from tnf_forge import ForgeCompiler

def forge_gateway_synapse():
    """
    Phase 3.3: Forge the Native Gateway Synapse.
    High-performance Rust reverse proxy for API routing.
    """
    forge = ForgeCompiler()
    
    cargo_toml = """
[package]
name = "gateway-synapse"
version = "0.1.0"
edition = "2021"

[dependencies]
axum = { version = "0.7" }
tokio = { version = "1", features = ["full"] }
reqwest = { version = "0.12", features = ["json", "stream"] }
serde = { version = "1.0", features = ["derive"] }
serde_json = "1.0"
tower-http = { version = "0.5", features = ["cors"] }
http = "1.0"
"""

    main_rs = """
use axum::{
    extract::{Path, Request, State},
    routing::{any, get},
    response::IntoResponse,
    Router,
};
use std::sync::Arc;
use std::collections::HashMap;
use reqwest::Client;
use http::{HeaderName, HeaderValue, StatusCode};

struct GatewayState {
    client: Client,
    routes: HashMap<String, String>,
}

#[tokio::main]
async fn main() {
    let mut routes = HashMap::new();
    routes.insert("backend".to_string(), "http://localhost:3004".to_string());
    routes.insert("api".to_string(), "http://localhost:3001".to_string());
    routes.insert("agents".to_string(), "http://localhost:3001".to_string());
    routes.insert("relay".to_string(), "http://localhost:3000".to_string());

    let state = Arc::new(GatewayState {
        client: Client::new(),
        routes,
    });

    let app = Router::new()
        .route("/health", get(|| async { "healthy" }))
        .route("/proxy/:service/*path", any(proxy_handler))
        .with_state(state);

    println!("[🛡️] Native Gateway Synapse Active on Port 3008");
    let listener = tokio::net::TcpListener::bind("0.0.0.0:3008").await.unwrap();
    axum::serve(listener, app).await.unwrap();
}

async fn proxy_handler(
    State(state): State<Arc<GatewayState>>,
    Path((service, path)): Path<(String, String)>,
    req: Request,
) -> impl IntoResponse {
    let target_base = match state.routes.get(&service) {
        Some(url) => url,
        None => return (StatusCode::NOT_FOUND, format!("Service '{}' not found", service)).into_response(),
    };

    let target_url = format!("{}/{}", target_base, path);

    let method = req.method().clone();
    let headers = req.headers().clone();
    
    let mut rb = state.client.request(method.into(), &target_url);
    
    for (key, value) in headers.iter() {
        if key != "host" {
            rb = rb.header(key.as_str(), value.as_bytes());
        }
    }

    match rb.send().await {
        Ok(res) => {
            let status = StatusCode::from_u16(res.status().as_u16()).unwrap_or(StatusCode::INTERNAL_SERVER_ERROR);
            let res_headers = res.headers().clone();
            let body = res.bytes().await.unwrap_or_default();
            
            let mut response = (status, body).into_response();
            for (key, value) in res_headers.iter() {
                if let Ok(name) = HeaderName::from_bytes(key.as_str().as_bytes()) {
                    response.headers_mut().insert(name, HeaderValue::from_bytes(value.as_bytes()).unwrap());
                }
            }
            response
        },
        Err(e) => (StatusCode::BAD_GATEWAY, format!("Proxy error: {}", e)).into_response(),
    }
}
"""

    base_dir = os.path.dirname(os.path.abspath(__file__))
    project_dir = os.path.join(base_dir, "bin/forged/gateway-synapse_project")
    os.makedirs(os.path.join(project_dir, "src"), exist_ok=True)
    
    with open(os.path.join(project_dir, "Cargo.toml"), "w") as f:
        f.write(cargo_toml)
    with open(os.path.join(project_dir, "src/main.rs"), "w") as f:
        f.write(main_rs)
        
    print(f"Forging Gateway Synapse project at {project_dir}...")

if __name__ == "__main__":
    forge_gateway_synapse()
