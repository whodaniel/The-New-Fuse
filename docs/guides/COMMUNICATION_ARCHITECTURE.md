# 📡 The New Fuse - Communication Architecture Guide

This document outlines the communication architecture for The New Fuse, defining
how the Chrome Extension (Client), VS Code Extension (Core), and Relay Server
interact.

## 1. Core Components

The system consists of three primary components:

- **Core (VS Code Extension):** The main backend service. It runs the primary
  WebSocket server, manages agent logic, has direct access to the file system,
  and orchestrates complex tasks.
- **Client (Chrome Extension):** The primary user-facing component. It injects
  UIs into web pages, captures user interactions, and communicates with the Core
  or a Relay.
- **Relay Server:** An optional but crucial intermediary Node.js server. It
  bridges communication between the Client and Core, especially when a direct
  connection is not feasible (e.g., across different networks or for web-based
  deployments).

## 2. Communication Modalities & Protocols

The New Fuse is designed to be multi-modal, but these modalities are layered,
not conflicting.

### Layer 1: The Transport Layer (WebSocket)

**WebSocket is the primary, real-time transport layer for all agentic
communication.**

- **Direct Connection (Development):** The Chrome Extension connects directly to
  the WebSocket server hosted by the VS Code Extension.
  - **VS Code Server Port:** `3710` (Default)
  - **Test Server Port:** `3711` (For isolated client testing)
- **Relayed Connection (Production/Flexibility):** The Chrome Extension and VS
  Code Extension both connect to a central Relay Server. The Relay is
  responsible for routing messages between them. This pattern is detailed in the
  `QWEN_INTEGRATION_README.md`.

For a detailed breakdown of when to use each pathway, see the Communication
Modes & Pathways Guide.

The Chrome Extension's **Settings** tab should allow the user to configure the
WebSocket endpoint URL (e.g., `ws://localhost:3710`, `ws://localhost:3711`, or
the URL of a remote Relay Server).

### Layer 2: The Message Protocol (JSON-RPC)

All messages sent over the WebSocket transport layer adhere to the JSON-RPC 2.0
format. This provides a structured way to call methods and pass data. The
specific message types (`AUTH`, `PING`, `CODE_INPUT`, etc.) are defined in the
WebSocket Server Reference.

### Layer 3: High-Level Agent Protocols (MCP, A2A)

**MCP (Model Context Protocol) and A2A (Agent-to-Agent) are not alternative
transports; they are higher-level protocols that operate _on top of_ the
established WebSocket connection.**

- **MCP:** When the Chrome Extension needs to interact with a tool exposed by
  the Core, it will send a specially formatted JSON-RPC message that complies
  with the MCP specification. The Core's WebSocket server will have a handler
  that recognizes and processes these MCP requests.
- **A2A:** For direct, peer-to-peer style conversations between agents, messages
  will be structured according to the A2A specification and transmitted as the
  payload of a JSON-RPC message over the WebSocket connection.

This layered approach prevents conflicts. The Chrome Extension doesn't choose
_between_ WebSocket and MCP; it uses **MCP-formatted messages sent over
WebSocket**.

### Other Communication Modalities

- **Redis Pub/Sub:** This is used for **asynchronous, one-to-many
  broadcasting**. It is not a primary request/response channel.
  - **Use Case:** The Core can publish a system-wide status update (e.g., "Agent
    X completed a task") to a Redis channel. The Relay Server, subscribed to
    this channel, can then push this update to all connected Chrome Extension
    clients. This is efficient for broadcasting events without waiting for a
    response.
  - The `test-websocket-server-3711.cjs` demonstrates this capability.

- **File-Based IPC:** This is a **fallback or special-purpose mechanism**, not a
  real-time communication channel.
  - **Use Case:** Transferring very large data payloads that are unsuitable for
    a WebSocket message. The Core could write a large file and send a WebSocket
    message containing only the file path for the client to access (if on the
    same machine).

## 3. Logical Flow of a Request

**Scenario: Sending code from Chrome to VS Code for analysis.**

1.  **User Action:** The user clicks "Send to VS Code" in the Chrome Extension
    UI.
2.  **Client Action (Chrome Extension):**
    - Constructs a JSON-RPC message:
      ```json
      {
        "jsonrpc": "2.0",
        "method": "CODE_INPUT",
        "params": { "code": "console.log('Hello, world!');" },
        "id": "request-123"
      }
      ```
    - Sends this message string over its active WebSocket connection (to either
      the Core, Test Server, or Relay).
3.  **Server Action (Core/Relay):**
    - The WebSocket server receives the message.
    - It parses the JSON-RPC request.
    - It routes the request to the `CODE_INPUT` handler.
    - The handler executes the analysis logic.
4.  **Server Response:**
    - The Core formulates a response and sends it back over the same WebSocket
      connection.

## 4. Conclusion

This layered and multi-modal architecture provides both robustness and
flexibility.

- **For core, real-time interactions, always use WebSocket with JSON-RPC
  messages.**
- **For higher-level agent standards like MCP/A2A, structure their protocols
  inside the JSON-RPC payload.**
- **Use Redis for asynchronous broadcasting and File IPC for specialized use
  cases.**

By adhering to this architecture, the Chrome Extension can be developed to
seamlessly integrate with all parts of The New Fuse framework without logical
conflicts between communication methods.
