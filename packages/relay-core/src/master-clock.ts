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

import { randomUUID } from 'crypto';
import { existsSync, promises as fs } from 'fs';
import { execFile } from 'node:child_process';
import path from 'path';
import { createClient } from 'redis';
import { promisify } from 'util';
import WebSocket from 'ws';
import { createTNFEnvelope } from './protocol/tnf-envelope';

const execFileAsync = promisify(execFile);

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
  RELAY_URL: process.env.RELAY_URL || 'ws://localhost:3000/ws',
  REDIS_URL: process.env.REDIS_URL,
  LEDGER_API_BASE:
    process.env.LEDGER_API_BASE ||
    process.env.RAILWAY_API_URL ||
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
  taskPolls: number;
  tasksQueued: number;
}

interface ChannelData {
  members: Set<string>;
  lastActivity: number;
  messageCount: number;
}

interface ScheduledProcess {
  processId: string;
  name: string;
  kind: string;
  owner: string;
  status: string;
  registeredAt: number;
  lastHeartbeat: number;
  lastRunAt?: number;
  lastResult?: string;
  intendedIntervalMs?: number;
  intervalSource?: 'producer' | 'metadata' | 'inferred';
  intervalExact?: boolean;
  nextExpectedAt?: number;
  metadata: Record<string, any>;
  stale: boolean;
  heartbeatCount: number;
}

interface ChronologicalCatalogEntry {
  title: string;
  cadence: string;
  timezone: string;
  description: string;
  runNow: {
    command: string;
    args: string[];
    timeoutMs: number;
  } | null;
  docs?: {
    protocol?: string;
    runbook?: string;
  };
  metadata?: Record<string, any>;
}

interface ChronologicalProcessSnapshot {
  processId: string;
  title: string;
  cadence: string;
  timezone: string;
  enabled: boolean;
  runNow: ChronologicalCatalogEntry['runNow'];
  owner: string;
  scope: string;
  category: string;
  runtime: Record<string, any>;
  metadata: Record<string, any>;
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
  scheduledProcesses: Map<string, ScheduledProcess>;
  recoveryAttempts: Map<string, number>;
  metrics: Metrics;
  reconnectTimer: NodeJS.Timeout | null = null;
  taskPollingInterval: NodeJS.Timeout | null = null;
  chronologicalPollingInterval: NodeJS.Timeout | null = null;
  recentQueuedTasks: Map<string, number>;
  selfPromptCooldowns: Map<string, number>;
  taskPollFailureCount: number;
  repoRoot: string;
  dtfCache: Map<string, Intl.DateTimeFormat>;

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
    this.scheduledProcesses = new Map();
    this.recoveryAttempts = new Map(); // agentId -> attempts
    this.metrics = {
      heartbeatsSent: 0,
      stallsDetected: 0,
      recoveryAttempts: 0,
      messagesProcessed: 0,
      agentsOnboarded: 0,
      taskPolls: 0,
      tasksQueued: 0,
    };
    this.recentQueuedTasks = new Map();
    this.selfPromptCooldowns = new Map();
    this.taskPollFailureCount = 0;
    this.repoRoot = this.resolveRepoRoot();
    this.dtfCache = new Map();
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
      this.startTaskPolling();
      this.startChronologicalPolling();

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
    const superCycleStats = this.getSuperCycleStats();

    // Heartbeat to relay
    this.send({
      type: 'HEARTBEAT',
      payload: {
        sessionId: this.sessionId,
        role: 'ORCHESTRATOR',
        timestamp: now,
        stats,
        superCycle: superCycleStats,
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
            superCycle: superCycleStats,
            isActive: true,
          })
        )
        .catch(() => {});

      this.persistSuperCycleState(now).catch(() => {});
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

  startTaskPolling() {
    if (!this.redis || this.taskPollingInterval) return;

    log(
      'info',
      'TASK-POLL',
      `Starting vote-aware task polling (every ${CONFIG.TASK_POLL_INTERVAL_MS}ms)`
    );

    const run = () => {
      void this.pollAndQueueTasks().catch((error: any) => {
        this.taskPollFailureCount += 1;
        if (this.taskPollFailureCount <= 3 || this.taskPollFailureCount % 10 === 0) {
          log(
            'warn',
            'TASK-POLL',
            `Task polling failed (${this.taskPollFailureCount}): ${error.message || String(error)}`
          );
        }
      });
    };

    this.taskPollingInterval = setInterval(run, CONFIG.TASK_POLL_INTERVAL_MS);
    run();
  }

  private taskPriorityWeight(priority: string): number {
    const normalized = String(priority || 'medium').toLowerCase();
    // Preserve historical TNF aliases (P0-P3, normal) across legacy producers.
    if (normalized === 'p0' || normalized === 'urgent') return 500;
    if (normalized === 'critical') return 400;
    if (normalized === 'p1' || normalized === 'high') return 300;
    if (normalized === 'p3' || normalized === 'low') return 100;
    if (normalized === 'normal' || normalized === 'p2') return 200;
    return 200;
  }

  private itineraryLaneWeight(lane: string): number {
    const normalized = String(lane || '').toLowerCase();
    if (normalized === 'realtime_broker_routing') return 350;
    if (
      normalized === 'relay_federation' ||
      normalized === 'redis_sync' ||
      normalized === 'tauri_sync'
    )
      return 300;
    if (normalized === 'directive') return 250;
    if (normalized === 'kanban_delivery') return 150;
    if (normalized === 'changelog_suggestion') return 120;
    if (normalized === 'suggestion_vote') return 80;
    return 100;
  }

  private horizonWeight(horizon: string): number {
    const normalized = String(horizon || '').toLowerCase();
    if (normalized === 'realtime') return 200;
    if (normalized === 'short_term') return 120;
    if (normalized === 'medium_term') return 60;
    if (normalized === 'long_term') return 20;
    return 40;
  }

