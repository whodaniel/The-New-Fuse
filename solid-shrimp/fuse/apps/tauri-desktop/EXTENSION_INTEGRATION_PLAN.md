# Antigravity Extension Integration Plan

## Executive Summary

This document outlines the strategy for integrating the Antigravity Browser
Extension capabilities into The New Fuse Tauri desktop application.

---

## Current Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                    TAURI DESKTOP APP                             │
├─────────────────────────────────────────────────────────────────┤
│  React Frontend (Vite)                                          │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐               │
│  │  Dashboard  │ │  MCP Tools  │ │  Heartbeat  │               │
│  └─────────────┘ └─────────────┘ └─────────────┘               │
├─────────────────────────────────────────────────────────────────┤
│  Rust Backend (lib.rs + bridge.rs)                              │
│  - WebSocket Bridge to Cloud Sandbox                            │
│  - MCP Tool Calls                                               │
│  - Local File System                                            │
└─────────────────────────────────────────────────────────────────┘
          │
          ▼
   Railway Cloud Sandbox
   - Playwright Browser Control
   - SkIDEancer IDE
```

## Antigravity Extension Analysis

The Antigravity extension (v1.11.3) provides:

### Core Services (via gRPC-Web)

- `LanguageServerService.GetStatus`
- `LanguageServerService.GetUserSettings`
- `LanguageServerService.ListPages`
- `LanguageServerService.SmartFocusConversation`
- `LanguageServerService.CancelCascadeInvocation`
- `LanguageServerService.BrowserValidateCascadeOrCancelOverlay`
- `LanguageServerService.SaveScreenRecording`

### Features

- Content script injection on all pages
- Screen recording via offscreen documents
- Tab management and page content access
- Inter-page communication via Chrome messaging

---

## Integration Options

### Option A: Native gRPC Integration (RECOMMENDED)

**Effort: High | Value: Highest**

Port the extension's gRPC client to native Rust/TypeScript.

**Benefits:**

- Full native integration
- No external dependencies
- Better performance
- Unified codebase

**Implementation:**

1. Define protobuf schemas from reverse-engineered extension
2. Use `tonic` crate for Rust gRPC client
3. Create TypeScript service layer
4. Integrate with existing bridge architecture

### Option B: Chrome DevTools Protocol (CDP)

**Effort: Medium | Value: High**

Control Chrome browser remotely via CDP.

**Benefits:**

- Full browser control including extensions
- Works with installed Antigravity extension
- Screenshot, DOM access, network interception

**Implementation:**

1. Add `chromiumoxide` Rust crate
2. Launch Chrome with debugging port
3. Connect via WebSocket
4. Execute commands through CDP

### Option C: Hybrid Extension Launch

**Effort: Low | Value: Medium**

Launch Chrome with extension loaded for specific tasks.

**Benefits:**

- Quick to implement
- Uses existing extension as-is

**Drawbacks:**

- Requires Chrome installed
- Not fully integrated experience

---

## Phase 1: CDP Integration (Quick Win)

### 1.1 Add Rust Dependencies

```toml
# Cargo.toml additions
chromiumoxide = { version = "0.7", features = ["tokio-runtime"] }
```

### 1.2 Create Chrome Control Module

```rust
// src/chrome.rs
use chromiumoxide::{Browser, BrowserConfig};

pub struct ChromeController {
    browser: Option<Browser>,
}

impl ChromeController {
    pub async fn launch() -> Result<Self, String> {
        let config = BrowserConfig::builder()
            .extension_path("/path/to/antigravity/extension")
            .build()
            .map_err(|e| e.to_string())?;

        let (browser, _) = Browser::launch(config)
            .await
            .map_err(|e| e.to_string())?;

        Ok(Self { browser: Some(browser) })
    }

    pub async fn navigate(&self, url: &str) -> Result<(), String> {
        if let Some(ref browser) = self.browser {
            let page = browser.new_page(url).await.map_err(|e| e.to_string())?;
            Ok(())
        } else {
            Err("Browser not launched".into())
        }
    }
}
```

### 1.3 Tauri Commands

```rust
#[tauri::command]
async fn chrome_launch(state: State<'_, AppState>) -> Result<bool, String> {
    let chrome = ChromeController::launch().await?;
    // Store chrome controller in state
    Ok(true)
}

#[tauri::command]
async fn chrome_navigate(url: String, state: State<'_, AppState>) -> Result<(), String> {
    // Navigate using stored controller
    Ok(())
}
```

---

## Phase 2: gRPC Service Integration

### 2.1 Proto Definitions (Reconstructed)

Based on extension analysis, create `language_server.proto`:

```protobuf
syntax = "proto3";

package exa.language_server_pb;

service LanguageServerService {
  rpc GetStatus (GetStatusRequest) returns (GetStatusResponse);
  rpc GetUserSettings (GetUserSettingsRequest) returns (GetUserSettingsResponse);
  rpc ListPages (ListPagesRequest) returns (ListPagesResponse);
  rpc SmartFocusConversation (SmartFocusConversationRequest) returns (SmartFocusConversationResponse);
  rpc CancelCascadeInvocation (CancelCascadeInvocationRequest) returns (CancelCascadeInvocationResponse);
  rpc BrowserValidateCascadeOrCancelOverlay (BrowserValidateCascadeOrCancelOverlayRequest) returns (BrowserValidateCascadeOrCancelOverlayResponse);
  rpc SaveScreenRecording (SaveScreenRecordingRequest) returns (SaveScreenRecordingResponse);
}

