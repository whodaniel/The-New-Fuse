# 🏛️ The New Fuse - VS Code Extension Architecture

This document provides the definitive architectural guide for the VS Code extension, which functions as the **Core** component of The New Fuse ecosystem.

## 1. Role and Responsibility

The VS Code extension is the central nervous system of the project. Its primary responsibilities are:

-   **Hosting the Core Service:** It runs the primary WebSocket server that clients (like the Chrome Extension) connect to.
-   **Agent Orchestration:** It manages the lifecycle and logic of all AI agents.
-   **File System Access:** It provides secure and managed access to the local file system for reading/writing files, a capability browser extensions do not have.
-   **Tool Provider:** It exposes powerful tools (e.g., code analysis, terminal execution) to agents and clients via the communication protocol.

## 2. Communication Protocol

**The VS Code extension's WebSocket server MUST exclusively use the JSON-RPC 2.0 protocol.**

-   **Protocol:** JSON-RPC 2.0
-   **Transport:** WebSocket
-   **Default Port:** `3710`

All incoming messages will be treated as JSON-RPC requests or notifications. All outgoing messages will be formatted as JSON-RPC responses or errors. This ensures predictable, structured, and language-agnostic communication.

Refer to the main Communication Architecture Guide for the layered model.

### Example Flow:

1.  **Client Request (Chrome Extension):**
    ```json
    {
      "jsonrpc": "2.0",
      "method": "filesystem.readFile",
      "params": { "path": "/path/to/file.txt" },
      "id": "req-1"
    }
    ```

2.  **Server Response (VS Code Extension):**
    ```json
    {
      "jsonrpc": "2.0",
      "result": { "content": "File content here..." },
      "id": "req-1"
    }
    ```

## 3. Configuration Management

**All configuration for the VS Code extension MUST be managed through VS Code's native settings system (`settings.json`).** The use of `.env` files for this component is deprecated.

All settings should be prefixed with `thefuse` for clear namespacing.

### Key Configuration Settings:

-   `thefuse.websocket.port`: (Number) The port for the WebSocket server. Default: `3710`.
-   `thefuse.websocket.secure`: (Boolean) Whether to use `wss://`. Default: `false`.
-   `thefuse.logging.level`: (String) The logging verbosity. Default: `"info"`.
-   `thefuse.agents.enabled`: (Array) A list of enabled agent IDs.

This approach provides a standard, user-friendly way for users to configure the extension directly within their IDE, leveraging features like settings validation and GUI-based editing.

## 4. Internal Structure

The extension should be structured into distinct services, each with a clear responsibility:
-   `ChromeWebSocketService`: Manages the WebSocket server lifecycle and message routing.
-   `AgentService`: Manages AI agent instances and their communication.
-   `FileSystemService`: Handles all file I/O operations.
-   `ToolRegistryService`: Manages and exposes available tools to the system.