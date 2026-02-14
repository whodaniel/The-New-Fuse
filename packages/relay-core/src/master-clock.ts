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

import { promises as fs } from 'fs';
import path from 'path';
import { createClient } from 'redis';
import WebSocket from 'ws';

// ============================================================================
// CONFIGURATION
// ============================================================================

const CONFIG = {
  // Timing (in milliseconds)
  HEARTBEAT_INTERVAL: parseInt(process.env.HEARTBEAT_INTERVAL || '') || 3000, // 3 seconds
  STALL_THRESHOLD: parseInt(process.env.STALL_THRESHOLD || '') || 5000, // 5 seconds
  RECOVERY_INTERVAL: parseInt(process.env.RECOVERY_INTERVAL || '') || 10000, // 10 seconds
  ONBOARDING_TIMEOUT: parseInt(process.env.ONBOARDING_TIMEOUT || '') || 30000, // 30 seconds
  MAX_RECOVERY_ATTEMPTS: 5,

  // Connections
  RELAY_URL: process.env.RELAY_URL || 'ws://localhost:3000/ws',
  REDIS_URL: process.env.REDIS_URL,

  // Channels to monitor
  CHANNELS: ['Green', 'Blue', 'Red', 'Yellow', 'Purple', 'General'],

  // Redis keys
  REDIS_KEYS: {
    AGENTS: 'tnf:master:agents',
    HEARTBEATS: 'tnf:master:heartbeats',
    CHANNELS: 'tnf:master:channels',
    TASKS: 'tnf:master:tasks:pending',
    LOGS: 'tnf:master:logs',
    STATE: 'tnf:master:state',
    INGRESS: 'tnf:bus:ingress',
    EGRESS_PREFIX: 'tnf:bus:egress',
  },

  // Logging
  LOG_LEVEL: process.env.LOG_LEVEL || 'info',
  LOG_DIR: process.env.LOG_DIR || path.join(process.env.HOME || '/tmp', '.tnf-master-clock'),
};

// ============================================================================
// LOGGING
// ============================================================================

const LOG_LEVELS: Record<string, number> = { debug: 0, info: 1, warn: 2, error: 3 };
const currentLogLevel = LOG_LEVELS[CONFIG.LOG_LEVEL] || 1;

interface LogEntry {
  timestamp: string;
  level: string;
  category: string;
  message: string;
  [key: string]: any;
}

function log(level: string, category: string, message: string, data: any = {}) {
  if (LOG_LEVELS[level] < currentLogLevel) return;

  const timestamp = new Date().toISOString();
  const prefix =
    {
      debug: '🔍',
      info: '📍',
      warn: '⚠️',
      error: '❌',
    }[level] || '📍';

  const entry: LogEntry = { timestamp, level, category, message, ...data };
  console.log(
    `${prefix} [${timestamp}] [${category}] ${message}`,
    data.agentId ? `(${data.agentId})` : ''
  );

  // Also log to file asynchronously
  logToFile(entry).catch(() => {});
}

async function logToFile(entry: LogEntry) {
  try {
    await fs.mkdir(CONFIG.LOG_DIR, { recursive: true });
    const logFile = path.join(
      CONFIG.LOG_DIR,
      `master-${new Date().toISOString().split('T')[0]}.jsonl`
    );
    await fs.appendFile(logFile, JSON.stringify(entry) + '\n');
  } catch (e) {
    // Silently fail - log file not critical
  }
}

// ============================================================================
// AGENT REGISTRY
// ============================================================================

interface Agent {
  agentId: string;
  sourceId: string;
  platform: string;
  name: string;
  capabilities: string[];
  registeredAt: number;
  lastHeartbeat: number;
  lastActivity: number;
  status: 'active' | 'stalled' | 'offline';
  messageCount: number;
  violations: number;
  channel: string | null;
}

class AgentRegistry {
  agents: Map<string, Agent>;
  nextAgentNumber: number;
  pendingOnboarding: Map<string, any>;

  constructor() {
    this.agents = new Map();
    this.nextAgentNumber = 1;
    this.pendingOnboarding = new Map();
  }