message GetStatusRequest {
  // Fields based on extension analysis
}

message GetStatusResponse {
  uint32 status_code = 1;
  StatusMessage status = 2;
}

message StatusMessage {
  string message = 2;
}

// ... additional messages
```

### 2.2 Rust gRPC Client

```rust
// src/grpc_client.rs
use tonic::transport::Channel;

pub mod language_server {
    tonic::include_proto!("exa.language_server_pb");
}

use language_server::language_server_service_client::LanguageServerServiceClient;

pub struct AntigravityClient {
    client: LanguageServerServiceClient<Channel>,
}

impl AntigravityClient {
    pub async fn connect(url: &str) -> Result<Self, String> {
        let channel = Channel::from_static(url)
            .connect()
            .await
            .map_err(|e| e.to_string())?;

        Ok(Self {
            client: LanguageServerServiceClient::new(channel)
        })
    }

    pub async fn get_status(&mut self) -> Result<StatusResponse, String> {
        let request = tonic::Request::new(GetStatusRequest {});
        let response = self.client.get_status(request).await.map_err(|e| e.to_string())?;
        Ok(response.into_inner())
    }
}
```

---

## Phase 3: Frontend Integration

### 3.1 Antigravity Service

```typescript
// src/services/AntigravityService.ts
import { invoke } from '@tauri-apps/api/core';

export class AntigravityService {
  static async connect(): Promise<boolean> {
    return invoke<boolean>('antigravity_connect');
  }

  static async getStatus(): Promise<AntigravityStatus> {
    return invoke<AntigravityStatus>('antigravity_get_status');
  }

  static async listPages(): Promise<PageInfo[]> {
    return invoke<PageInfo[]>('antigravity_list_pages');
  }

  static async focusConversation(conversationId: string): Promise<void> {
    return invoke('antigravity_focus_conversation', { conversationId });
  }

  static async cancelCascade(invocationId: string): Promise<void> {
    return invoke('antigravity_cancel_cascade', { invocationId });
  }
}
```

### 3.2 UI Components

```tsx
// src/components/AntigravityPanel.tsx
import { AntigravityService } from '../services/AntigravityService';

export function AntigravityPanel() {
  const [status, setStatus] = useState<AntigravityStatus | null>(null);
  const [pages, setPages] = useState<PageInfo[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      const s = await AntigravityService.getStatus();
      const p = await AntigravityService.listPages();
      setStatus(s);
      setPages(p);
    };
    fetchData();
  }, []);

  return (
    <div className="antigravity-panel">
      <h2>🔮 Antigravity Agent</h2>
      {status && (
        <div className="status-card">
          <span
            className={`status-dot ${status.connected ? 'online' : 'offline'}`}
          />
          <span>{status.message}</span>
        </div>
      )}
      <div className="pages-list">
        {pages.map((page) => (
          <div key={page.id} className="page-card">
            <h3>{page.title}</h3>
            <p>{page.url}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
```

---

## Phase 4: Advanced Features

### 4.1 Screen Recording Integration

Utilize Tauri's native screen capture or delegate to Chrome:

```rust
#[tauri::command]
async fn start_screen_recording(conversation_id: String) -> Result<String, String> {
    // Option 1: Use system screen capture
    // Option 2: Delegate to Playwright in cloud sandbox
    // Option 3: Use CDP to trigger extension's recording
}

#[tauri::command]
async fn stop_screen_recording() -> Result<Vec<u8>, String> {
    // Return recording data
}
```

### 4.2 Agent Cascade Management

Integrate with existing agent infrastructure:

```rust
#[tauri::command]
async fn manage_cascade(
    action: String,
    invocation_id: String,
    state: State<'_, AppState>
) -> Result<(), String> {
    match action.as_str() {
        "cancel" => antigravity_cancel_cascade(invocation_id).await,
        "validate" => antigravity_validate_cascade(invocation_id).await,
        _ => Err("Unknown action".into())
    }
}
```

---

## Timeline

| Phase                    | Duration | Deliverables            |
| ------------------------ | -------- | ----------------------- |
| Phase 1: CDP Integration | 1-2 days | Chrome control via CDP  |
| Phase 2: gRPC Services   | 3-5 days | Native gRPC client      |
| Phase 3: Frontend        | 2-3 days | UI components           |
| Phase 4: Advanced        | 3-5 days | Recording, cascade mgmt |

**Total Estimated Time: 2-3 weeks**

---

## Next Steps

1. ✅ Document current extension capabilities (DONE)
2. [ ] Decide on primary integration approach (A, B, or C)
3. [ ] Set up protobuf definitions
4. [ ] Implement Phase 1 CDP integration
5. [ ] Test with Antigravity server
6. [ ] Build production bundle

---

## Packaging Commands

```bash
# Development
pnpm dev              # Start dev server
pnpm tauri dev        # Start Tauri dev mode

# Production
pnpm build:deps       # Build dependencies
pnpm build            # Build frontend
pnpm tauri build      # Package app

# Output locations
# macOS: src-tauri/target/release/bundle/macos/
# DMG: src-tauri/target/release/bundle/dmg/
```

---

## Questions for Clarification

1. **Antigravity Server**: Do you have access to the Antigravity language
   server? What's the endpoint URL?
2. **Authentication**: How does the extension authenticate with the server?
3. **Priority Features**: Which extension features are highest priority?
4. **Distribution**: Will this be distributed via App Store or direct download?