  private isRealtimeDispatchCandidate(task: any): boolean {
    const lane = String(task?.itinerary?.lane || '').toLowerCase();
    return [
      'realtime_broker_routing',
      'relay_federation',
      'redis_sync',
      'tauri_sync',
      'directive',
    ].includes(lane);
  }

  private targetQueueForTask(task: any): string {
    const lane = String(task?.itinerary?.lane || '').toLowerCase();
    if (lane === 'suggestion_vote') return CONFIG.REDIS_KEYS.SUGGESTIONS;
    if (lane === 'changelog_suggestion') return CONFIG.REDIS_KEYS.CHANGELOG;
    if (lane === 'kanban_delivery') return CONFIG.REDIS_KEYS.KANBAN;
    if (this.isRealtimeDispatchCandidate(task)) return CONFIG.REDIS_KEYS.TASKS_REALTIME;
    return CONFIG.REDIS_KEYS.TASKS_PLANNING;
  }

  private taskDispatchScore(task: any): number {
    const up = Number(task?.votes?.up || 0);
    const down = Number(task?.votes?.down || 0);
    const netVotes = up - down;
    const priority = this.taskPriorityWeight(task?.priority || 'medium');
    const laneWeight = this.itineraryLaneWeight(task?.itinerary?.lane || '');
    const horizonWeight = this.horizonWeight(task?.itinerary?.horizon || '');
    const createdAt = Date.parse(String(task?.createdAt || task?.updatedAt || Date.now()));
    const ageMinutes = Math.max(0, Math.floor((Date.now() - createdAt) / 60000));
    const freshnessBonus = Math.max(0, 120 - ageMinutes); // fades over ~2 hours
    return priority + laneWeight + horizonWeight + netVotes * 25 + up * 5 + freshnessBonus;
  }

  private async fetchLedgerTasks(): Promise<any[]> {
    const base = CONFIG.LEDGER_API_BASE.replace(/\/$/, '');
    const urls = [
      `${base}/api/unified-ledger/records?kind=task`,
      `${base}/unified-ledger/records?kind=task`,
    ];

    let lastError: string | null = null;
    for (const url of urls) {
      try {
        const response = await fetch(url, { method: 'GET' });
        if (!response.ok) {
          lastError = `HTTP ${response.status} (${url})`;
          continue;
        }
        const rows = (await response.json()) as any[];
        return Array.isArray(rows) ? rows : [];
      } catch (error) {
        lastError = `${(error as Error).message || String(error)} (${url})`;
      }
    }

    throw new Error(`Ledger poll failed: ${lastError || 'unknown error'}`);
  }

  private async pollAndQueueTasks(): Promise<void> {
    if (!this.redis) return;

    const rows = await this.fetchLedgerTasks();
    this.taskPollFailureCount = 0;
    const actionable = (Array.isArray(rows) ? rows : []).filter((task) => {
      const status = String(task?.status || '').toLowerCase();
      return (
        ['submitted', 'queued', 'under_review', 'in_progress'].includes(status) &&
        this.isRealtimeDispatchCandidate(task)
      );
    });

    const ranked = actionable
      .map((task) => ({ task, score: this.taskDispatchScore(task) }))
      .sort((a, b) => b.score - a.score)
      .slice(0, CONFIG.TASK_QUEUE_BATCH_SIZE);

    this.metrics.taskPolls += 1;
    await this.emitActivityEvent('task_poll_ranked', `Ranked ${ranked.length} tasks for dispatch`, {
      pollCount: this.metrics.taskPolls,
      candidateCount: actionable.length,
      top: ranked.map((r) => ({
        id: r.task?.id,
        title: r.task?.title,
        score: r.score,
        votes: r.task?.votes || { up: 0, down: 0 },
        priority: r.task?.priority || 'medium',
        itinerary: r.task?.itinerary || {},
      })),
    });

    const now = Date.now();
    for (const rankedTask of ranked) {
      const task = rankedTask.task || {};
      const taskId = String(task.id || '');
      if (!taskId) continue;

      const lastQueuedAt = this.recentQueuedTasks.get(taskId) || 0;
      if (now - lastQueuedAt < CONFIG.TASK_QUEUE_COOLDOWN_MS) {
        continue;
      }

      const queueItem = {
        id: taskId,
        title: String(task.title || `Task ${taskId}`),
        description: String(task.description || ''),
        priority: String(task.priority || 'medium'),
        status: String(task.status || 'queued'),
        votes: task.votes || { up: 0, down: 0 },
        score: rankedTask.score,
        source: 'unified-ledger-poll',
        itinerary: task.itinerary || {
          lane: 'realtime_broker_routing',
          horizon: 'realtime',
          coordinationMode: 'brokered',
          signalSources: ['redis'],
          sequencingKey: taskId,
          clockSource: 'master-clock',
        },
        createdAt: task.createdAt || new Date().toISOString(),
      };

      const targetQueue = this.targetQueueForTask(task);
      await this.redis.lPush(targetQueue, JSON.stringify(queueItem));
      // Backward compatibility for existing consumers.
      await this.redis.lPush(CONFIG.REDIS_KEYS.TASKS, JSON.stringify(queueItem));
      this.recentQueuedTasks.set(taskId, now);
      this.metrics.tasksQueued += 1;

      await this.emitActivityEvent(
        'task_queued_from_votes',
        `Queued task ${taskId} (${queueItem.title}) with score ${rankedTask.score}`,
        {
          taskId,
          score: rankedTask.score,
          votes: queueItem.votes,
          priority: queueItem.priority,
          targetQueue,
          lane: queueItem.itinerary?.lane,
          tasksQueued: this.metrics.tasksQueued,
        }
      );
    }
  }

