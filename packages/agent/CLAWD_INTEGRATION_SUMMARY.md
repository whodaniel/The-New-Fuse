# Clawdbot Integration Summary

## Overview

The Clawdbot integration unifies the **Agent**, **Backend**, and **Cloud
Sandbox** into a robust, scalable system.

### Architecture

1.  **ClawdEngine (Agent)**:
    - Acts as the central controller.
    - Executes high-level agent logic and skill orchestration.
    - Delegates resource-intensive or unsafe operations (Browser, Shell, FS) to
      the **Cloud Sandbox**.
    - Uses **RemoteSandboxClient** to communicate via WebSocket/JSON-RPC.

2.  **Cloud Sandbox (Infrastructure)**:
    - Provides a secure, isolated environment for tool execution.
    - Runs headless browsers (Playwright), shell commands, and file operations.
    - Enforces RBAC, quotas, and audit logging.

3.  **Distributed Scheduling (Backend)**:
    - **ClawdScheduler** (in Agent) pushes scheduled tasks to the **Backend
      (Bull/Redis)** if a Redis connection is available.
    - **AgentExecutionProcessor** (in Backend) consumes these tasks and
      instantiates a `ClawdEngine` worker to execute the requested skill.
    - Falls back to local `node-cron` if Redis is unavailable (e.g., local dev
      without backend).

### Integration Points

- **Agent -> Sandbox**: `RemoteSandboxClient` connects to `ws://localhost:3000`
  (or `CLAWD_SANDBOX_URL`).
- **Agent -> Backend**: `ClawdScheduler` pushes jobs to `agent-execution` queue
  in Redis.
- **Backend -> Agent**: `AgentExecutionProcessor` imports and runs `ClawdEngine`
  to process jobs.

### Configuration

Ensure the following environment variables are set:

- `CLAWD_SANDBOX_URL`: WebSocket URL for Cloud Sandbox (default:
  `ws://localhost:3000`).
- `REDIS_URL`: Redis connection string for distributed scheduling (required for
  Backend integration).

### Verification

- **Distributed Mode**: When `REDIS_URL` is present, `ClawdEngine` logs
  `[ClawdScheduler] Connected to Distributed Queue`.
- **Local Mode**: When `REDIS_URL` is missing, `ClawdEngine` logs
  `[ClawdScheduler] Failed to connect to Redis, using local mode only`.