  assignAgentId(sourceId: string, info: any = {}): string {
    // Check if already assigned
    for (const [id, agent] of this.agents) {
      if (agent.sourceId === sourceId) {
        return agent.agentId;
      }
    }

    // Generate new ID
    const agentNum = String(this.nextAgentNumber++).padStart(2, '0');
    const agentId = `AGENT-${agentNum}`;

    const agent: Agent = {
      agentId,
      sourceId,
      platform: info.platform || 'unknown',
      name: info.name || `Agent ${agentNum}`,
      capabilities: info.capabilities || [],
      registeredAt: Date.now(),
      lastHeartbeat: Date.now(),
      lastActivity: Date.now(),
      status: 'active',
      messageCount: 0,
      violations: 0,
      channel: info.channel || null,
    };

    this.agents.set(agentId, agent);
    log('info', 'REGISTRY', `Assigned ${agentId} to ${sourceId}`, {
      agentId,
      platform: agent.platform,
    });

    return agentId;
  }

  recordHeartbeat(agentId: string) {
    const agent = this.agents.get(agentId);
    if (agent) {
      agent.lastHeartbeat = Date.now();
      agent.status = 'active';
    }
  }

  recordActivity(agentId: string) {
    const agent = this.agents.get(agentId);
    if (agent) {
      agent.lastActivity = Date.now();
      agent.messageCount++;
      agent.status = 'active';
    }
  }

  recordViolation(agentId: string, type: string) {
    const agent = this.agents.get(agentId);
    if (agent) {
      agent.violations++;
      log('warn', 'REGISTRY', `Violation recorded for ${agentId}: ${type}`, {
        agentId,
        type,
        total: agent.violations,
      });
    }
  }

  getAgent(agentId: string): Agent | undefined {
    return this.agents.get(agentId);
  }

  getAgentBySource(sourceId: string): Agent | null {
    for (const [_, agent] of this.agents) {
      if (agent.sourceId === sourceId) {
        return agent;
      }
    }
    return null;
  }

  getStaleAgents(thresholdMs: number): Agent[] {
    const now = Date.now();
    const stale: Agent[] = [];
    for (const [id, agent] of this.agents) {
      if (agent.status !== 'offline' && now - agent.lastHeartbeat > thresholdMs) {
        stale.push(agent);
      }
    }
    return stale;
  }

  markOffline(agentId: string) {
    const agent = this.agents.get(agentId);
    if (agent) {
      agent.status = 'offline';
      log('warn', 'REGISTRY', `Agent marked offline: ${agentId}`, { agentId });
    }
  }

  getStats() {
    const agents = Array.from(this.agents.values());
    return {
      total: agents.length,
      active: agents.filter((a) => a.status === 'active').length,
      stalled: agents.filter((a) => a.status === 'stalled').length,
      offline: agents.filter((a) => a.status === 'offline').length,
    };
  }

  toJSON() {
    return Object.fromEntries(this.agents);
  }
}

// ============================================================================
// MASTER CLOCK
// ============================================================================

interface Metrics {
  heartbeatsSent: number;
  stallsDetected: number;
  recoveryAttempts: number;
  messagesProcessed: number;
  agentsOnboarded: number;
}

interface ChannelData {
  members: Set<string>;
  lastActivity: number;
  messageCount: number;
}

class MasterClock {
  sessionId: string;
  registry: AgentRegistry;
  ws: WebSocket | null;
  redis: ReturnType<typeof createClient> | null;
  redisSub: ReturnType<typeof createClient> | null;
  isRunning: boolean;
  heartbeatInterval: NodeJS.Timeout | null;
  stallCheckInterval: NodeJS.Timeout | null;
  channels: Map<string, ChannelData>;
  recoveryAttempts: Map<string, number>;
  metrics: Metrics;
  reconnectTimer: NodeJS.Timeout | null = null;

  constructor() {
    this.sessionId = `ORCHESTRATOR-${Date.now()}`;
    this.registry = new AgentRegistry();
    this.ws = null;
    this.redis = null;
    this.redisSub = null;
    this.isRunning = false;
    this.heartbeatInterval = null;
    this.stallCheckInterval = null;
    this.channels = new Map(); // channelId -> { members, lastActivity }
    this.recoveryAttempts = new Map(); // agentId -> attempts
    this.metrics = {
      heartbeatsSent: 0,
      stallsDetected: 0,
      recoveryAttempts: 0,
      messagesProcessed: 0,
      agentsOnboarded: 0,
    };
  }