  private async emitActivityEvent(
    eventType: string,
    content: string,
    metadata: Record<string, unknown>
  ): Promise<void> {
    this.send({
      type: 'MESSAGE_SEND',
      channel: 'fuse-activity-log',
      payload: {
        to: 'broadcast',
        content,
        messageType: 'event',
        metadata: {
          isSystemMessage: true,
          source: 'ORCHESTRATOR',
          eventType,
          activityChannel: 'General',
          sessionId: this.sessionId,
          ...metadata,
        },
      },
    });

    if (!this.redis) return;
    try {
      await this.redis.lPush(
        CONFIG.REDIS_KEYS.LOGS,
        JSON.stringify({
          timestamp: new Date().toISOString(),
          sessionId: this.sessionId,
          eventType,
          content,
          metadata,
        })
      );
      await this.redis.lTrim(CONFIG.REDIS_KEYS.LOGS, 0, 999);
    } catch {
      // non-fatal
    }
  }

  startChronologicalPolling() {
    if (this.chronologicalPollingInterval) return;

    log(
      'info',
      'CHRONO',
      `Starting chronological scheduler poller (every ${CONFIG.CHRONOLOGICAL_POLL_INTERVAL_MS}ms)`
    );

    const run = () => {
      void this.pollAndRunChronologicalProcesses().catch((error: any) => {
        log(
          'warn',
          'CHRONO',
          `Chronological scheduler poll failed: ${error.message || String(error)}`
        );
      });
    };

    this.chronologicalPollingInterval = setInterval(run, CONFIG.CHRONOLOGICAL_POLL_INTERVAL_MS);
    run();
  }

  private async pollAndRunChronologicalProcesses(): Promise<void> {
    const snapshots = await this.loadChronologicalProcessSnapshots();
    const now = new Date();

    for (const snapshot of snapshots) {
      this.handleSuperCycleHeartbeat({
        payload: {
          processId: snapshot.processId,
          name: snapshot.title,
          kind: 'chronological-job',
          owner: snapshot.owner,
          status: snapshot.enabled ? 'scheduled' : 'paused',
          lastHeartbeat: now.toISOString(),
          lastRunAt: snapshot.runtime?.lastRunAt || null,
          nextExpectedAt: snapshot.enabled
            ? this.getNextRunAt(snapshot.cadence, snapshot.timezone, now)
            : null,
          metadata: {
            ...snapshot.metadata,
            cadence: snapshot.cadence,
            timezone: snapshot.timezone,
            scope: snapshot.scope,
            category: snapshot.category,
            governanceSource: 'chronological-registry',
            intendedIntervalMs: this.deriveCadenceIntervalMs(snapshot.cadence),
          },
        },
      });
    }

    const due = snapshots.filter((snapshot) => this.shouldRunChronologicalProcess(snapshot, now));
    for (const snapshot of due) {
      await this.executeChronologicalProcess(snapshot);
    }
  }

  private async loadChronologicalProcessSnapshots(): Promise<ChronologicalProcessSnapshot[]> {
    const registryPath = path.join(this.repoRoot, 'data', 'protocols', 'cron-jobs.registry.json');
    const statePath = path.join(
      this.repoRoot,
      'data',
      'protocols',
      'cron-jobs.control-plane-state.json'
    );
    const catalogPath = path.join(
      this.repoRoot,
      'data',
      'protocols',
      'chronological-process-catalog.json'
    );

    const registryRaw = await fs
      .readFile(registryPath, 'utf8')
      .then((value) => JSON.parse(value))
      .catch(() => ({ jobs: [] }));
    const stateRaw = await fs
      .readFile(statePath, 'utf8')
      .then((value) => JSON.parse(value))
      .catch(() => ({ overrides: {}, runtime: {} }));
    const catalogRaw = await fs
      .readFile(catalogPath, 'utf8')
      .then((value) => JSON.parse(value))
      .catch(() => ({ entries: {} }));

    const jobs = Array.isArray(registryRaw.jobs) ? registryRaw.jobs : [];
    const overrides = stateRaw.overrides || {};
    const runtime = stateRaw.runtime || {};
    const entries = catalogRaw.entries || {};

    return jobs
      .map((job: any) => {
        const catalogEntry = entries[job.schedule_id] as ChronologicalCatalogEntry | undefined;
        if (!catalogEntry) return null;
        const override = overrides[job.schedule_id] || {};
        return {
          processId: job.schedule_id,
          title: catalogEntry.title,
          cadence: override.cadence || catalogEntry.cadence,
          timezone: override.timezone || catalogEntry.timezone || 'UTC',
          enabled: override.enabled ?? true,
          runNow: catalogEntry.runNow,
          owner: job.owner_agent_id || 'unknown',
          scope: job.scope || 'tenant',
          category: job.category || 'tenant_automation',
          runtime: runtime[job.schedule_id] || {},
          metadata: catalogEntry.metadata || {},
        } satisfies ChronologicalProcessSnapshot;
      })
      .filter(Boolean) as ChronologicalProcessSnapshot[];
  }

