# MCP Integration Guide: Google Drive & Docs

This guide explains how to fully implement the Google Drive MCP integration in
"The New Fuse" Tauri app. The frontend wizard (`GoogleDriveWizard.tsx`) is
already implemented, but it currently simulates the backend actions.

## 1. Overview

The goal is to allow users to run a local Node.js MCP server
(`google-docs-mcp-server`) managed by the Tauri app.

**Flow:**

1.  **GCP Setup**: User manually creates project & credentials (frontend guides
    this).
2.  **Install**: Tauri clones the repo and runs `npm install`.
3.  **Auth**: Tauri runs the server in "auth mode", captures the URL, and passes
    user input back to the process.
4.  **Run**: Tauri keeps the server running in the background and proxies
    requests (or simply configures the Agent to talk to it).

## 2. Required Rust/Tauri Commands

You need to implement the following commands in your `src-tauri/src/main.rs` (or
a dedicated module).

### A. `install_mcp_server`

- **Input**: `url` (git repo), `path` (target directory)
- **Action**:
  1.  `git clone <url> <path>`
  2.  `npm install` (inside path)
  3.  `npm run build`

### B. `save_credentials`

- **Input**: `content` (JSON string), `path` (target directory)
- **Action**: Write the `credentials.json` file to the server directory.

### C. `start_auth_process`

- **Input**: `serverPath`
- **Action**:
  1.  Spawn `node dist/server.js`
  2.  Capture `stderr` to find the Auth URL.
  3.  Emit an event `mcp://auth-url` to the frontend.
  4.  Keep the process alive waiting for stdin.

### D. `submit_auth_code`

- **Input**: `code`
- **Action**: Write the code to the `stdin` of the running auth process.

## 3. Frontend Integration

In `src/components/mcp/GoogleDriveWizard.tsx`, replace the `simulate...`
functions with actual Tauri command calls:

```typescript
import { invoke } from '@tauri-apps/api/tauri';

// Example:
const installServer = async () => {
  await invoke('install_mcp_server', {
    url: 'https://github.com/a-bonus/google-docs-mcp.git',
    path: appLocalDataDir + '/servers/google-docs',
  });
};
```

## 4. MCP Server Configuration

Once installed and authenticated (token.json exists), you need to register this
server with your Agent Orchestrator.

- **Config Path**: `~/.gemini/antigravity/mcp_config.json` (or similar for TNF).
- **Entry Point**: `/path/to/server/dist/server.js`
- **Command**: `node`

## 5. Security Notes

- **Tokens**: The `token.json` contains refresh tokens. Ensure the directory is
  secured or encrypted if possible.
- **Credentials**: The `credentials.json` is less sensitive but should still be
  protected.