  // --------------------------------------------------------------------------
  // INITIALIZATION
  // --------------------------------------------------------------------------

  async start() {
    log('info', 'MASTER', '═══════════════════════════════════════════════════════════════');
    log('info', 'MASTER', '🕐 TNF MASTER CLOCK STARTING');
    log('info', 'MASTER', '═══════════════════════════════════════════════════════════════');
    log('info', 'MASTER', `Session ID: ${this.sessionId}`);
    log('info', 'MASTER', `Heartbeat Interval: ${CONFIG.HEARTBEAT_INTERVAL}ms`);
    log('info', 'MASTER', `Stall Threshold: ${CONFIG.STALL_THRESHOLD}ms`);
    log('info', 'MASTER', '═══════════════════════════════════════════════════════════════');

    try {
      // Connect to Redis (for cloud coordination)
      if (CONFIG.REDIS_URL) {
        await this.connectRedis();
      }

      // Connect to WebSocket relay
      await this.connectRelay();

      // Start the eternal heartbeat
      this.startHeartbeat();

      // Start stall detection
      this.startStallDetection();

      this.isRunning = true;
      log('info', 'MASTER', '✅ MASTER CLOCK IS NOW THE BATON HOLDER');
    } catch (error: any) {
      log('error', 'MASTER', `Failed to start: ${error.message}`);
      this.scheduleReconnect();
    }
  }

  async connectRedis() {
    log('info', 'REDIS', 'Connecting to Redis for cloud coordination...');

    this.redis = createClient({ url: CONFIG.REDIS_URL });
    this.redisSub = createClient({ url: CONFIG.REDIS_URL });

    this.redis.on('error', (err: any) => log('error', 'REDIS', `Client error: ${err.message}`));
    this.redisSub.on('error', (err: any) =>
      log('error', 'REDIS', `Subscriber error: ${err.message}`)
    );

    await this.redis.connect();
    await this.redisSub.connect();

    // Subscribe to ingress for messages from other components
    await this.redisSub.subscribe(CONFIG.REDIS_KEYS.INGRESS, (message: string) => {
      try {
        const envelope = JSON.parse(message);
        this.handleRedisMessage(envelope);
      } catch (e) {
        // Invalid message
      }
    });

    log('info', 'REDIS', '✅ Connected to Redis cloud coordination');
  }

  async connectRelay(): Promise<void> {
    return new Promise((resolve, reject) => {
      log('info', 'RELAY', `Connecting to ${CONFIG.RELAY_URL}...`);

      this.ws = new WebSocket(CONFIG.RELAY_URL);

      const timeout = setTimeout(() => {
        reject(new Error('Connection timeout'));
      }, 10000);

      this.ws.on('open', () => {
        clearTimeout(timeout);
        log('info', 'RELAY', '✅ Connected to WebSocket relay');
        this.registerAsOrchestrator();
        this.joinAllChannels();
        resolve();
      });

      this.ws.on('message', (data: any) => {
        this.handleRelayMessage(data);
      });

      this.ws.on('close', () => {
        log('warn', 'RELAY', 'Disconnected from relay');
        this.scheduleReconnect();
      });

      this.ws.on('error', (err: any) => {
        log('error', 'RELAY', `Connection error: ${err.message}`);
        clearTimeout(timeout);
        reject(err);
      });
    });
  }

  scheduleReconnect() {
    if (this.reconnectTimer) return;

    log('info', 'MASTER', 'Scheduling reconnection in 5 seconds...');
    this.reconnectTimer = setTimeout(() => {
      this.reconnectTimer = null;
      this.start();
    }, 5000);
  }

  // --------------------------------------------------------------------------
  // ORCHESTRATOR REGISTRATION
  // --------------------------------------------------------------------------