  private shouldRunChronologicalProcess(
    snapshot: ChronologicalProcessSnapshot,
    now: Date
  ): boolean {
    if (!snapshot.enabled || !snapshot.runNow) return false;

    const normalizedCadence = this.normalizeCronExpression(snapshot.cadence);
    if (!normalizedCadence || normalizedCadence === 'manual') return false;

    const lastRunAtMs = this.parseTimestampMs(snapshot.runtime?.lastRunAt);
    if (snapshot.runtime?.status === 'running' && lastRunAtMs) {
      const lockWindowMs = Math.max(
        Number(snapshot.runNow.timeoutMs || 30000) * 2,
        CONFIG.CHRONOLOGICAL_POLL_INTERVAL_MS * 2
      );
      if (Date.now() - lastRunAtMs < lockWindowMs) {
        return false;
      }
    }

    const currentSlot = this.getScheduleSlot(now, normalizedCadence, snapshot.timezone);
    if (!currentSlot.matches || !currentSlot.key) return false;

    if (!lastRunAtMs) return true;
    const lastRunSlot = this.getScheduleSlot(
      new Date(lastRunAtMs),
      normalizedCadence,
      snapshot.timezone
    );
    return currentSlot.key !== lastRunSlot.key;
  }

  private async executeChronologicalProcess(snapshot: ChronologicalProcessSnapshot): Promise<void> {
    const runnerPath = path.join(
      this.repoRoot,
      'scripts',
      'protocols',
      'run-chronological-process.cjs'
    );
    const startedAt = new Date().toISOString();
    let status = 'healthy';
    let lastResult = 'ok';

    try {
      const result = await execFileAsync(
        'node',
        [runnerPath, '--process-id', snapshot.processId, '--actor-id', 'tnf-master-clock'],
        {
          cwd: this.repoRoot,
          timeout: Number(snapshot.runNow?.timeoutMs || 30000) + 5000,
          maxBuffer: 1024 * 1024 * 2,
          env: process.env,
        }
      );
      const parsed = this.parseJsonOutput(result.stdout);
      if (parsed?.run?.status) {
        status = parsed.run.status;
        lastResult = status;
      }
      await this.emitActivityEvent(
        'chronological_process_executed',
        `Executed chronological process ${snapshot.processId}`,
        {
          processId: snapshot.processId,
          title: snapshot.title,
          status,
        }
      );
    } catch (error: any) {
      status = 'error';
      lastResult = error.message || 'execution_failed';
      log(
        'warn',
        'CHRONO',
        `Chronological execution failed for ${snapshot.processId}: ${lastResult}`
      );
      await this.emitActivityEvent(
        'chronological_process_error',
        `Chronological process ${snapshot.processId} failed`,
        {
          processId: snapshot.processId,
          title: snapshot.title,
          error: lastResult,
        }
      );
    }

    this.handleSuperCycleHeartbeat({
      payload: {
        processId: snapshot.processId,
        name: snapshot.title,
        kind: 'chronological-job',
        owner: snapshot.owner,
        status,
        lastHeartbeat: new Date().toISOString(),
        lastRunAt: startedAt,
        lastResult,
        nextExpectedAt: this.getNextRunAt(snapshot.cadence, snapshot.timezone, new Date()),
        metadata: {
          ...snapshot.metadata,
          cadence: snapshot.cadence,
          timezone: snapshot.timezone,
          scope: snapshot.scope,
          category: snapshot.category,
          governanceSource: 'chronological-registry',
          intendedIntervalMs: this.deriveCadenceIntervalMs(snapshot.cadence),
        },
      },
    });
  }

  private parseJsonOutput(stdout: string | undefined): Record<string, any> | null {
    try {
      return stdout ? JSON.parse(stdout) : null;
    } catch {
      return null;
    }
  }

  private deriveCadenceIntervalMs(cadence: string): number | undefined {
    const normalized = this.normalizeCronExpression(cadence);
    if (!normalized || normalized === 'manual') return undefined;
    if (normalized === '0 * * * *') return 60 * 60 * 1000;
    if (normalized === '*/10 * * * *') return 10 * 60 * 1000;
    if (normalized === '*/15 * * * *') return 15 * 60 * 1000;
    if (normalized === '*/30 * * * *') return 30 * 60 * 1000;
    if (normalized === '0 */2 * * *') return 2 * 60 * 60 * 1000;
    if (normalized === '0 */4 * * *') return 4 * 60 * 60 * 1000;
    if (normalized === '0 */6 * * *') return 6 * 60 * 60 * 1000;
    if (normalized === '0 0 * * *') return 24 * 60 * 60 * 1000;
    return undefined;
  }

  private getScheduleSlot(date: Date, cadence: string, timezone: string) {
    const normalized = this.normalizeCronExpression(cadence);
    if (!normalized || normalized === 'manual') {
      return { matches: false, key: null };
    }

    const fields = normalized.split(/\s+/).filter(Boolean);
    if (fields.length !== 5) {
      return { matches: false, key: null };
    }

    const [minuteExpr, hourExpr, dayExpr, monthExpr, weekdayExpr] = fields;
    const parts = this.getZonedDateParts(date, timezone);
    const minuteMatch = this.matchesCronField(parts.minute, minuteExpr, 0, 59);
    const hourMatch = this.matchesCronField(parts.hour, hourExpr, 0, 23);
    const monthMatch = this.matchesCronField(parts.month, monthExpr, 1, 12, this.monthNameMap());
    const dayMatch = this.matchesCronField(parts.day, dayExpr, 1, 31);
    const weekdayMatch = this.matchesCronField(
      parts.weekday,
      weekdayExpr,
      0,
      7,
      this.weekdayNameMap(),
      true
    );

    const dayIsWildcard = dayExpr.trim() === '*';
    const weekdayIsWildcard = weekdayExpr.trim() === '*';
    const dayConstraintMatch =
      dayIsWildcard || weekdayIsWildcard ? dayMatch && weekdayMatch : dayMatch || weekdayMatch;

    const matches = minuteMatch && hourMatch && monthMatch && dayConstraintMatch;
    return {
      matches,
      key: matches
        ? `${this.safeTimezone(timezone)}:${parts.year}-${String(parts.month).padStart(2, '0')}-${String(parts.day).padStart(2, '0')}:${String(parts.hour).padStart(2, '0')}:${String(parts.minute).padStart(2, '0')}`
        : null,
    };
  }

