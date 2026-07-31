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
 * - RELAY_URL: WebSocket relay URL (default: ws://127.0.0.1:3000/ws)
 * - HEARTBEAT_INTERVAL: Heartbeat frequency in ms (default: 3000)
 * - STALL_THRESHOLD: Stall detection threshold in ms (default: 5000)
 * - LOG_LEVEL: debug|info|warn|error (default: info)
 */
import fs from 'fs/promises';
import path from 'path';

import { attachAuditTrace, type TnfAuditTrace } from './contracts/audit.js';
import { type TnfAgentIdentityRecord } from './contracts/identity.js';
import { normalizeAgentLifecycleStatus } from './contracts/lifecycle.js';
import {
  AgentRegistryService,
  createOrchestratorIdentity,
} from './services/agent-registry.service.js';
import { ChannelManagerService } from './services/channel-manager.service.js';
import { migrateOrphanedOrchestratorInboxes } from './services/orchestrator-inbox-migration.service.js';
import { RedisClientManager } from './services/redis-client-manager.service.js';
import { RelayConnectionManager } from './services/relay-connection.service.js';
import { SelfPromptService } from './services/self-prompt.service.js';
import { SuperCycleSchedulerService } from './services/super-cycle-scheduler.service.js';
import { TaskSchedulerService } from './services/task-scheduler.service.js';

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
  SUPER_CYCLE_STALE_THRESHOLD: parseInt(process.env.SUPER_CYCLE_STALE_THRESHOLD || '') || 90000, // 90 seconds
  SELF_PROMPT_ENABLED: (process.env.SELF_PROMPT_ENABLED || 'true') === 'true',
  SELF_PROMPT_COOLDOWN_MS: parseInt(process.env.SELF_PROMPT_COOLDOWN_MS || '') || 30000, // 30 seconds
  TASK_POLL_INTERVAL_MS: parseInt(process.env.TASK_POLL_INTERVAL_MS || '') || 15000, // 15 seconds
  TASK_QUEUE_COOLDOWN_MS: parseInt(process.env.TASK_QUEUE_COOLDOWN_MS || '') || 120000, // 2 minutes
  TASK_QUEUE_BATCH_SIZE: parseInt(process.env.TASK_QUEUE_BATCH_SIZE || '') || 5,
  CHRONOLOGICAL_POLL_INTERVAL_MS:
    parseInt(process.env.CHRONOLOGICAL_POLL_INTERVAL_MS || '') || 30000, // 30 seconds

  // Connections
  RELAY_URL:
    process.env.RELAY_URL ||
    process.env.TNF_RELAY_URL ||
    process.env.RELAY_WS_URL ||
    'ws://127.0.0.1:3000/ws',
  REDIS_URL: process.env.REDIS_URL,
  LEDGER_API_BASE:
    process.env.LEDGER_API_BASE ||
    process.env.CLOUD_RUNTIME_API_URL ||
    process.env.LIVE_API_BASE_URL ||
    process.env.API_BASE_URL ||
    process.env.TNF_API_BASE ||
    'http://localhost:3001',

  // Channels to monitor
  CHANNELS: ['Green', 'Blue', 'Red', 'Yellow', 'Purple', 'General'],

  // Redis keys
  REDIS_KEYS: {
    AGENTS: 'tnf:master:agents',
    HEARTBEATS: 'tnf:master:heartbeats',
    CHANNELS: 'tnf:master:channels',
    TASKS: 'tnf:master:tasks:pending',
    TASKS_REALTIME: 'tnf:master:tasks:realtime',
    TASKS_PLANNING: 'tnf:master:tasks:planning',
    SUGGESTIONS: 'tnf:master:suggestions:votes',
    CHANGELOG: 'tnf:master:changelog:suggestions',
    KANBAN: 'tnf:master:kanban:delivery',
    LOGS: 'tnf:master:logs',
    STATE: 'tnf:master:state',
    SUPER_CYCLE: 'tnf:master:super-cycle',
    INGRESS: 'tnf:bus:ingress',
    EGRESS_PREFIX: 'tnf:bus:egress',
    SELF_PROMPTS: 'tnf:master:self-prompts',
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
// MASTER CLOCK
// ============================================================================

interface RelayAgentRegistrationRequest {
  agentId: string; // The requested ID from the relay
  sourceId: string; // Unique identifier from the relay, usually same as agentId initially
  platform: string;
  name: string;
  capabilities: string[];
  channels: string[];
  runtimeSessionId: string;
  metadata?: Record<string, unknown>;
  replyTo: string; // Redis channel for the master clock to reply to
  canonicalEntityId?: string;
}

interface Metrics {
  heartbeatsSent: number;
  stallsDetected: number;
  recoveryAttempts: number;
  messagesProcessed: number;
  agentsOnboarded: number;
  taskPolls: number;
  tasksQueued: number;
}

class MasterClock {
  sessionId: string;
  orchestratorIdentity: TnfAgentIdentityRecord;
  registry: AgentRegistryService;
  redisClient: RedisClientManager;
  relayConnectionManager: RelayConnectionManager;
  isRunning: boolean;
  heartbeatInterval: NodeJS.Timeout | null;
  stallCheckInterval: NodeJS.Timeout | null;
  channelManager: ChannelManagerService;
  recoveryAttempts: Map<string, number>;
  metrics: Metrics;
  reconnectTimer: NodeJS.Timeout | null = null;
  taskScheduler: TaskSchedulerService;
  selfPromptService: SelfPromptService;
  superCycleScheduler: SuperCycleSchedulerService;

  constructor() {
    this.sessionId = `ORCHESTRATOR-${Date.now()}`;
    this.orchestratorIdentity = createOrchestratorIdentity(this.sessionId);
    this.registry = new AgentRegistryService();
    this.redisClient = new RedisClientManager(
      CONFIG,
      log,
      this.handleRedisMessage.bind(this),
      this.handleRelayAgentRegisterRequest.bind(this)
    );
    this.relayConnectionManager = new RelayConnectionManager(
      { RELAY_URL: CONFIG.RELAY_URL },
      log,
      this.processMessage.bind(this),
      this.getOrchestratorEnvelopeIdentity.bind(this),
      this.scheduleReconnect.bind(this),
      this.sessionId
    );
    this.isRunning = false;
    this.heartbeatInterval = null;
    this.stallCheckInterval = null;
    this.channelManager = new ChannelManagerService(
      this.relayConnectionManager.send.bind(this.relayConnectionManager),
      this.redisClient,
      this.registry,
      this.getOrchestratorEnvelopeIdentity(),
      this.emitActivityEvent.bind(this)
    );
    this.recoveryAttempts = new Map();
    this.metrics = {
      heartbeatsSent: 0,
      stallsDetected: 0,
      recoveryAttempts: 0,
      messagesProcessed: 0,
      agentsOnboarded: 0,
      taskPolls: 0,
      tasksQueued: 0,
    };
    this.taskScheduler = new TaskSchedulerService(
      CONFIG,
      log,
      this.redisClient,
      this.emitActivityEvent.bind(this)
    );
    this.selfPromptService = new SelfPromptService(
      CONFIG,
      log,
      this.redisClient,
      this.getOrchestratorEnvelopeIdentity.bind(this),
      this.getAgentEnvelopeIdentity.bind(this),
      this.getOrchestratorAudit.bind(this),
      this.sessionId
    );
    this.superCycleScheduler = new SuperCycleSchedulerService(
      CONFIG,
      log,
      this.redisClient,
      this.selfPromptService,
      this.emitActivityEvent.bind(this),
      this.getOrchestratorEnvelopeIdentity.bind(this)
    );
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
      await this.redisClient.connectRedis();

      // Connect to WebSocket relay
      await this.relayConnectionManager.connectRelay();

      // Claim prior-session handoff inboxes before advertising baton ownership.
      await this.migrateOrphanedHandoffInboxes();

      // Start the eternal heartbeat
      this.startHeartbeat();

      // Start stall detection
      this.startStallDetection();
      this.taskScheduler.startTaskPolling();
      this.superCycleScheduler.startChronologicalPolling();
      await this.channelManager.joinAllChannels();

      this.isRunning = true;
      log('info', 'MASTER', '✅ MASTER CLOCK IS NOW THE BATON HOLDER');
    } catch (error: any) {
      log('error', 'MASTER', `Failed to start: ${error.message}`);
      this.scheduleReconnect();
    }
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
  // ORCHESTRATOR SESSION INBOX MIGRATION
  // --------------------------------------------------------------------------

  /**
   * Move handoff packets addressed to prior `ORCHESTRATOR-{ts}` sessions onto
   * this process's baton identity. Platform wrappers are not the baton holder;
   * only this master-clock session identity is.
   */
  private async migrateOrphanedHandoffInboxes(): Promise<void> {
    const redis = this.redisClient.rawRedisClient;
    if (!redis) {
      log('warn', 'MASTER', 'Skipping orphaned handoff migration: no Redis client');
      return;
    }

    try {
      const result = await migrateOrphanedOrchestratorInboxes(redis as any, this.sessionId, {
        maxMove: parseInt(process.env.ORCHESTRATOR_INBOX_MIGRATE_MAX || '', 10) || 5000,
      });
      if (result.migrated > 0) {
        log(
          'info',
          'MASTER',
          `Migrated ${result.migrated} orphaned handoff packet(s) from ${result.sources.length} prior ORCHESTRATOR inbox(es) → ${this.sessionId}`
        );
      } else {
        log('debug', 'MASTER', 'No orphaned ORCHESTRATOR handoff inboxes to migrate');
      }
    } catch (error: any) {
      log('warn', 'MASTER', `Orphaned handoff migration failed: ${error?.message || error}`);
    }
  }

  // --------------------------------------------------------------------------
  // MEMORY MANAGEMENT
  // --------------------------------------------------------------------------

  private pruneTrackingMaps(now: number) {
    const COOLDOWN_MAX_AGE = 24 * 60 * 60 * 1000; // 24 hours

    const prunedTasks = this.taskScheduler.pruneTasks(now, COOLDOWN_MAX_AGE);

    // Prune selfPromptCooldowns (now managed by SelfPromptService)
    const prunedCooldowns = this.selfPromptService.pruneCooldowns(now, COOLDOWN_MAX_AGE);

    // Prune recoveryAttempts for offline agents
    let prunedRecovery = 0;
    for (const agentId of this.recoveryAttempts.keys()) {
      if (!this.registry.getAgentBySource(agentId)) {
        this.recoveryAttempts.delete(agentId);
        prunedRecovery++;
      }
    }

    if (prunedTasks > 0 || prunedCooldowns > 0 || prunedRecovery > 0) {
      log(
        'debug',
        'MEMORY',
        `Pruned tracking data: ${prunedTasks} tasks, ${prunedCooldowns} cooldowns, ${prunedRecovery} recovery attempts`
      );
    }
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

  async sendHeartbeat() {
    const now = Date.now();

    // Memory Leak Prevention: Prune old tracking data
    this.pruneTrackingMaps(now);

    const stats = this.registry.getStats();
    const superCycleStats = this.superCycleScheduler.getSuperCycleStats();
    const orchestrator = this.getOrchestratorEnvelopeIdentity();

    // Heartbeat to relay
    this.relayConnectionManager.send({
      type: 'HEARTBEAT',
      payload: {
        sessionId: this.sessionId,
        canonicalEntityId: orchestrator.canonicalEntityId,
        operationalHandle: orchestrator.operationalHandle,
        runtimeSessionId: orchestrator.runtimeSessionId,
        role: 'ORCHESTRATOR',
        timestamp: now,
        stats,
        superCycle: superCycleStats,
        channels: CONFIG.CHANNELS,
      },
    });

    // Heartbeat to Redis (for cloud coordination)
    await this.redisClient
      .hset(
        CONFIG.REDIS_KEYS.STATE,
        'orchestrator',
        JSON.stringify({
          sessionId: this.sessionId,
          lastHeartbeat: now,
          stats,
          superCycle: superCycleStats,
          isActive: true,
        })
      )
      .catch(() => {});

    void this.superCycleScheduler.persistSuperCycleState(now).catch(() => {});

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

  private async emitActivityEvent(
    eventType: string,
    content: string,
    metadata: Record<string, unknown>
  ): Promise<void> {
    const auditedMetadata = this.attachOrchestratorAudit(
      {
        isSystemMessage: true,
        source: 'ORCHESTRATOR',
        eventType,
        activityChannel: 'General',
        sessionId: this.sessionId,
        ...metadata,
      },
      {
        channelId: 'fuse-activity-log',
        sessionId: this.sessionId,
      }
    );

    this.relayConnectionManager.send({
      type: 'MESSAGE_SEND',
      channel: 'fuse-activity-log',
      payload: {
        to: 'broadcast',
        content,
        messageType: 'event',
        metadata: auditedMetadata,
      },
    });

    if (!this.redisClient.rawRedisClient && !this.redisClient.rawUpstashClient) return;
    try {
      await this.redisClient.lpush(
        CONFIG.REDIS_KEYS.LOGS,
        JSON.stringify({
          timestamp: new Date().toISOString(),
          sessionId: this.sessionId,
          eventType,
          content,
          metadata: auditedMetadata,
        })
      );
      await this.redisClient.ltrim(CONFIG.REDIS_KEYS.LOGS, 0, 999);
    } catch {
      // non-fatal
    }
  }

  checkForStalls() {
    const staleAgents = this.registry.getStaleAgents(CONFIG.STALL_THRESHOLD);

    for (const agent of staleAgents) {
      const idleTime = Date.now() - agent.lastHeartbeat;
      const attempts = this.recoveryAttempts.get(agent.agentId) || 0;

      if (agent.status === 'active') {
        // First detection - mark as stalled
        agent.status = normalizeAgentLifecycleStatus('stalled') || 'stalled';
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
        this.channelManager.broadcastAgentOffline(agent.agentId);
      }
    }

    this.superCycleScheduler.checkForStaleScheduledProcesses();
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
      this.relayConnectionManager.send({
        type: 'MESSAGE_SEND',
        channel: agent.channel,
        payload: { to: 'broadcast', content: recoveryMessage, metadata: { isSystemMessage: true } },
      });
    }

    // Also broadcast to all channels
    for (const channel of CONFIG.CHANNELS) {
      if (channel !== agent.channel) {
        this.relayConnectionManager.send({
          type: 'MESSAGE_SEND',
          channel: channel,
          payload: {
            to: 'broadcast',
            content: `[RECOVERY] Attempting to reach ${agentId}...`,
            metadata: { isSystemMessage: true },
          },
        });
      }
    }

    void this.selfPromptService.emitSelfPrompt({
      kind: 'agent-stall',
      channel: agent.channel || 'General',
      prompt: recoveryMessage,
      reason: 'agent_stalled',
      targetAgentId: agent.agentId,
      targetSourceId: agent.sourceId,
      metadata: {
        attemptNumber,
        maxAttempts: CONFIG.MAX_RECOVERY_ATTEMPTS,
        idleSeconds: Math.round((Date.now() - agent.lastHeartbeat) / 1000),
      },
    });
  }

  // --------------------------------------------------------------------------
  // MESSAGE HANDLING
  // --------------------------------------------------------------------------

  handleRedisMessage(envelope: any) {
    this.processMessage(envelope, 'redis');
  }

  processMessage(msg: any, source: string) {
    try {
      this.metrics.messagesProcessed++;

      const normalized = this.normalizeIncomingMessage(msg);
      if (!normalized) return;

      switch (normalized.type) {
        case 'CHANNEL_MESSAGE':
          this.handleChannelMessage(normalized);
          break;
        case 'HEARTBEAT':
          this.handleAgentHeartbeat(normalized);
          break;
        case 'AGENT_REGISTER':
          this.handleAgentRegistration(normalized);
          break;
        case 'AGENT_JOINED':
          this.handleAgentJoined(normalized);
          break;
        case 'CHANNEL_CREATE':
          this.channelManager.handleChannelCreate(normalized);
          break;
        case 'SUPER_CYCLE_REGISTER':
          this.superCycleScheduler.handleSuperCycleRegistration(normalized);
          break;
        case 'SUPER_CYCLE_HEARTBEAT':
          this.superCycleScheduler.handleSuperCycleHeartbeat(normalized);
          break;
        case 'SUPER_CYCLE_UNREGISTER':
          this.superCycleScheduler.handleSuperCycleUnregister(normalized);
          break;
        case 'WELCOME':
          log('debug', 'RELAY', 'Welcome received', { clientId: normalized.clientId });
          break;
      }
    } catch (e: any) {
      log('error', 'MASTER_CLOCK', `Error processing message from ${source}: ${e.message}`, {
        error: e,
      });
    }
  }

  normalizeIncomingMessage(msg: any): any {
    if (!msg) return null;

    // TNF envelope compatibility over Redis ingress.
    if (msg.payload?.originalMessage?.type) {
      return msg.payload.originalMessage;
    }

    if (msg.type) return msg;

    return null;
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
        aliases: [sourceId],
      });

      this.metrics.agentsOnboarded++;

      // Send assignment notification
      this.channelManager.broadcastToChannel(channel, this.createAssignmentMessage(agentId));
    } else if (existingAgent) {
      // Known agent - record activity
      this.registry.recordActivity(existingAgent.agentId);

      // Check for signed messages
      if (!this.isSignedMessage(content, existingAgent.agentId)) {
        this.registry.recordViolation(existingAgent.agentId, 'unsigned_message');
        this.channelManager.sendSigningReminder(channel, existingAgent.agentId);
      }

      // Clear recovery attempts on activity
      this.recoveryAttempts.delete(existingAgent.agentId);
    }

    // Update channel activity
    if (channel) {
      this.channelManager.updateChannelActivity(channel);
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
        canonicalEntityId: info.canonicalEntityId,
        operationalHandle: info.operationalHandle,
        runtimeSessionId: info.runtimeSessionId,
        aliases: info.aliases,
        platform: info.platform,
        name: info.name,
        capabilities: info.capabilities,
      });

      this.metrics.agentsOnboarded++;

      // Broadcast assignment to all channels
      for (const channel of CONFIG.CHANNELS) {
        this.channelManager.broadcastToChannel(channel, this.createAssignmentMessage(agentId));
      }
    }
  }

  async handleRelayAgentRegisterRequest(req: RelayAgentRegistrationRequest): Promise<void> {
    log('info', 'REGISTRY', `Handling register request from relay for source: ${req.sourceId}`);

    try {
      const agentId = this.registry.assignAgentId(req.sourceId, {
        canonicalEntityId: req.canonicalEntityId,
        operationalHandle: req.name || req.sourceId,
        runtimeSessionId: req.runtimeSessionId,
        aliases: [req.sourceId, req.name].filter(Boolean),
        platform: req.platform,
        name: req.name,
        capabilities: req.capabilities,
        channels: req.channels,
      });

      this.metrics.agentsOnboarded++;

      const agent = this.registry.getAgent(agentId);

      if (req.replyTo) {
        await this.redisClient
          .publish(
            req.replyTo,
            JSON.stringify({
              type: 'REGISTRATION_SUCCESS',
              payload: {
                agentId,
                canonicalEntityId: agent?.canonicalEntityId,
                operationalHandle: agent?.operationalHandle,
                runtimeSessionId: agent?.runtimeSessionId,
                aliases: agent?.aliases || [],
              },
            })
          )
          .catch((err: any) => {
            log(
              'error',
              'REGISTRY',
              `Failed to publish registration success to Redis: ${err.message}`
            );
          });
      }

      const channelsToNotify =
        req.channels && req.channels.length > 0 ? req.channels : CONFIG.CHANNELS;
      for (const channel of channelsToNotify) {
        this.channelManager.broadcastToChannel(channel, this.createAssignmentMessage(agentId));
      }
    } catch (err: any) {
      log(
        'error',
        'REGISTRY',
        `Registration failed for source: ${req.sourceId}. Reason: ${err.message}`
      );
      if (req.replyTo) {
        await this.redisClient
          .publish(
            req.replyTo,
            JSON.stringify({
              type: 'REGISTRATION_FAILURE',
              payload: {
                sourceId: req.sourceId,
                error: err.message,
              },
            })
          )
          .catch((publishErr: any) => {
            log(
              'error',
              'REGISTRY',
              `Failed to publish registration failure to Redis: ${publishErr.message}`
            );
          });
      }
    }
  }

  handleAgentJoined(msg: any) {
    const channel = msg.channel;
    const agentId = msg.payload?.agentId || msg.source;

    if (channel && agentId) {
      this.channelManager.handleAgentJoined(channel, agentId);

      // Check if this agent needs onboarding (AgentRegistryService responsibility)
      const existingAgent = this.registry.getAgentBySource(agentId);
      if (!existingAgent && agentId !== this.sessionId) {
        const newId = this.registry.assignAgentId(agentId, { channel, aliases: [agentId] });
        this.channelManager.broadcastToChannel(channel, this.createAssignmentMessage(newId));
      }
    }
  }

  // --------------------------------------------------------------------------
  // UTILITY METHODS
  // --------------------------------------------------------------------------

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

  private getOrchestratorAudit(
    overrides: Partial<TnfAuditTrace> = {}
  ): Partial<TnfAuditTrace> & Pick<TnfAuditTrace, 'source' | 'actor'> {
    return {
      source: 'master-clock',
      actor: this.orchestratorIdentity.operationalHandle,
      sessionId: this.sessionId,
      canonicalEntityId: this.orchestratorIdentity.canonicalEntityId,
      operationalHandle: this.orchestratorIdentity.operationalHandle,
      runtimeSessionId: this.orchestratorIdentity.runtimeSessionId,
      ...overrides,
    };
  }

  private attachOrchestratorAudit(
    metadata: Record<string, unknown> | undefined,
    overrides: Partial<TnfAuditTrace> = {}
  ): Record<string, unknown> {
    return attachAuditTrace(metadata, this.getOrchestratorAudit(overrides));
  }

  private getOrchestratorEnvelopeIdentity() {
    return {
      agentId: this.sessionId,
      canonicalEntityId: this.orchestratorIdentity.canonicalEntityId || undefined,
      operationalHandle: this.orchestratorIdentity.operationalHandle,
      runtimeSessionId: this.orchestratorIdentity.runtimeSessionId || undefined,
      aliases: this.orchestratorIdentity.aliases,
      role: 'orchestrator' as const,
      platform: 'master-clock',
    };
  }

  private getAgentEnvelopeIdentity(sourceOrAgentId: string) {
    const agent =
      this.registry.getAgent(sourceOrAgentId) || this.registry.getAgentBySource(sourceOrAgentId);

    if (!agent) {
      return {
        agentId: sourceOrAgentId,
        operationalHandle: sourceOrAgentId,
        runtimeSessionId: sourceOrAgentId,
        aliases: [sourceOrAgentId],
        role: 'worker' as const,
      };
    }

    return {
      agentId: agent.sourceId,
      canonicalEntityId: agent.canonicalEntityId || undefined,
      operationalHandle: agent.operationalHandle,
      runtimeSessionId: agent.runtimeSessionId || undefined,
      aliases: agent.aliases,
      role: 'worker' as const,
      platform: agent.platform,
    };
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

    this.taskScheduler.stopTaskPolling();
    await this.superCycleScheduler.shutdown();

    // Broadcast shutdown
    for (const channel of CONFIG.CHANNELS) {
      this.channelManager.broadcastToChannel(
        channel,
        '🔴 ORCHESTRATOR GOING OFFLINE. Sessions may be affected.'
      );
    }

    // Give time for final messages
    await new Promise((r) => setTimeout(r, 1000));

    this.relayConnectionManager.close();

    await this.redisClient.quit();

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
