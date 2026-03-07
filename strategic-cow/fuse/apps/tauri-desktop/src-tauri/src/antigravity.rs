// The New Fuse - Antigravity Integration Module
// Provides backend support for Antigravity Agent capabilities
// Includes gRPC-like communication with Antigravity servers

use serde::{Deserialize, Serialize};
use std::sync::Arc;
use tokio::sync::Mutex;

// ============================================================================
// TYPES
// ============================================================================

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AntigravityCredentials {
    pub csrf_token: String,
    pub server_address: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AntigravityStatus {
    pub connected: bool,
    pub status_code: u32,
    pub message: String,
    pub version: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PageInfo {
    pub id: String,
    pub title: String,
    pub url: String,
    pub favicon: Option<String>,
    pub active: bool,
    pub tab_id: Option<u32>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct UserSettings {
    pub theme: Option<String>,
    pub language: Option<String>,
    pub auto_start: Option<bool>,
    pub notifications: Option<bool>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ScreenRecording {
    pub id: String,
    pub filename: String,
    pub conversation_id: String,
    pub duration: f64,
    pub size: u64,
}

// ============================================================================
// ANTIGRAVITY CLIENT
// ============================================================================

pub struct AntigravityClient {
    credentials: Option<AntigravityCredentials>,
    connected: bool,
    http_client: reqwest::Client,
}

impl AntigravityClient {
    pub fn new() -> Self {
        Self {
            credentials: None,
            connected: false,
            http_client: reqwest::Client::builder()
                .timeout(std::time::Duration::from_secs(30))
                .build()
                .expect("Failed to create HTTP client"),
        }
    }

    pub fn set_credentials(&mut self, credentials: AntigravityCredentials) {
        self.credentials = Some(credentials);
    }

    pub async fn get_status(&self) -> Result<AntigravityStatus, String> {
        let credentials = self.credentials.as_ref()
            .ok_or("No credentials configured")?;

        let url = format!("{}/api/status", credentials.server_address);

        match self.http_client.get(&url)
            .header("X-CSRF-Token", &credentials.csrf_token)
            .header("Origin", &credentials.server_address)
            .send()
            .await
        {
            Ok(response) if response.status().is_success() => {
                match response.json::<AntigravityStatus>().await {
                    Ok(status) => Ok(status),
                    Err(e) => Err(format!("Failed to parse status response: {}", e)),
                }
            }
            Ok(response) => {
                Err(format!("Server returned error: {}", response.status()))
            }
            Err(e) => {
                // If connection fails, return a disconnected status instead of error
                // This allows the UI to show proper connection state
                Ok(AntigravityStatus {
                    connected: false,
                    status_code: 0,
                    message: format!("Connection failed: {}", e),
                    version: None,
                })
            }
        }
    }

    pub async fn get_user_settings(&self) -> Result<UserSettings, String> {
        let credentials = self.credentials.as_ref()
            .ok_or("No credentials configured")?;

        let url = format!("{}/api/user/settings", credentials.server_address);

        let response = self.http_client.get(&url)
            .header("X-CSRF-Token", &credentials.csrf_token)
            .header("Origin", &credentials.server_address)
            .send()
            .await
            .map_err(|e| format!("Request failed: {}", e))?;

        if response.status().is_success() {
            response.json::<UserSettings>()
                .await
                .map_err(|e| format!("Failed to parse settings: {}", e))
        } else {
            Err(format!("Server returned error: {}", response.status()))
        }
    }

    pub async fn list_pages(&self) -> Result<Vec<PageInfo>, String> {
        let credentials = self.credentials.as_ref()
            .ok_or("No credentials configured")?;

        let url = format!("{}/api/pages", credentials.server_address);

        let response = self.http_client.get(&url)
            .header("X-CSRF-Token", &credentials.csrf_token)
            .header("Origin", &credentials.server_address)
            .send()
            .await
            .map_err(|e| format!("Request failed: {}", e))?;

        if response.status().is_success() {
            response.json::<Vec<PageInfo>>()
                .await
                .map_err(|e| format!("Failed to parse pages: {}", e))
        } else {
            // Return empty list instead of error for graceful degradation
            Ok(vec![])
        }
    }

    pub async fn smart_focus(&self, conversation_id: &str) -> Result<(), String> {
        let credentials = self.credentials.as_ref()
            .ok_or("No credentials configured")?;

        let url = format!("{}/api/smart-focus", credentials.server_address);

        let body = serde_json::json!({
            "conversation_id": conversation_id
        });

        let response = self.http_client.post(&url)
            .header("X-CSRF-Token", &credentials.csrf_token)
            .header("Origin", &credentials.server_address)
            .header("Content-Type", "application/json")
            .json(&body)
            .send()
            .await
            .map_err(|e| format!("Request failed: {}", e))?;

        if response.status().is_success() {
            Ok(())
        } else {
            Err(format!("Server returned error: {}", response.status()))
        }
    }

    pub async fn cancel_cascade(&self, invocation_id: &str) -> Result<(), String> {
        let credentials = self.credentials.as_ref()
            .ok_or("No credentials configured")?;

        let url = format!("{}/api/cascade/cancel", credentials.server_address);

        let body = serde_json::json!({
            "invocation_id": invocation_id
        });

        let response = self.http_client.post(&url)
            .header("X-CSRF-Token", &credentials.csrf_token)
            .header("Origin", &credentials.server_address)
            .header("Content-Type", "application/json")
            .json(&body)
            .send()
            .await
            .map_err(|e| format!("Request failed: {}", e))?;

        if response.status().is_success() {
            Ok(())
        } else {
            Err(format!("Server returned error: {}", response.status()))
        }
    }

    pub async fn validate_cascade_overlay(&self, invocation_id: &str, validate: bool) -> Result<(), String> {
        let credentials = self.credentials.as_ref()
            .ok_or("No credentials configured")?;

        let url = format!("{}/api/cascade/validate", credentials.server_address);

        let body = serde_json::json!({
            "invocation_id": invocation_id,
            "validate": validate
        });

        let response = self.http_client.post(&url)
            .header("X-CSRF-Token", &credentials.csrf_token)
            .header("Origin", &credentials.server_address)
            .header("Content-Type", "application/json")
            .json(&body)
            .send()
            .await
            .map_err(|e| format!("Request failed: {}", e))?;

        if response.status().is_success() {
            Ok(())
        } else {
            Err(format!("Server returned error: {}", response.status()))
        }
    }

    pub async fn save_recording(
        &self,
        data: &[u8],
        filename: &str,
        conversation_id: &str,
    ) -> Result<(), String> {
        let credentials = self.credentials.as_ref()
            .ok_or("No credentials configured")?;

        let url = format!("{}/api/recording/save", credentials.server_address);

        // Create multipart form
        let part = reqwest::multipart::Part::bytes(data.to_vec())
            .file_name(filename.to_string())
            .mime_str("video/webm")
            .map_err(|e| format!("Failed to create form part: {}", e))?;

        let form = reqwest::multipart::Form::new()
            .text("conversation_id", conversation_id.to_string())
            .text("filename", filename.to_string())
            .part("file", part);

        let response = self.http_client.post(&url)
            .header("X-CSRF-Token", &credentials.csrf_token)
            .header("Origin", &credentials.server_address)
            .multipart(form)
            .send()
            .await
            .map_err(|e| format!("Request failed: {}", e))?;

        if response.status().is_success() {
            Ok(())
        } else {
            Err(format!("Server returned error: {}", response.status()))
        }
    }
}

impl Default for AntigravityClient {
    fn default() -> Self {
        Self::new()
    }
}

// ============================================================================
// SHARED STATE
// ============================================================================

pub type AntigravityClientState = Arc<Mutex<AntigravityClient>>;

pub fn create_antigravity_state() -> AntigravityClientState {
    Arc::new(Mutex::new(AntigravityClient::new()))
}

// ============================================================================
// TESTS
// ============================================================================

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_credentials_serialization() {
        let creds = AntigravityCredentials {
            csrf_token: "test-token".to_string(),
            server_address: "http://localhost:3000".to_string(),
        };

        let json = serde_json::to_string(&creds).unwrap();
        assert!(json.contains("test-token"));
        assert!(json.contains("localhost"));
    }

    #[test]
    fn test_status_serialization() {
        let status = AntigravityStatus {
            connected: true,
            status_code: 200,
            message: "OK".to_string(),
            version: Some("1.0.0".to_string()),
        };

        let json = serde_json::to_string(&status).unwrap();
        assert!(json.contains("connected"));
        assert!(json.contains("200"));
    }
}