  private getNextRunAt(cadence: string, timezone: string, fromDate = new Date()): string | null {
    const normalized = this.normalizeCronExpression(cadence);
    if (!normalized || normalized === 'manual') return null;

    const probe = new Date(fromDate.getTime());
    probe.setSeconds(0, 0);
    probe.setMinutes(probe.getMinutes() + 1);
    const maxIterations = 60 * 24 * 31;
    for (let i = 0; i < maxIterations; i += 1) {
      const slot = this.getScheduleSlot(probe, normalized, timezone);
      if (slot.matches) {
        return probe.toISOString();
      }
      probe.setMinutes(probe.getMinutes() + 1);
    }
    return null;
  }

  private normalizeCronExpression(cadence: string): string | null {
    const raw = String(cadence || '').trim();
    if (!raw) return null;
    if (raw.toLowerCase() === 'manual') return 'manual';

    const preset = raw.toLowerCase();
    const presetMap: Record<string, string> = {
      '@yearly': '0 0 1 1 *',
      '@annually': '0 0 1 1 *',
      '@monthly': '0 0 1 * *',
      '@weekly': '0 0 * * 0',
      '@daily': '0 0 * * *',
      '@hourly': '0 * * * *',
      '@reboot': 'manual',
    };
    if (presetMap[preset]) return presetMap[preset];

    const tokens = raw.split(/\s+/).filter(Boolean);
    if (tokens.length === 5) return tokens.join(' ');
    if (tokens.length === 6) return tokens.slice(1).join(' ');
    if (tokens.length === 7) return tokens.slice(1, 6).join(' ');
    return null;
  }

  private getZonedDateParts(date: Date, timezone: string) {
    const resolvedTimezone = this.safeTimezone(timezone);
    const cacheKey = `tz:${resolvedTimezone}`;
    let formatter = this.dtfCache.get(cacheKey);
    if (!formatter) {
      formatter = new Intl.DateTimeFormat('en-US', {
        timeZone: resolvedTimezone,
        hour12: false,
        year: 'numeric',
        month: 'numeric',
        day: 'numeric',
        hour: 'numeric',
        minute: 'numeric',
        weekday: 'short',
      });
      this.dtfCache.set(cacheKey, formatter);
    }

    const parts = formatter.formatToParts(date);
    const getNumber = (type: string): number => {
      const part = parts.find((entry) => entry.type === type)?.value || '0';
      const parsed = Number.parseInt(part, 10);
      return Number.isFinite(parsed) ? parsed : 0;
    };
    const weekdayName = (parts.find((entry) => entry.type === 'weekday')?.value || 'Sun')
      .slice(0, 3)
      .toLowerCase();

    return {
      year: getNumber('year'),
      month: getNumber('month'),
      day: getNumber('day'),
      hour: getNumber('hour'),
      minute: getNumber('minute'),
      weekday: this.weekdayNameMap()[weekdayName] ?? 0,
    };
  }

  private safeTimezone(input: string): string {
    try {
      const normalized = String(input || '').trim() || 'UTC';
      Intl.DateTimeFormat('en-US', { timeZone: normalized });
      return normalized;
    } catch {
      return 'UTC';
    }
  }

  private monthNameMap(): Record<string, number> {
    return {
      jan: 1,
      feb: 2,
      mar: 3,
      apr: 4,
      may: 5,
      jun: 6,
      jul: 7,
      aug: 8,
      sep: 9,
      oct: 10,
      nov: 11,
      dec: 12,
    };
  }

  private weekdayNameMap(): Record<string, number> {
    return {
      sun: 0,
      mon: 1,
      tue: 2,
      wed: 3,
      thu: 4,
      fri: 5,
      sat: 6,
    };
  }

  private matchesCronField(
    value: number,
    expression: string,
    min: number,
    max: number,
    names?: Record<string, number>,
    normalizeSevenToZero = false
  ): boolean {
    const raw = String(expression || '')
      .trim()
      .toLowerCase();
    if (!raw || raw === '*') return true;

    const parts = raw.split(',');
    for (const part of parts) {
      if (this.matchesCronSegment(value, part.trim(), min, max, names, normalizeSevenToZero)) {
        return true;
      }
    }
    return false;
  }

  private matchesCronSegment(
    value: number,
    segment: string,
    min: number,
    max: number,
    names?: Record<string, number>,
    normalizeSevenToZero = false
  ): boolean {
    if (!segment) return false;

    const [rangeToken, stepToken] = segment.split('/');
    const step = stepToken ? Number.parseInt(stepToken, 10) : 1;
    if (!Number.isFinite(step) || step <= 0) return false;

    if (rangeToken === '*') {
      return (value - min) % step === 0;
    }

    if (rangeToken.includes('-')) {
      const [startToken, endToken] = rangeToken.split('-');
      const start = this.parseCronToken(startToken, names, normalizeSevenToZero);
      const end = this.parseCronToken(endToken, names, normalizeSevenToZero);
      if (start === null || end === null || start > end) return false;
      if (start < min || end > max || value < start || value > end) return false;
      return (value - start) % step === 0;
    }

    const single = this.parseCronToken(rangeToken, names, normalizeSevenToZero);
    if (single === null || single < min || single > max) return false;
    return value === single;
  }

  private parseCronToken(
    token: string,
    names?: Record<string, number>,
    normalizeSevenToZero = false
  ): number | null {
    const cleaned = String(token || '')
      .trim()
      .toLowerCase();
    if (!cleaned) return null;
    if (names && cleaned in names) return names[cleaned];
    const parsed = Number.parseInt(cleaned, 10);
    if (!Number.isFinite(parsed)) return null;
    if (normalizeSevenToZero && parsed === 7) return 0;
    return parsed;
  }

