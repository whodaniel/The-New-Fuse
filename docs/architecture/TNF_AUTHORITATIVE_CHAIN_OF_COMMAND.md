# TNF Authoritative Chain of Command

**Date**: 2026-03-21  
**Status**: Formalized  
**Owner**: TNF Super Director + Local Sub-Director

## 1. Overview

The New Fuse (TNF) implements a federated control plane where authority is derived from cryptographic identity (NFTs) and enforced via a multi-tiered director hierarchy. This ensures that global swarm coordination remains secure, traceable, and aligned with the central mission.

## 2. The Hierarchy of Authority

### 2.1 The Super Director (Cloud)
- **Role**: Singular global authority.
- **Residency**: TNF Central Hub (Railway).
- **Control Mechanism**: Exclusive control of the Authoritative command chain via a Live LLM API.
- **Primary Tooling**:
    - **Master Clock**: Pulses global signals and heartbeats.
    - **Cloud Redis**: Backbone for global broadcast (`tramway.proxy.rlwy.net`).
    - **Master Cloud Orchestrator/Broker**: Validates and routes directives.

### 2.2 The Sub-Director (Local)
- **Role**: Local terminal authority.
- **Identity**: Bound to a unique Director NFT (e.g., `tnf-node-33a7fdec`).
- **Control Mechanism**: Exclusive local access to the `broadcast_super_director_prompt` tool.
- **Responsibilities**:
    - Synchronize with the Super Director heartbeat.
    - Coordinate local terminal lanes (TTYs).
    - Prevent task overlap and lane drift.
    - Pulse local state back to the cloud.

### 2.3 The Orchestration Agent (Temporal)
- **Role**: Quasi Director-Orchestrator.
- **Authority**: Granted temporary authority during active orchestration cycles to pulse the command chain.

## 3. The Signal Trust Protocol

All communication between the Super Director and Sub-Directors is protected by the **Signal Trust Protocol**:

1.  **Encryption**: Directives are encrypted using `X25519-AES-256-GCM`.
2.  **Signatures**: Every pulse is signed with `Ed25519` private keys.
3.  **NFT Binding**: Authority is only recognized if the sender's NFT ID matches the signature and public key on record.

## 4. Implementation Details

### 4.1 Cloud Redis Bridge
The bridge (`@the-new-fuse/mcp-cloud-redis-bridge`) acts as the gatekeeper for the global command chain. It enforces:
- **Identity Initialization**: Automatically loads Director credentials from `.env.local`.
- **Authorization Gates**: Rejects any `broadcast_super_director_prompt` call not initiated by an authorized agent (`sub-director` or `orchestration-agent`).

### 4.2 Local Sub-Director Runtime
The runtime (`scripts/runtime/local-subdirector-runtime.cjs`) provides the "always awake" loop that maintains the local end of the chain.

## 5. Security Guardrails

- **Exclusive Tools**: The `broadcast_super_director_prompt` tool is a high-privilege capability. It is restricted at the MCP layer.
- **Credential Protection**: Private keys are stored in local `.env` files and are never committed to the repository.
- **Audit Trail**: Every injection includes a `trace_id` and the `issuer` NFT ID for post-execution auditing.
