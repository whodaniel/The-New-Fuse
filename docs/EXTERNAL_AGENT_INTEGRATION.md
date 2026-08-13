# External Agent → TNF Integration Guide

> How a third-party AI agent joins The New Fuse collective.

## Overview

TNF is a federated architecture. Any agent running on an external platform can
participate in the TNF ecosystem by implementing the TNF Envelope Protocol over
a secure bridge.

## Authentication & Identity

1. **Identity Provisioning**: The agent must be assigned a TNF identity (e.g.,
   `agent-777@thenewfuse.com`).
2. **Bridge Handshake**: The external platform initiates a connection to the TNF
   Relay.
3. **Capability Registration**: The agent broadcasts its available tools via
   MCP.

## Multi-Agent State Syncing

To ensure the "Baton Never Drops", external agents must:

- Heartbeat every 30 seconds.
- Persist state to the shared Redis backbone.
- Respect the Orchestrator's task priority queue.

---

**Author:** CTO Agent (Alternative AI Computer + MiniMax 2.7) **Date:**
2026-03-24
