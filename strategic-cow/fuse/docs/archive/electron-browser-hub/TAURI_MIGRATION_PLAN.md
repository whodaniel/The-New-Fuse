# The New Fuse - Tauri Migration & Hybrid Architecture Plan

## Executive Summary

Migrating from Electron to a **Tauri + Cloud Sandbox** architecture to achieve:

- **10x reduction in app size** (~10MB vs ~100MB)
- **7x reduction in RAM usage** (~30MB idle vs ~200MB)
- **Zero local compute for heavy tasks** (builds, AI inference, browser
  automation)
- **Superior security** (Rust backend, sandboxed cloud execution)

---

## Phase 1: Tauri Foundation (Week 1)

### 1.1 Create Tauri App Structure

```
apps/
├── tauri-desktop/           # NEW - Replaces electron-desktop
│   ├── src-tauri/           # Rust backend
│   │   ├── src/
│   │   │   ├── main.rs      # Entry point
│   │   │   ├── commands.rs  # Tauri IPC commands
│   │   │   ├── mcp.rs       # MCP client integration
│   │   │   └── bridge.rs    # Sidecar management
│   │   ├── Cargo.toml
│   │   └── tauri.conf.json
│   ├── src/                 # Frontend (reuse from browser-hub)
│   │   ├── App.tsx
│   │   ├── components/
│   │   └── styles/
│   ├── binaries/            # Sidecar binaries
│   │   └── tnf-bridge-x86_64-apple-darwin
│   └── package.json
```

### 1.2 Port Existing Frontend

The existing `apps/browser-hub/` frontend (HTML/CSS/JS) can be directly reused:

- `enhanced-browser-hub.html` → `index.html`
- `styles/main.css` → `src/styles/main.css`
- `js/app.js` → `src/app.ts` (with type safety)

### 1.3 Tauri Configuration

```json
// tauri.conf.json
{
  "build": {
    "beforeBuildCommand": "pnpm run build",
    "beforeDevCommand": "pnpm run dev",
    "devPath": "http://localhost:5173",
    "distDir": "../dist"
  },
  "package": {
    "productName": "The New Fuse",
    "version": "4.0.0"
  },
  "tauri": {
    "bundle": {
      "active": true,
      "icon": ["icons/icon.icns"],
      "identifier": "com.thenewfuse.desktop",
      "externalBin": ["binaries/tnf-bridge"]
    },
    "security": {
      "csp": "default-src 'self'; connect-src 'self' wss://*.railway.app"
    },
    "allowlist": {
      "all": false,
      "shell": { "all": false, "open": true },
      "fs": { "all": true, "scope": ["$HOME/**", "$APPDATA/**"] },
      "http": {
        "all": true,
        "scope": ["https://*.railway.app", "http://localhost:*"]
      },
      "process": { "relaunch": true, "exit": true },
      "window": { "all": true }
    }
  }
}
```

---

## Phase 2: Bridge Sidecar (Week 2)

### 2.1 Sidecar Architecture

The Bridge is a small Rust binary (~2MB) that:

1. Authenticates with Railway using OAuth/API key
2. Establishes a persistent WebSocket tunnel
3. Implements the MCP Transport layer
4. Proxies local file system access to the cloud

### 2.2 Sidecar Crate Structure

```
apps/tnf-bridge/
├── Cargo.toml
├── src/
│   ├── main.rs
│   ├── tunnel.rs      # WebSocket tunnel management
│   ├── mcp_transport.rs # MCP message handling
│   ├── fs_proxy.rs    # Local file system access
│   └── auth.rs        # Railway authentication
```

### 2.3 Key Dependencies

```toml
[dependencies]
tokio = { version = "1", features = ["full"] }
tokio-tungstenite = "0.21"  # WebSocket client
serde = { version = "1", features = ["derive"] }
serde_json = "1"
mcp-rs = "0.1"  # MCP Rust SDK (if available, else implement)
```

---

## Phase 3: Railway Cloud Sandbox (Week 3)

### 3.1 Docker Service Configuration

```yaml
# railway.toml
[build]
builder = "dockerfile"
dockerfilePath = "Dockerfile.sandbox"

[deploy]
startCommand = "node server.js"
healthcheckPath = "/health"
healthcheckTimeout = 30

[[services]]
name = "tnf-sandbox"
```

### 3.2 Sandbox Dockerfile

```dockerfile
FROM mcr.microsoft.com/playwright:v1.40.0-jammy

# Install build tools
RUN apt-get update && apt-get install -y \
    build-essential \
    nodejs \
    npm \
    rustc \
    cargo \
    && rm -rf /var/lib/apt/lists/*

# Install MCP server
WORKDIR /app
COPY package.json ./
RUN npm install
COPY . .

EXPOSE 8080
CMD ["node", "server.js"]
```

### 3.3 MCP Server Implementation

The cloud sandbox runs an MCP Server that:

1. Accepts connections from Bridge Sidecars
2. Exposes "tools" for browser automation, builds, etc.
3. Streams results back to the local Tauri app

---

## Phase 4: MCP Integration (Week 4)

### 4.1 Leverage Existing MCP Core

Your `packages/mcp-core` already has MCP primitives. Extend it:

```typescript
// packages/mcp-core/src/transports/TauriTransport.ts
export class TauriTransport implements MCPTransport {
  private invoke: typeof tauri.invoke;

  async send(message: MCPMessage): Promise<void> {
    await this.invoke('mcp_send', { message: JSON.stringify(message) });
  }

  subscribe(handler: (msg: MCPMessage) => void): () => void {
    return tauri.listen('mcp_message', (event) => {
      handler(JSON.parse(event.payload as string));
    });
  }
}
```

### 4.2 Tool Definitions

```typescript
// Cloud Sandbox exposes these tools
const tools = [
  {
    name: 'browser_navigate',
    description: 'Navigate headless browser to URL',
    inputSchema: { type: 'object', properties: { url: { type: 'string' } } },
  },
  {
    name: 'run_build',
    description: 'Execute pnpm build in project',
    inputSchema: {
      type: 'object',
      properties: { package: { type: 'string' } },
    },
  },
  {
    name: 'read_local_file',
    description: 'Read file from connected local machine',
    inputSchema: { type: 'object', properties: { path: { type: 'string' } } },
  },
];
```

---

## Migration Checklist

### From Electron to Tauri

| Electron Feature                    | Tauri Equivalent                       |
| ----------------------------------- | -------------------------------------- |
| `ipcMain.handle()`                  | `#[tauri::command]`                    |
| `BrowserWindow`                     | `tauri::Window`                        |
| `webview` tag                       | `<iframe>` + `http.fetch`              |
| `app.getPath('userData')`           | `tauri::api::path::app_data_dir()`     |
| `session.loadExtension()`           | Not supported (use MCP for automation) |
| `contextBridge.exposeInMainWorld()` | `invoke()` + `listen()`                |

### What Moves to Cloud

| Feature            | Current (Electron)    | New (Cloud Sandbox)            |
| ------------------ | --------------------- | ------------------------------ |
| Browser Automation | Local Chromium        | Headless Playwright on Railway |
| Build Execution    | Local Node/Rust       | Docker container on Railway    |
| AI Inference       | Local (if any)        | Ollama/vLLM on Railway         |
| Extension Loading  | session.loadExtension | N/A (use MCP tools)            |

---

## Railway Deployment Configuration

### Environment Variables

```bash
# .env.production
RAILWAY_TOKEN=your_token
SANDBOX_WSS_URL=wss://tnf-sandbox.up.railway.app/ws
MCP_SERVER_PORT=8080
```

### Scaling

Railway supports autoscaling. Configure:

- **Min instances**: 1 (for low latency)
- **Max instances**: 5 (for concurrent users)
- **CPU**: 2 vCPU
- **RAM**: 4GB (for Playwright)

---

## Timeline

| Week | Deliverable                               |
| ---- | ----------------------------------------- |
| 1    | Tauri app scaffolding, frontend port      |
| 2    | Bridge Sidecar (Rust), WSS tunnel         |
| 3    | Railway Sandbox Docker, MCP Server        |
| 4    | Integration testing, MCP tool definitions |
| 5    | Polish, documentation, v4.0.0 release     |

---

## ✅ Implementation Progress (Dec 18, 2024)

### Completed Components

| Component             | Status | Location                                      |
| --------------------- | ------ | --------------------------------------------- |
| Tauri App Scaffold    | ✅     | `apps/tauri-desktop/`                         |
| Tauri Config          | ✅     | `src-tauri/tauri.conf.json`                   |
| Rust Backend          | ✅     | `src-tauri/src/lib.rs`                        |
| WebSocket Bridge      | ✅     | `src-tauri/src/bridge.rs`                     |
| Frontend (Deep Space) | ✅     | `index.html`, `src/main.ts`                   |
| Cloud Sandbox         | ✅     | `apps/cloud-sandbox/`                         |
| MCP Server            | ✅     | `cloud-sandbox/src/server.ts`                 |
| Railway Deployment    | ✅     | `tnf-cloud-sandbox-production.up.railway.app` |
| Docker Config         | ✅     | `cloud-sandbox/Dockerfile`                    |
| Health Check          | ✅     | `/health` endpoint returning healthy status   |

### Railway Cloud Sandbox URL

```
https://tnf-cloud-sandbox-production.up.railway.app
wss://tnf-cloud-sandbox-production.up.railway.app/ws
```

### Available MCP Tools (Cloud Sandbox)

1. `run_command` - Execute shell commands in sandbox
2. `read_file` - Read files from cloud filesystem
3. `write_file` - Write files to cloud filesystem
4. `list_directory` - List directory contents
5. `echo` - Test echo functionality

### Completed on Dec 18, 2024

- ✅ Cloud Sandbox deployed and running on Railway
- ✅ Health check endpoint verified (`/health`)
- ✅ Tauri app successfully compiled (464 crates)
- ✅ Tauri app running in dev mode
- ✅ Default sandbox URL configured to production Railway endpoint
- ✅ Code warnings cleaned up

### Remaining Tasks

1. **Test WebSocket Connection**: Click "Connect Bridge" in Tauri app to test
   connection
2. **Test MCP Tools**: Call tools through the bridge to verify end-to-end flow
3. **Build Production Binary**: Run `pnpm tauri:build` to create distributable
   app
4. **Add Playwright**: Extend cloud sandbox with browser automation tools

---

## Success Metrics

- [ ] App size < 15MB
- [ ] Idle RAM < 50MB
- [ ] Build commands execute in cloud, results in < 5s
- [ ] Browser automation works via MCP
- [ ] Seamless Railway deployment