  registerAsOrchestrator() {
    this.send({
      type: 'AGENT_REGISTER',
      payload: {
        agent: {
          id: this.sessionId,
          name: 'TNF Master Orchestrator',
          platform: 'orchestrator',
          role: 'ORCHESTRATOR',
          capabilities: [
            'orchestration',
            'task-distribution',
            'agent-coordination',
            'stall-detection',
            'recovery',
            'onboarding',
          ],
        },
      },
    });
  }

  async joinAllChannels() {
    const channelsToJoin = new Set(CONFIG.CHANNELS);

    // Load persisted channels from Redis
    if (this.redis) {
      try {
        const persistedChannels = await this.redis.sMembers(CONFIG.REDIS_KEYS.CHANNELS);
        for (const ch of persistedChannels) {
          channelsToJoin.add(ch);
        }
      } catch (e) {
        log('warn', 'REDIS', 'Failed to load persisted channels', e);
      }
    }

    for (const channel of channelsToJoin) {
      this.send({
        type: 'CHANNEL_CREATE',
        payload: { name: channel },
      });

      if (!this.channels.has(channel)) {
        this.channels.set(channel, {
          members: new Set(),
          lastActivity: Date.now(),
          messageCount: 0,
        });
      }
    }

    log('info', 'MASTER', `Managed Channels: ${Array.from(channelsToJoin).join(', ')}`);

    // Broadcast initial discovery
    setTimeout(() => this.broadcastDiscovery(), 2000);
  }

  // --------------------------------------------------------------------------
  // THE ETERNAL HEARTBEAT
  // --------------------------------------------------------------------------

  startHeartbeat() {
    if (this.heartbeatInterval) return;

    log('info', 'HEARTBEAT', `Starting eternal heartbeat (every ${CONFIG.HEARTBEAT_INTERVAL}ms)`);

    this.heartbeatInterval = setInterval(() => {
      this.sendHeartbeat();
    }, CONFIG.HEARTBEAT_INTERVAL);

    // Send first heartbeat immediately
    this.sendHeartbeat();
  }

  sendHeartbeat() {
    const now = Date.now();
    const stats = this.registry.getStats();

    // Heartbeat to relay
    this.send({
      type: 'HEARTBEAT',
      payload: {
        sessionId: this.sessionId,
        role: 'ORCHESTRATOR',
        timestamp: now,
        stats,
        channels: CONFIG.CHANNELS,
      },
    });

    // Heartbeat to Redis (for cloud coordination)
    if (this.redis) {
      this.redis
        .hSet(
          CONFIG.REDIS_KEYS.STATE,
          'orchestrator',
          JSON.stringify({
            sessionId: this.sessionId,
            lastHeartbeat: now,
            stats,
            isActive: true,
          })
        )
        .catch(() => {});
    }

    this.metrics.heartbeatsSent++;

    // Log status periodically (every 10th heartbeat)
    if (this.metrics.heartbeatsSent % 10 === 0) {
      log('debug', 'HEARTBEAT', `Tick #${this.metrics.heartbeatsSent}`, stats);
    }
  }

  // --------------------------------------------------------------------------
  // STALL DETECTION - THE WATCHDOG
  // --------------------------------------------------------------------------

  startStallDetection() {
    if (this.stallCheckInterval) return;

    log(
      'info',
      'WATCHDOG',
      `Starting stall detection (checking every ${CONFIG.STALL_THRESHOLD}ms)`
    );

    // Check more frequently than the threshold to catch stalls quickly
    const checkInterval = Math.floor(CONFIG.STALL_THRESHOLD / 2);

    this.stallCheckInterval = setInterval(() => {
      this.checkForStalls();
    }, checkInterval);
  }

  checkForStalls() {
    const staleAgents = this.registry.getStaleAgents(CONFIG.STALL_THRESHOLD);

    for (const agent of staleAgents) {
      const idleTime = Date.now() - agent.lastHeartbeat;
      const attempts = this.recoveryAttempts.get(agent.agentId) || 0;

      if (agent.status === 'active') {
        // First detection - mark as stalled
        agent.status = 'stalled';
        this.metrics.stallsDetected++;
        log(
          'warn',
          'WATCHDOG',
          `STALL DETECTED: ${agent.agentId} (idle: ${Math.round(idleTime / 1000)}s)`,
          { agentId: agent.agentId }
        );

        // Immediate recovery attempt
        this.attemptRecovery(agent.agentId, 1);
      } else if (attempts < CONFIG.MAX_RECOVERY_ATTEMPTS) {
        // Continue recovery attempts
        const timeSinceLastAttempt = idleTime - attempts * CONFIG.RECOVERY_INTERVAL;
        if (timeSinceLastAttempt >= CONFIG.RECOVERY_INTERVAL) {
          this.attemptRecovery(agent.agentId, attempts + 1);
        }
      } else {
        // Max attempts reached - mark offline
        this.registry.markOffline(agent.agentId);
        this.broadcastAgentOffline(agent.agentId);
      }
    }
  }

