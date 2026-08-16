# Executable Intelligence Artifact

**Artifact ID:** eia-fb04d3957f3ba3f9 **Spec:** tnf/executable-intelligence/0.2
**Generated:** 2026-08-16T19:47:35+00:00 **Class/Status:** [INTEL] [PENDING]

## Ownership & Release

- Owner Principal: danielgoldberg
- Visibility: private
- Release State: sealed
- Agent Allowlist: (none)
- Release Approved By: (not released)
- Released At: (not released)
- Release Note: (none)

## Source Attribution

- Source ID: apple-notes-new-may-2026-6532
- Type: note
- URI: apple-notes://on-my-mac/NEW-%20May-2026/6532
- Title: There is an official @modelcontextprotocol/sdk client in the repo…
- Author:
- Publisher:
- Published At:
- Retrieved At: 2026-08-16T19:47:35+00:00

## Taxonomy of Actionability

### Procedural

- Title: There is an official @modelcontextprotocol/sdk client in the repo…
- There is an official @modelcontextprotocol/sdk client in the repo.
- switching the runtime to use that instead of hand-rolled JSON-RPC for HTTP/
- m replacing the transport code with the official MCP SDK client transports.
- The official SDK exposes Client.listTools() and Client.callTool() directly.
- s runtime to that API and preserving TNF config/auth
- For WebSocket, the SDK transport follows the MCP mcp subprotocol and does not

### Strategic

- (none)

### Governance

- stdio, and WebSocket protocol handling from the MCP implementation itself
- Search close\(\) in protocol.d.ts
- Read protocol.d.ts, transport.d.ts, websocket.js

## Utility Metrics

- Freshness Decay: High
- Implementation Density: 0.292
- Verification Difficulty: Easy

## Synthesis

Artifact captures 7 procedural, 0 strategic, and 3 governance units. Use
procedural units for immediate execution, then vet strategic and governance
units through TNF gates before protocol adoption.
