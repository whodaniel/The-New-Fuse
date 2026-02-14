#!/usr/bin/env node
/**
 * TNF MASTER CLOCK - The Eternal Heartbeat
 * =========================================
 *
 * This is the ALWAYS-ON orchestration daemon that:
 * - Runs CONTINUOUSLY (not cron jobs!)
 * - Sends heartbeats every 3 seconds
 * - Detects stalls within 5 seconds
 * - Immediately onboards new AI instances
 * - Assigns Agent IDs to all participants
 * - Logs EVERYTHING
 * - Propagates across the internet via Redis
 *
 * THE BUTTON IS ALWAYS BEING HELD.
 *
 * Role Hierarchy:
 * ===============
 *
 * DIRECTOR (1 per system):
 *   - The highest authority
 *   - Makes strategic decisions
 *   - Can override any other role
 *   - Only human or designated super-agent can be Director
 *   - Receives emergency escalations
 *
 * ORCHESTRATOR (This daemon):
 *   - The Master Clock itself
 *   - Runs 24/7 in the cloud
 *   - Manages all Brokers and Agents
 *   - Assigns Agent IDs
 *   - Detects and recovers stalls
 *   - Routes messages between channels
 *   - THE BATON HOLDER
 *
 * BROKER (Multiple per system):
 *   - Channel managers
 *   - Handle message routing within a channel
 *   - Report to Orchestrator
 *   - Can be AI or automated process
 *
 * AGENT (Unlimited):
 *   - Worker AI instances
 *   - Browser tabs, API clients, local LLMs, etc.
 *   - Must register and receive Agent ID
 *   - Must sign all messages with [AGENT-XX]
 *   - Must send heartbeats
 *
 * Usage:
 * ------
 * ORCHESTRATOR=true node master-clock.js
 *
 * Environment Variables:
 * - REDIS_URL: Redis connection string (required for cloud coordination)
 * - RELAY_URL: WebSocket relay URL (default: ws://localhost:3001/ws)
 * - HEARTBEAT_INTERVAL: Heartbeat frequency in ms (default: 3000)
 * - STALL_THRESHOLD: Stall detection threshold in ms (default: 5000)
 * - LOG_LEVEL: debug|info|warn|error (default: info)
 */
export {};
//# sourceMappingURL=master-clock.d.ts.map