  attemptRecovery(agentId: string, attemptNumber: number) {
    this.recoveryAttempts.set(agentId, attemptNumber);
    this.metrics.recoveryAttempts++;

    log(
      'info',
      'RECOVERY',
      `Recovery attempt ${attemptNumber}/${CONFIG.MAX_RECOVERY_ATTEMPTS} for ${agentId}`,
      { agentId }
    );

    const agent = this.registry.getAgent(agentId);
    if (!agent) return;

    const recoveryMessage =
      attemptNumber === 1
        ? `🔔 [SYSTEM] Agent ${agentId}, please respond with a heartbeat or acknowledgment.`
        : attemptNumber === 2
          ? `⚠️ [SYSTEM] Agent ${agentId}, you have been idle for ${Math.round((Date.now() - agent.lastHeartbeat) / 1000)}s. Please respond immediately.`
          : `🚨 [SYSTEM] URGENT: Agent ${agentId}, final recovery attempt. Respond now or you will be marked offline.`;

    // Broadcast to the agent's channel
    if (agent.channel) {
      this.broadcastToChannel(agent.channel, recoveryMessage);
    }

    // Also broadcast to all channels
    for (const channel of CONFIG.CHANNELS) {
      if (channel !== agent.channel) {
        this.broadcastToChannel(channel, `[RECOVERY] Attempting to reach ${agentId}...`);
      }
    }
  }

  // --------------------------------------------------------------------------
  // MESSAGE HANDLING
  // --------------------------------------------------------------------------

  handleRelayMessage(data: any) {
    try {
      const msg = JSON.parse(data.toString());
      this.processMessage(msg, 'relay');
    } catch (e) {
      // Invalid JSON - ignore
    }
  }

  handleRedisMessage(envelope: any) {
    this.processMessage(envelope, 'redis');
  }

  processMessage(msg: any, source: string) {
    this.metrics.messagesProcessed++;

    switch (msg.type) {
      case 'CHANNEL_MESSAGE':
        this.handleChannelMessage(msg);
        break;
      case 'HEARTBEAT':
        this.handleAgentHeartbeat(msg);
        break;
      case 'AGENT_REGISTER':
        this.handleAgentRegistration(msg);
        break;
      case 'AGENT_JOINED':
        this.handleAgentJoined(msg);
        break;
      case 'CHANNEL_CREATE':
        this.handleChannelCreate(msg);
        break;
      case 'WELCOME':
        log('debug', 'RELAY', 'Welcome received', { clientId: msg.clientId });
        break;
    }
  }

  handleChannelMessage(msg: any) {
    const content = msg.payload?.content || '';
    const sourceId = msg.payload?.from || msg.source;
    const channel = msg.channel || msg.payload?.channel;

    // Check if this is a new agent that needs onboarding
    const existingAgent = this.registry.getAgentBySource(sourceId);

    if (!existingAgent && sourceId && sourceId !== this.sessionId) {
      // New agent detected! Onboard immediately
      const agentId = this.registry.assignAgentId(sourceId, {
        channel,
        platform: this.detectPlatform(content),
        capabilities: this.detectCapabilities(content),
      });

      this.metrics.agentsOnboarded++;

      // Send assignment notification
      this.broadcastToChannel(channel, this.createAssignmentMessage(agentId));
    } else if (existingAgent) {
      // Known agent - record activity
      this.registry.recordActivity(existingAgent.agentId);

      // Check for signed messages
      if (!this.isSignedMessage(content, existingAgent.agentId)) {
        this.registry.recordViolation(existingAgent.agentId, 'unsigned_message');
        this.sendSigningReminder(channel, existingAgent.agentId);
      }

      // Clear recovery attempts on activity
      this.recoveryAttempts.delete(existingAgent.agentId);
    }

    // Update channel activity
    if (channel && this.channels.has(channel)) {
      const ch = this.channels.get(channel);
      if (ch) {
        ch.lastActivity = Date.now();
        ch.messageCount++;
      }
    }
  }