  private resolveRepoRoot(): string {
    const marker = path.join('data', 'protocols', 'chronological-process-catalog.json');
    let current = process.cwd();
    for (let i = 0; i < 8; i += 1) {
      if (existsSync(path.join(current, marker))) {
        return current;
      }
      const next = path.dirname(current);
      if (next === current) break;
      current = next;
    }
    return process.cwd();
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

    this.checkForStaleScheduledProcesses();
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

    void this.emitSelfPrompt({
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
        this.handleChannelCreate(normalized);
        break;
      case 'SUPER_CYCLE_REGISTER':
        this.handleSuperCycleRegistration(normalized);
        break;
      case 'SUPER_CYCLE_HEARTBEAT':
        this.handleSuperCycleHeartbeat(normalized);
        break;
      case 'SUPER_CYCLE_UNREGISTER':
        this.handleSuperCycleUnregister(normalized);
        break;
      case 'WELCOME':
        log('debug', 'RELAY', 'Welcome received', { clientId: normalized.clientId });
        break;
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

  handleSuperCycleRegistration(msg: any) {
    const payload = msg.payload || {};
    const processId = payload.processId || payload.name || msg.source;
    if (!processId) return;

    const existing = this.scheduledProcesses.get(processId);
    const now = Date.now();
    const metadata = { ...(existing?.metadata || {}), ...(payload.metadata || {}) };
    const lastHeartbeat = this.parseTimestampMs(payload.lastHeartbeat) || now;
    const lastRunAt = this.parseTimestampMs(payload.lastRunAt) || existing?.lastRunAt;
    const interval = this.resolveScheduledProcessInterval(payload, metadata, existing);
    const nextExpectedAt =
      this.resolveNextExpectedAt(
        payload,
        lastRunAt || lastHeartbeat,
        interval.intendedIntervalMs
      ) || existing?.nextExpectedAt;
    const next: ScheduledProcess = {
      processId,
      name: payload.name || existing?.name || processId,
      kind: payload.kind || existing?.kind || 'scheduled-job',
      owner: payload.owner || existing?.owner || 'unknown',
      status: payload.status || existing?.status || 'registered',
      registeredAt: existing?.registeredAt || now,
      lastHeartbeat,
      lastRunAt,
      lastResult: payload.lastResult || existing?.lastResult,
      intendedIntervalMs: interval.intendedIntervalMs,
      intervalSource: interval.intervalSource,
      intervalExact: interval.intervalExact,
      nextExpectedAt,
      metadata,
      stale: false,
      heartbeatCount: (existing?.heartbeatCount || 0) + 1,
    };

    this.scheduledProcesses.set(processId, next);
    log('info', 'SUPER-CYCLE', `Registered process ${processId}`, {
      processId,
      kind: next.kind,
      owner: next.owner,
    });
    void this.emitActivityEvent(
      'super_cycle_process_registered',
      `Registered scheduled process ${processId}`,
      {
        processId,
        status: next.status,
        kind: next.kind,
        owner: next.owner,
        intendedIntervalMs: next.intendedIntervalMs || null,
        intervalSource: next.intervalSource || 'inferred',
        intervalExact: Boolean(next.intervalExact),
        lastRunAt: next.lastRunAt ? new Date(next.lastRunAt).toISOString() : null,
        nextExpectedAt: next.nextExpectedAt ? new Date(next.nextExpectedAt).toISOString() : null,
      }
    );
  }

  handleSuperCycleHeartbeat(msg: any) {
    const payload = msg.payload || {};
    const processId = payload.processId || payload.name || msg.source;
    if (!processId) return;

    const existing = this.scheduledProcesses.get(processId);
    if (!existing) {
      this.handleSuperCycleRegistration({
        ...msg,
        payload: { ...payload, processId, status: payload.status || 'running' },
      });
      return;
    }

    const metadata = { ...existing.metadata, ...(payload.metadata || {}) };
    const interval = this.resolveScheduledProcessInterval(payload, metadata, existing);
    const heartbeatTimestamp = this.parseTimestampMs(payload.lastHeartbeat) || Date.now();
    const lastRunAt = this.parseTimestampMs(payload.lastRunAt) || existing.lastRunAt;
    const nextExpectedAt =
      this.resolveNextExpectedAt(
        payload,
        lastRunAt || heartbeatTimestamp,
        interval.intendedIntervalMs || existing.intendedIntervalMs
      ) || existing.nextExpectedAt;

    existing.lastHeartbeat = heartbeatTimestamp;
    existing.status = payload.status || existing.status || 'running';
    existing.lastRunAt = lastRunAt;
    existing.lastResult = payload.lastResult || existing.lastResult;
    existing.intendedIntervalMs = interval.intendedIntervalMs || existing.intendedIntervalMs;
    existing.intervalSource = interval.intervalSource;
    existing.intervalExact = interval.intervalExact;
    existing.nextExpectedAt = nextExpectedAt;
    existing.metadata = metadata;
    existing.stale = false;
    existing.heartbeatCount += 1;

    void this.emitActivityEvent('super_cycle_process_heartbeat', `Heartbeat for ${processId}`, {
      processId,
      status: existing.status,
      heartbeatCount: existing.heartbeatCount,
      intendedIntervalMs: existing.intendedIntervalMs || null,
      intervalSource: existing.intervalSource || 'inferred',
      intervalExact: Boolean(existing.intervalExact),
      lastRunAt: existing.lastRunAt ? new Date(existing.lastRunAt).toISOString() : null,
      nextExpectedAt: existing.nextExpectedAt
        ? new Date(existing.nextExpectedAt).toISOString()
        : null,
      lastResult: existing.lastResult || null,
    });
  }

  handleSuperCycleUnregister(msg: any) {
    const payload = msg.payload || {};
    const processId = payload.processId || payload.name || msg.source;
    if (!processId) return;

    const existing = this.scheduledProcesses.get(processId);
    if (this.scheduledProcesses.delete(processId)) {
      log('info', 'SUPER-CYCLE', `Unregistered process ${processId}`, { processId });
      void this.emitActivityEvent(
        'super_cycle_process_unregistered',
        `Unregistered scheduled process ${processId}`,
        {
          processId,
          intendedIntervalMs: existing?.intendedIntervalMs || null,
          intervalSource: existing?.intervalSource || 'inferred',
          intervalExact: Boolean(existing?.intervalExact),
          lastRunAt: existing?.lastRunAt ? new Date(existing.lastRunAt).toISOString() : null,
          nextExpectedAt: existing?.nextExpectedAt
            ? new Date(existing.nextExpectedAt).toISOString()
            : null,
          finalStatus: existing?.status || payload.status || 'unknown',
        }
      );
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

  checkForStaleScheduledProcesses() {
    const now = Date.now();
    for (const [processId, process] of this.scheduledProcesses) {
      const isStale = now - process.lastHeartbeat > CONFIG.SUPER_CYCLE_STALE_THRESHOLD;
      if (isStale && !process.stale) {
        process.stale = true;
        process.status = 'stalled';
        log('warn', 'SUPER-CYCLE', `Scheduled process stale: ${processId}`, {
          processId,
          ageMs: now - process.lastHeartbeat,
        });
        void this.emitActivityEvent(
          'super_cycle_process_stale',
          `Scheduled process ${processId} marked stale`,
          {
            processId,
            ageMs: now - process.lastHeartbeat,
            staleThresholdMs: CONFIG.SUPER_CYCLE_STALE_THRESHOLD,
            intendedIntervalMs: process.intendedIntervalMs || null,
            intervalSource: process.intervalSource || 'inferred',
            intervalExact: Boolean(process.intervalExact),
            lastRunAt: process.lastRunAt ? new Date(process.lastRunAt).toISOString() : null,
            nextExpectedAt: process.nextExpectedAt
              ? new Date(process.nextExpectedAt).toISOString()
              : null,
          }
        );

        const processChannel = process.metadata?.channel || 'General';
        const prompt = `⏱️ [SELF-PROMPT] Scheduled process ${processId} is stale. Resume heartbeat and continue next actionable step immediately.`;
        this.broadcastToChannel(processChannel, prompt);
        void this.emitSelfPrompt({
          kind: 'process-stall',
          channel: processChannel,
          prompt,
          reason: 'scheduled_process_stalled',
          targetProcessId: processId,
          metadata: {
            ageMs: now - process.lastHeartbeat,
            staleThresholdMs: CONFIG.SUPER_CYCLE_STALE_THRESHOLD,
            processStatus: process.status,
          },
        });
      }
    }
  }

  async emitSelfPrompt(params: {
    kind: 'agent-stall' | 'process-stall';
    channel: string;
    prompt: string;
    reason: string;
    targetAgentId?: string;
    targetSourceId?: string;
    targetProcessId?: string;
    metadata?: Record<string, unknown>;
  }): Promise<void> {
    if (!CONFIG.SELF_PROMPT_ENABLED || !this.redis) {
      return;
    }

    const cooldownKey = `${params.kind}:${params.targetAgentId || params.targetProcessId || params.channel}`;
    const now = Date.now();
    const lastSentAt = this.selfPromptCooldowns.get(cooldownKey) || 0;
    if (now - lastSentAt < CONFIG.SELF_PROMPT_COOLDOWN_MS) {
      return;
    }
    this.selfPromptCooldowns.set(cooldownKey, now);
    const issuedAtIso = new Date(now).toISOString();
    const tenantId = process.env.TENANT_ID || 'tnf-local';
    const cumulativeId = {
      spec: 'tnf/mcid/0.1',
      id: randomUUID(),
      scope: {
        tenant_id: tenantId,
        session_key: this.sessionId,
        workflow_id: null,
        channel_id: params.channel,
      },
      lineage: {
        trace_id: null,
        correlation_id: randomUUID(),
        causation_id: null,
        handoff_packet_id: null,
        twid: null,
        task_id: null,
      },
      federation: {
        domain: tenantId,
        route: ['master-clock', 'self-prompt'],
        hop_count: 1,
        gate_decisions: [
          { gate: 'TENANT_SCOPE_GATE', decision: 'allow', at: issuedAtIso },
          { gate: 'TRACE_CONTINUITY_GATE', decision: 'allow', at: issuedAtIso },
          { gate: 'CHANNEL_MEMBERSHIP_GATE', decision: 'allow', at: issuedAtIso },
        ],
      },
      issued_at: issuedAtIso,
    };

    const originalMessage = {
      type: 'CHANNEL_MESSAGE',
      channel: params.channel,
      payload: {
        from: this.sessionId,
        to: 'broadcast',
        content: params.prompt,
        metadata: {
          isSystemMessage: true,
          isSelfPrompt: true,
          reason: params.reason,
          ...(params.metadata || {}),
        },
      },
    };

    const broadcastEnvelope = createTNFEnvelope(
      'event',
      { agentId: this.sessionId, role: 'orchestrator', platform: 'master-clock' },
      { broadcast: true },
      {
        eventType: 'SELF_PROMPT',
        data: {
          ...params,
          cumulativeId,
          issuedAt: now,
        },
        originalMessage,
      },
      {
        channelId: params.channel,
        sessionId: this.sessionId,
      }
    );

    try {
      await this.redis.publish(CONFIG.REDIS_KEYS.INGRESS, JSON.stringify(broadcastEnvelope));
      await this.redis.lPush(
        CONFIG.REDIS_KEYS.SELF_PROMPTS,
        JSON.stringify({
          sessionId: this.sessionId,
          ...params,
          cumulativeId,
          issuedAt: now,
        })
      );
      await this.redis.lTrim(CONFIG.REDIS_KEYS.SELF_PROMPTS, 0, 499);
    } catch (error: any) {
      log('warn', 'SELF-PROMPT', `Failed to publish self-prompt: ${error.message}`);
    }

    if (params.targetSourceId) {
      const directEnvelope = createTNFEnvelope(
        'task',
        { agentId: this.sessionId, role: 'orchestrator', platform: 'master-clock' },
        { agentId: params.targetSourceId, role: 'worker' },
        {
          action: 'self_prompt_continue',
          parameters: {
            prompt: params.prompt,
            reason: params.reason,
            channel: params.channel,
            cumulativeId,
            ...(params.metadata || {}),
          },
          priority: 'high',
        },
        {
          channelId: params.channel,
          sessionId: this.sessionId,
        }
      );

      try {
        await this.redis.publish(
          `${CONFIG.REDIS_KEYS.EGRESS_PREFIX}:${params.targetSourceId}`,
          JSON.stringify(directEnvelope)
        );
      } catch (error: any) {
        log(
          'warn',
          'SELF-PROMPT',
          `Failed targeted self-prompt publish for ${params.targetSourceId}: ${error.message}`
        );
      }
    }

    log('info', 'SELF-PROMPT', `Self-prompt issued (${params.kind})`, {
      channel: params.channel,
      targetAgentId: params.targetAgentId,
      targetProcessId: params.targetProcessId,
      reason: params.reason,
    });
  }

  getSuperCycleStats() {
    const processes = Array.from(this.scheduledProcesses.values());
    return {
      total: processes.length,
      healthy: processes.filter((p) => !p.stale).length,
      stale: processes.filter((p) => p.stale).length,
    };
  }

  async persistSuperCycleState(now: number) {
    if (!this.redis) return;

    const processes = Array.from(this.scheduledProcesses.values()).sort((a, b) =>
      a.processId.localeCompare(b.processId)
    );

    await this.redis.hSet(
      CONFIG.REDIS_KEYS.STATE,
      'superCycle',
      JSON.stringify({
        lastUpdated: now,
        staleThresholdMs: CONFIG.SUPER_CYCLE_STALE_THRESHOLD,
        stats: this.getSuperCycleStats(),
        processes,
      })
    );

    const processState: Record<string, string> = {};
    for (const process of processes) {
      processState[process.processId] = JSON.stringify(process);
    }

    await this.redis.del(CONFIG.REDIS_KEYS.SUPER_CYCLE);
    if (Object.keys(processState).length > 0) {
      await this.redis.hSet(CONFIG.REDIS_KEYS.SUPER_CYCLE, processState);
    }
  }

  private parseTimestampMs(value: unknown): number | undefined {
    if (typeof value === 'number' && Number.isFinite(value) && value > 0) {
      return value;
    }
    if (typeof value === 'string') {
      const isoValue = Date.parse(value);
      if (Number.isFinite(isoValue) && isoValue > 0) return isoValue;
      const numericValue = Number.parseInt(value, 10);
      if (Number.isFinite(numericValue) && numericValue > 0) return numericValue;
    }
    return undefined;
  }

  private readCadenceMs(source: Record<string, any> | undefined): number | undefined {
    if (!source || typeof source !== 'object') return undefined;
    const valueMs = Number(
      source.intendedIntervalMs ||
        source.expectedIntervalMs ||
        source.intervalMs ||
        source.heartbeatIntervalMs ||
        0
    );
    if (Number.isFinite(valueMs) && valueMs > 0) return valueMs;

    const valueSeconds = Number(
      source.intendedIntervalSeconds ||
        source.intervalSeconds ||
        source.heartbeatIntervalSeconds ||
        source.cadenceSeconds ||
        0
    );
    if (Number.isFinite(valueSeconds) && valueSeconds > 0) return valueSeconds * 1000;
    return undefined;
  }

  private resolveScheduledProcessInterval(
    payload: Record<string, any>,
    metadata: Record<string, any>,
    existing: ScheduledProcess | undefined
  ) {
    const producerInterval = this.readCadenceMs(payload);
    if (producerInterval) {
      return {
        intendedIntervalMs: producerInterval,
        intervalSource: 'producer' as const,
        intervalExact: true,
      };
    }

    const metadataInterval = this.readCadenceMs(metadata);
    if (metadataInterval) {
      return {
        intendedIntervalMs: metadataInterval,
        intervalSource: 'metadata' as const,
        intervalExact: true,
      };
    }

    if (existing?.intendedIntervalMs) {
      return {
        intendedIntervalMs: existing.intendedIntervalMs,
        intervalSource: existing.intervalSource || ('inferred' as const),
        intervalExact: Boolean(existing.intervalExact),
      };
    }

    return {
      intendedIntervalMs: undefined,
      intervalSource: 'inferred' as const,
      intervalExact: false,
    };
  }

  private resolveNextExpectedAt(
    payload: Record<string, any>,
    anchorMs: number | undefined,
    intervalMs: number | undefined
  ): number | undefined {
    const explicit = this.parseTimestampMs(payload.nextExpectedAt);
    if (explicit) return explicit;
    if (anchorMs && intervalMs && intervalMs > 0) {
      return anchorMs + intervalMs;
    }
    return undefined;
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
    if (this.taskPollingInterval) {
      clearInterval(this.taskPollingInterval);
    }
    if (this.chronologicalPollingInterval) {
      clearInterval(this.chronologicalPollingInterval);
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
