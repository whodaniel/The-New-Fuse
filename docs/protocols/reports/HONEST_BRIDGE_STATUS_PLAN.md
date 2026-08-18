# Honest Bridge Status Verification Plan

**Date:** 2026-08-10
**Status:** PLANNING
**Goal:** Verify the health and responsiveness of the A2A (Agent-to-Agent) bridge beyond passive Redis TTL metrics. 

## 1. Current Vulnerability
Currently, the health of the Local Subdirector and the A2A bridge is evaluated by looking at passive metrics, such as the `local-subdirector-heartbeat.json` file freshness and Redis TTL expirations. 
However, this is an "optimistic" health metric. If the Node.js event loop of the bridge becomes completely blocked, or if the WebSocket connection is half-open but stalled, the Redis TTL might still look fresh (or fail to expire cleanly), resulting in a false "healthy" verdict in the `tnf protocol gate` and `live-agent-work-check.cjs`.

## 2. Proposed Solution: Active Challenge-Response (Ping/Pong)
To ensure the A2A bridge is honestly healthy, we must verify that its event loop is actively ticking and that it can process messages through the federated WebSocket or Redis bus.

We will implement an **Active Challenge-Response** mechanism.

### Step 2.1: Implement A2A Ping Handler in the Bridge
Modify the A2A bridge runtime (e.g., `local-subdirector-runtime.cjs` and the federated WS handlers) to listen for a specific, high-priority control message: `A2A_BRIDGE_PING`.
When this message is received, the bridge must immediately construct and broadcast an `A2A_BRIDGE_PONG` message containing the same `correlationId` (UUID) passed in the ping.

### Step 2.2: Implement the Health Probe
Create a new utility (e.g., `scripts/protocols/probe-a2a-bridge.cjs`) or extend `live-agent-work-check.cjs` to:
1. Generate a unique `correlationId`.
2. Inject the `A2A_BRIDGE_PING` message into the federated channel or Redis queue.
3. Listen for the `A2A_BRIDGE_PONG` response.
4. Apply a strict timeout (e.g., 2000ms).

### Step 2.3: Update Live Agent Work Check
Integrate this probe into `live-agent-work-check.cjs`.
- If the PONG is received within the timeout, the bridge is confirmed to be **honestly healthy**.
- If the timeout is reached without a PONG, the check must override any fresh Redis TTLs and mark the A2A bridge as `STALLED` or `UNHEALTHY` (triggering a `CAUTION` or `BLOCK` verdict).

## 3. Execution Steps
1. **Bridge Runtime Update:** Add the `A2A_BRIDGE_PING` listener to the `local-subdirector` message ingestion flow.
2. **Probe Script:** Write the active probe logic in `live-agent-work-check.cjs`.
3. **Validation:** Run the live check while intentionally freezing the bridge process (`kill -STOP <pid>`) to verify the probe accurately catches the stalled event loop, then resume it (`kill -CONT <pid>`) to ensure recovery.

## 4. Execution Readiness
This plan is complete and ready for implementation. It will close the P0 directive regarding honest bridge status.