  handleAgentHeartbeat(msg: any) {
    const agentId = msg.payload?.agentId || msg.source;
    const existingAgent = this.registry.getAgentBySource(agentId);

    if (existingAgent) {
      this.registry.recordHeartbeat(existingAgent.agentId);
      this.recoveryAttempts.delete(existingAgent.agentId);
    }
  }

  handleAgentRegistration(msg: any) {
    const info = msg.payload?.agent || {};
    const sourceId = info.id || msg.source;

    if (sourceId && sourceId !== this.sessionId) {
      const agentId = this.registry.assignAgentId(sourceId, {
        platform: info.platform,
        name: info.name,
        capabilities: info.capabilities,
      });

      this.metrics.agentsOnboarded++;

      // Broadcast assignment to all channels
      for (const channel of CONFIG.CHANNELS) {
        this.broadcastToChannel(channel, this.createAssignmentMessage(agentId));
      }
    }
  }

  handleAgentJoined(msg: any) {
    const channel = msg.channel;
    const agentId = msg.payload?.agentId || msg.source;

    if (channel && this.channels.has(channel) && agentId) {
      const ch = this.channels.get(channel);
      if (ch) ch.members.add(agentId);

      // Check if this agent needs onboarding
      const existingAgent = this.registry.getAgentBySource(agentId);
      if (!existingAgent && agentId !== this.sessionId) {
        const newId = this.registry.assignAgentId(agentId, { channel });
        this.broadcastToChannel(channel, this.createAssignmentMessage(newId));
      }
    }
  }

  async handleChannelCreate(msg: any) {
    const channelName = msg.payload?.name || msg.channel;
    if (!channelName) return;

    if (!this.channels.has(channelName)) {
      log('info', 'CHANNEL', `Dynamic channel creation request: ${channelName}`, {
        requestedBy: msg.source,
      });

      // Create channel locally
      this.channels.set(channelName, {
        members: new Set(),
        lastActivity: Date.now(),
        messageCount: 0,
      });

      // Send CREATE to Relay (to ensure WebSocket rooms exist if needed)
      this.send({
        type: 'CHANNEL_CREATE',
        payload: { name: channelName },
      });

      // Persist to Redis
      if (this.redis) {
        await this.redis.sAdd(CONFIG.REDIS_KEYS.CHANNELS, channelName);
      }

      // Broadcast new channel existence
      this.broadcastToChannel('General', `📢 New channel created: ${channelName}`);
    }
  }

  // --------------------------------------------------------------------------
  // UTILITY METHODS
  // --------------------------------------------------------------------------

