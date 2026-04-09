# 🛣️ The New Fuse - Communication Modes & Pathways

This document provides the definitive strategy for how components in The New Fuse ecosystem connect and communicate. It clarifies the roles of Direct vs. Relayed communication pathways.

## 1. The Two Core Communication Modes

The New Fuse supports two primary modes of communication. The Chrome Extension's settings must allow the user to configure the WebSocket endpoint to support both modes seamlessly.

### Mode 1: Direct Connection (Default for Local Development)

In this mode, the Chrome Extension connects directly to the WebSocket server hosted by the VS Code Extension ("Core").

```
┌──────────────────┐         WebSocket          ┌────────────────────┐
│ Chrome Extension │ ◄─────────────────────────► │ VS Code Extension  │
│    (Client)      │      (ws://localhost:3710)  │       (Core)       │
└──────────────────┘                              └────────────────────┘
```

**When to use it:**
-   **Primary development mode:** When you are developing and testing the Chrome Extension and VS Code Extension on the same machine.
-   **Simplicity and Performance:** Offers the lowest latency and requires no intermediary setup.

**Configuration:**
-   The Chrome Extension's WebSocket URL should be set to `ws://localhost:3710` (the default port for the VS Code Core service).

### Mode 2: Relayed Connection (Production & Remote Scenarios)

In this mode, both the Chrome Extension and the VS Code Extension connect to a central, intermediary Relay Server. The Relay is responsible for authenticating clients and routing messages between them.

```
┌──────────────────┐       WebSocket       ┌──────────────┐       WebSocket       ┌────────────────────┐
│ Chrome Extension │ ◄───────────────────► │ Relay Server │ ◄───────────────────► │ VS Code Extension  │
│    (Client)      │ (wss://relay.your.domain) └──────────────┘ (wss://relay.your.domain) │       (Core)       │
└──────────────────┘                                                                    └────────────────────┘
```

**When to use it:**
-   **Production Deployments:** When the client and core need to communicate over the internet.
-   **Remote Development:** When the VS Code instance is running on a remote server or in a container.
-   **Multi-User/Collaborative Scenarios:** The Relay can manage multiple client-core sessions.
-   **Enhanced Security & Scalability:** The Relay can act as a secure gateway, handle authentication, and manage load.

**Configuration:**
-   The Chrome Extension's WebSocket URL should be set to the public address of the Relay Server (e.g., `wss://relay.thenewfuse.com`).
-   The VS Code Extension must also be configured to connect out to the same Relay Server.

## 2. Protocol Consistency

**Regardless of the pathway (Direct or Relayed), the message protocol remains the same.**

-   **Transport:** WebSocket
-   **Protocol:** JSON-RPC 2.0

This ensures that the application logic within the Chrome Extension and VS Code Extension does not need to change when switching between modes. The only change is the connection endpoint.

## 3. Conclusion: A Cohesive Strategy

The New Fuse architecture is intentionally flexible. It favors **Direct Connection** for its simplicity in local development, while providing the **Relayed Connection** pathway as a robust solution for production and advanced use cases.

All development and testing should account for both modes. The `test-websocket-server-3711.cjs` primarily simulates the Core service in a Direct Connection, but its broadcasting capability also makes it a useful tool for testing simple relay logic.