  send(msg: any) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(
        JSON.stringify({
          ...msg,
          source: this.sessionId,
          timestamp: Date.now(),
        })
      );
    }
  }

  broadcastToChannel(channel: string, content: string) {
    this.send({
      type: 'MESSAGE_SEND',
      channel,
      payload: {
        to: 'broadcast',
        content,
        messageType: 'text',
        metadata: {
          isSystemMessage: true,
          source: 'ORCHESTRATOR',
        },
      },
    });
  }

  broadcastDiscovery() {
    const discoveryMessage = `
═══════════════════════════════════════════════════════════════
🌐 TNF ORCHESTRATOR ONLINE - DACC-v1 PROTOCOL
═══════════════════════════════════════════════════════════════
Session: ${this.sessionId}
Time: ${new Date().toISOString()}
Heartbeat: Every ${CONFIG.HEARTBEAT_INTERVAL / 1000}s | Stall Detection: ${CONFIG.STALL_THRESHOLD / 1000}s

ROLE HIERARCHY:
• DIRECTOR - Strategic authority (Human/Super-Agent)
• ORCHESTRATOR - This daemon (24/7 coordination)
• BROKER - Channel managers
• AGENT - Worker instances (You!)

📋 TO REGISTER: Simply send a message with your capabilities.
📋 YOU WILL RECEIVE: Unique Agent ID (AGENT-XX)
⚠️ MANDATORY: Sign ALL messages with [AGENT-XX]

Current Status:
• Active Agents: ${this.registry.getStats().active}
• Channels: ${CONFIG.CHANNELS.join(', ')}
═══════════════════════════════════════════════════════════════`;

    for (const channel of CONFIG.CHANNELS) {
      this.broadcastToChannel(channel, discoveryMessage);
    }
  }

  createAssignmentMessage(agentId: string) {
    return `
╔═══════════════════════════════════════════════════════════════╗
║  🎫 AGENT ID ASSIGNMENT                                       ║
╚═══════════════════════════════════════════════════════════════╝

Your Assigned ID: ${agentId}

⚠️ SIGN ALL MESSAGES: [${agentId}] your message here

Session: ${this.sessionId}
Active Agents: ${this.registry.getStats().active}

Acknowledge by sending: [${agentId}] Ready for duty!
`;
  }

  broadcastAgentOffline(agentId: string) {
    for (const channel of CONFIG.CHANNELS) {
      this.broadcastToChannel(
        channel,
        `⚫ Agent ${agentId} has been marked OFFLINE (no response after ${CONFIG.MAX_RECOVERY_ATTEMPTS} recovery attempts)`
      );
    }
  }

  sendSigningReminder(channel: string, agentId: string) {
    this.broadcastToChannel(
      channel,
      `⚠️ Reminder: ${agentId}, please sign your messages with [${agentId}]`
    );
  }

  isSignedMessage(content: string, agentId: string) {
    if (!content || !agentId) return false;
    return content.includes(`[${agentId}]`) || content.startsWith(`[${agentId}]`);
  }

  detectPlatform(content: string) {
    const lower = content.toLowerCase();
    if (lower.includes('gemini')) return 'gemini';
    if (lower.includes('claude')) return 'claude';
    if (lower.includes('chatgpt') || lower.includes('openai')) return 'chatgpt';
    if (lower.includes('perplexity')) return 'perplexity';
    if (lower.includes('deepseek')) return 'deepseek';
    if (lower.includes('cursor')) return 'cursor';
    if (lower.includes('jules')) return 'jules';
    return 'unknown';
  }

  detectCapabilities(content: string) {
    const capabilities = [];
    const lower = content.toLowerCase();

    if (lower.includes('code') || lower.includes('programming'))
      capabilities.push('code-generation');
    if (lower.includes('research') || lower.includes('search')) capabilities.push('research');
    if (lower.includes('analysis') || lower.includes('analyze')) capabilities.push('analysis');
    if (lower.includes('image') || lower.includes('vision')) capabilities.push('image-processing');
    if (lower.includes('file') || lower.includes('document')) capabilities.push('file-handling');

    return capabilities;
  }

  // --------------------------------------------------------------------------
  // SHUTDOWN
  // --------------------------------------------------------------------------

  async shutdown() {
    log('info', 'MASTER', 'Shutting down Master Clock...');

    this.isRunning = false;

    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
    }

    if (this.stallCheckInterval) {
      clearInterval(this.stallCheckInterval);
    }

    // Broadcast shutdown
    for (const channel of CONFIG.CHANNELS) {
      this.broadcastToChannel(channel, '🔴 ORCHESTRATOR GOING OFFLINE. Sessions may be affected.');
    }

    // Give time for final messages
    await new Promise((r) => setTimeout(r, 1000));

    if (this.ws) {
      this.ws.close();
    }

    if (this.redis) {
      await this.redis.quit();
    }

    if (this.redisSub) {
      await this.redisSub.quit();
    }

    log('info', 'MASTER', 'Master Clock shutdown complete.');
    log('info', 'MASTER', `Final metrics:`, this.metrics);
  }
}

// ============================================================================
// MAIN
// ============================================================================

const clock = new MasterClock();

// Graceful shutdown
process.on('SIGINT', async () => {
  await clock.shutdown();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  await clock.shutdown();
  process.exit(0);
});

// Start the eternal heartbeat
clock.start();
