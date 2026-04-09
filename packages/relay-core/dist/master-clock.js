#!/usr/bin/env node
"use strict";
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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const crypto_1 = require("crypto");
const node_child_process_1 = require("node:child_process");
const fs_1 = require("fs");
const node_child_process_1 = require("node:child_process");
const path_1 = __importDefault(require("path"));
const redis_1 = require("redis");
const util_1 = require("util");
const ws_1 = __importDefault(require("ws"));
// @ts-ignore
const infrastructure_1 = require("@the-new-fuse/infrastructure");
const ioredis_1 = require("ioredis");
const audit_1 = require("./contracts/audit");
const identity_1 = require("./contracts/identity");
const lifecycle_1 = require("./contracts/lifecycle");
const tnf_envelope_1 = require("./protocol/tnf-envelope");
const execFileAsync = (0, util_1.promisify)(node_child_process_1.execFile);
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
    CHRONOLOGICAL_POLL_INTERVAL_MS: parseInt(process.env.CHRONOLOGICAL_POLL_INTERVAL_MS || '') || 30000, // 30 seconds
    // Connections
    RELAY_URL: process.env.RELAY_URL || 'ws://localhost:3000/ws',
    REDIS_URL: process.env.REDIS_URL,
    LEDGER_API_BASE: process.env.LEDGER_API_BASE ||
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
    LOG_DIR: process.env.LOG_DIR || path_1.default.join(process.env.HOME || '/tmp', '.tnf-master-clock'),
};
// ============================================================================
// LOGGING
// ============================================================================
const LOG_LEVELS = { debug: 0, info: 1, warn: 2, error: 3 };
const currentLogLevel = LOG_LEVELS[CONFIG.LOG_LEVEL] || 1;
function log(level, category, message, data = {}) {
    if (LOG_LEVELS[level] < currentLogLevel)
        return;
    const timestamp = new Date().toISOString();
    const prefix = {
        debug: '🔍',
        info: '📍',
        warn: '⚠️',
        error: '❌',
    }[level] || '📍';
    const entry = { timestamp, level, category, message, ...data };
    console.log(`${prefix} [${timestamp}] [${category}] ${message}`, data.agentId ? `(${data.agentId})` : '');
    // Also log to file asynchronously
    logToFile(entry).catch(() => { });
}
async function logToFile(entry) {
    try {
        await fs_1.promises.mkdir(CONFIG.LOG_DIR, { recursive: true });
        const logFile = path_1.default.join(CONFIG.LOG_DIR, `master-${new Date().toISOString().split('T')[0]}.jsonl`);
        await fs_1.promises.appendFile(logFile, JSON.stringify(entry) + '\n');
    }
    catch (e) {
        // Silently fail - log file not critical
    }
}
function createMasterClockAgentIdentity(sourceId, info, agentId, ordinal) {
    let canonicalEntityId = typeof info?.canonicalEntityId === 'string' ? info.canonicalEntityId : null;
    if (!canonicalEntityId) {
        try {
            canonicalEntityId = (0, identity_1.buildCanonicalEntityId)({
                category: 'AGENT',
                provider: typeof info?.platform === 'string' && info.platform.trim() ? info.platform : 'unknown',
                name: typeof info?.name === 'string' && info.name.trim() ? info.name : sourceId || agentId,
                instance: ordinal,
            });
        }
        catch {
            canonicalEntityId = null;
        }
    }
    return (0, identity_1.createAgentIdentityRecord)({
        canonicalEntityId,
        operationalHandle: agentId,
        runtimeSessionId: sourceId,
        aliases: [
            sourceId,
            typeof info?.name === 'string' ? info.name : null,
            typeof info?.operationalHandle === 'string' ? info.operationalHandle : null,
            ...(Array.isArray(info?.aliases) ? info.aliases : []),
        ],
    });
}
function createOrchestratorIdentity(sessionId) {
    let canonicalEntityId = null;
    try {
        canonicalEntityId = (0, identity_1.buildCanonicalEntityId)({
            category: 'AGENT',
            provider: 'TNF',
            name: 'MASTER_CLOCK',
            instance: 1,
        });
    }
    catch {
        canonicalEntityId = null;
    }
    return (0, identity_1.createAgentIdentityRecord)({
        canonicalEntityId,
        operationalHandle: 'ORCHESTRATOR',
        runtimeSessionId: sessionId,
        aliases: [sessionId, 'master-clock', 'tnf-master-clock'],
    });
}
class AgentRegistry {
    agents;
    nextAgentNumber;
    pendingOnboarding;
    constructor() {
        this.agents = new Map();
        this.nextAgentNumber = 1;
        this.pendingOnboarding = new Map();
    }
    assignAgentId(sourceId, info = {}) {
        // Check if already assigned
        for (const [id, agent] of this.agents) {
            if (agent.sourceId === sourceId) {
                return agent.agentId;
            }
        }
        // Generate new ID
        const agentNum = String(this.nextAgentNumber++).padStart(2, '0');
        const agentId = `AGENT-${agentNum}`;
        const identity = createMasterClockAgentIdentity(sourceId, info, agentId, this.nextAgentNumber - 1);
        const agent = {
            agentId,
            sourceId,
            canonicalEntityId: identity.canonicalEntityId,
            operationalHandle: identity.operationalHandle,
            runtimeSessionId: identity.runtimeSessionId,
            aliases: identity.aliases,
            platform: info.platform || 'unknown',
            name: info.name || `Agent ${agentNum}`,
            capabilities: info.capabilities || [],
            registeredAt: Date.now(),
            lastHeartbeat: Date.now(),
            lastActivity: Date.now(),
            status: (0, lifecycle_1.normalizeAgentLifecycleStatus)('active') || 'active',
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
    recordHeartbeat(agentId) {
        const agent = this.agents.get(agentId);
        if (agent) {
            agent.lastHeartbeat = Date.now();
            agent.status = (0, lifecycle_1.normalizeAgentLifecycleStatus)('active') || 'active';
        }
    }
    recordActivity(agentId) {
        const agent = this.agents.get(agentId);
        if (agent) {
            agent.lastActivity = Date.now();
            agent.messageCount++;
            agent.status = (0, lifecycle_1.normalizeAgentLifecycleStatus)('active') || 'active';
        }
    }
    recordViolation(agentId, type) {
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
    getAgent(agentId) {
        return this.agents.get(agentId);
    }
    getAgentBySource(sourceId) {
        for (const [_, agent] of this.agents) {
            if (agent.sourceId === sourceId) {
                return agent;
            }
        }
        return null;
    }
    getStaleAgents(thresholdMs) {
        const now = Date.now();
        const stale = [];
        for (const [id, agent] of this.agents) {
            if (agent.status !== 'offline' && now - agent.lastHeartbeat > thresholdMs) {
                stale.push(agent);
            }
        }
        return stale;
    }
    markOffline(agentId) {
        const agent = this.agents.get(agentId);
        if (agent) {
            agent.status = (0, lifecycle_1.normalizeAgentLifecycleStatus)('offline') || 'offline';
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
class MasterClock {
    sessionId;
    orchestratorIdentity;
    registry;
    ws;
    redis;
    redisSub;
    upstash;
    isRunning;
    heartbeatInterval;
    stallCheckInterval;
    channels;
    scheduledProcesses;
    recoveryAttempts;
    metrics;
    reconnectTimer = null;
    taskPollingInterval = null;
    chronologicalPollingInterval = null;
    recentQueuedTasks;
    selfPromptCooldowns;
    taskPollFailureCount;
    repoRoot;
    dtfCache;
    constructor() {
        this.sessionId = `ORCHESTRATOR-${Date.now()}`;
        this.orchestratorIdentity = createOrchestratorIdentity(this.sessionId);
        this.registry = new AgentRegistry();
        this.ws = null;
        this.redis = null;
        this.redisSub = null;
        this.upstash = null;
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
        }
        catch (error) {
            log('error', 'MASTER', `Failed to start: ${error.message}`);
            this.scheduleReconnect();
        }
    }
    async connectRedis() {
        log('info', 'REDIS', 'Connecting to Redis for cloud coordination...');
        try {
            // Use unified standalone utilities
            this.redis = (0, infrastructure_1.createStandaloneRedisClient)({ lazyConnect: true });
            this.redisSub = (0, infrastructure_1.createStandaloneRedisClient)({ lazyConnect: true });
            this.upstash = (0, infrastructure_1.createUpstashRestClient)();
            if (this.redis instanceof ioredis_1.Redis) {
                this.redis.on('error', (err) => log('error', 'REDIS', `Client error: ${err.message}`));
                await this.redis.connect().catch((err) => {
                    log('warn', 'REDIS', `Failed to connect primary client (TCP): ${err.message}`);
                });
            }
            if (this.redisSub instanceof ioredis_1.Redis) {
                this.redisSub.on('error', (err) => log('error', 'REDIS', `Subscriber error: ${err.message}`));
                await this.redisSub.connect().catch((err) => {
                    log('warn', 'REDIS', `Failed to connect subscriber client (TCP): ${err.message}`);
                });
                // Subscribe to ingress for messages from other components
                await this.redisSub.subscribe(CONFIG.REDIS_KEYS.INGRESS);
                this.redisSub.on('message', (channel, message) => {
                    if (channel === CONFIG.REDIS_KEYS.INGRESS) {
                        try {
                            const envelope = JSON.parse(message);
                            this.handleRedisMessage(envelope);
                        }
                        catch (e) {
                            // Invalid message
                        }
                    }
                });
            }
            log('info', 'REDIS', '✅ Connected to Redis cloud coordination');
        }
        catch (error) {
            log('error', 'REDIS', `Failed to initialize Redis: ${error.message}`);
        }
    }
    async connectRelay() {
        return new Promise((resolve, reject) => {
            log('info', 'RELAY', `Connecting to ${CONFIG.RELAY_URL}...`);
            this.ws = new ws_1.default(CONFIG.RELAY_URL);
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
            this.ws.on('message', (data) => {
                this.handleRelayMessage(data);
            });
            this.ws.on('close', () => {
                log('warn', 'RELAY', 'Disconnected from relay');
                this.scheduleReconnect();
            });
            this.ws.on('error', (err) => {
                log('error', 'RELAY', `Connection error: ${err.message}`);
                clearTimeout(timeout);
                reject(err);
            });
        });
    }
    scheduleReconnect() {
        if (this.reconnectTimer)
            return;
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
        const orchestrator = this.getOrchestratorEnvelopeIdentity();
        this.send({
            type: 'AGENT_REGISTER',
            payload: {
                agent: {
                    id: this.sessionId,
                    canonicalEntityId: orchestrator.canonicalEntityId,
                    operationalHandle: orchestrator.operationalHandle,
                    runtimeSessionId: orchestrator.runtimeSessionId,
                    aliases: orchestrator.aliases,
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
        if (this.upstash) {
            try {
                const persistedChannels = await this.upstash.smembers(CONFIG.REDIS_KEYS.CHANNELS);
                for (const ch of persistedChannels) {
                    channelsToJoin.add(ch);
                }
            }
            catch (e) {
                log('warn', 'REDIS', 'Failed to load persisted channels from Upstash', e);
            }
        }
        else if (this.redis) {
            try {
                const persistedChannels = await this.redis.smembers(CONFIG.REDIS_KEYS.CHANNELS);
                for (const ch of persistedChannels) {
                    channelsToJoin.add(ch);
                }
            }
            catch (e) {
                log('warn', 'REDIS', 'Failed to load persisted channels from Redis', e);
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
        if (this.heartbeatInterval)
            return;
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
        const orchestrator = this.getOrchestratorEnvelopeIdentity();
        // Heartbeat to relay
        this.send({
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
        if (this.upstash) {
            this.upstash
                .hset(CONFIG.REDIS_KEYS.STATE, {
                orchestrator: JSON.stringify({
                    sessionId: this.sessionId,
                    lastHeartbeat: now,
                    stats,
                    superCycle: superCycleStats,
                    isActive: true,
                }),
            })
                .catch(() => { });
            this.persistSuperCycleState(now).catch(() => { });
        }
        else if (this.redis) {
            this.redis
                .hset(CONFIG.REDIS_KEYS.STATE, 'orchestrator', JSON.stringify({
                sessionId: this.sessionId,
                lastHeartbeat: now,
                stats,
                superCycle: superCycleStats,
                isActive: true,
            }))
                .catch(() => { });
            this.persistSuperCycleState(now).catch(() => { });
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
        if (this.stallCheckInterval)
            return;
        log('info', 'WATCHDOG', `Starting stall detection (checking every ${CONFIG.STALL_THRESHOLD}ms)`);
        // Check more frequently than the threshold to catch stalls quickly
        const checkInterval = Math.floor(CONFIG.STALL_THRESHOLD / 2);
        this.stallCheckInterval = setInterval(() => {
            this.checkForStalls();
        }, checkInterval);
    }
    startTaskPolling() {
        if ((!this.redis && !this.upstash) || this.taskPollingInterval)
            return;
        log('info', 'TASK-POLL', `Starting vote-aware task polling (every ${CONFIG.TASK_POLL_INTERVAL_MS}ms)`);
        const run = () => {
            void this.pollAndQueueTasks().catch((error) => {
                this.taskPollFailureCount += 1;
                if (this.taskPollFailureCount <= 3 || this.taskPollFailureCount % 10 === 0) {
                    log('warn', 'TASK-POLL', `Task polling failed (${this.taskPollFailureCount}): ${error.message || String(error)}`);
                }
            });
        };
        this.taskPollingInterval = setInterval(run, CONFIG.TASK_POLL_INTERVAL_MS);
        run();
    }
    taskPriorityWeight(priority) {
        const normalized = String(priority || 'medium').toLowerCase();
        // Preserve historical TNF aliases (P0-P3, normal) across legacy producers.
        if (normalized === 'p0' || normalized === 'urgent')
            return 500;
        if (normalized === 'critical')
            return 400;
        if (normalized === 'p1' || normalized === 'high')
            return 300;
        if (normalized === 'p3' || normalized === 'low')
            return 100;
        if (normalized === 'normal' || normalized === 'p2')
            return 200;
        return 200;
    }
    itineraryLaneWeight(lane) {
        const normalized = String(lane || '').toLowerCase();
        if (normalized === 'realtime_broker_routing')
            return 350;
        if (normalized === 'relay_federation' ||
            normalized === 'redis_sync' ||
            normalized === 'tauri_sync')
            return 300;
        if (normalized === 'directive')
            return 250;
        if (normalized === 'kanban_delivery')
            return 150;
        if (normalized === 'changelog_suggestion')
            return 120;
        if (normalized === 'suggestion_vote')
            return 80;
        return 100;
    }
    horizonWeight(horizon) {
        const normalized = String(horizon || '').toLowerCase();
        if (normalized === 'realtime')
            return 200;
        if (normalized === 'short_term')
            return 120;
        if (normalized === 'medium_term')
            return 60;
        if (normalized === 'long_term')
            return 20;
        return 40;
    }
    isRealtimeDispatchCandidate(task) {
        const lane = String(task?.itinerary?.lane || '').toLowerCase();
        return [
            'realtime_broker_routing',
            'relay_federation',
            'redis_sync',
            'tauri_sync',
            'directive',
        ].includes(lane);
    }
    targetQueueForTask(task) {
        const lane = String(task?.itinerary?.lane || '').toLowerCase();
        if (lane === 'suggestion_vote')
            return CONFIG.REDIS_KEYS.SUGGESTIONS;
        if (lane === 'changelog_suggestion')
            return CONFIG.REDIS_KEYS.CHANGELOG;
        if (lane === 'kanban_delivery')
            return CONFIG.REDIS_KEYS.KANBAN;
        if (this.isRealtimeDispatchCandidate(task))
            return CONFIG.REDIS_KEYS.TASKS_REALTIME;
        return CONFIG.REDIS_KEYS.TASKS_PLANNING;
    }
    taskDispatchScore(task) {
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
    async fetchLedgerTasks() {
        const base = CONFIG.LEDGER_API_BASE.replace(/\/$/, '');
        const urls = [
            `${base}/api/unified-ledger/records?kind=task`,
            `${base}/unified-ledger/records?kind=task`,
        ];
        let lastError = null;
        for (const url of urls) {
            try {
                const response = await fetch(url, { method: 'GET' });
                if (!response.ok) {
                    lastError = `HTTP ${response.status} (${url})`;
                    continue;
                }
                const rows = (await response.json());
                return Array.isArray(rows) ? rows : [];
            }
            catch (error) {
                lastError = `${error.message || String(error)} (${url})`;
            }
        }
        throw new Error(`Ledger poll failed: ${lastError || 'unknown error'}`);
    }
    async pollAndQueueTasks() {
        if (!this.redis && !this.upstash)
            return;
        const rows = await this.fetchLedgerTasks();
        this.taskPollFailureCount = 0;
        const actionable = (Array.isArray(rows) ? rows : []).filter((task) => {
            const status = String(task?.status || '').toLowerCase();
            return (['submitted', 'queued', 'under_review', 'in_progress'].includes(status) &&
                this.isRealtimeDispatchCandidate(task));
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
            if (!taskId)
                continue;
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
            if (this.upstash) {
                await this.upstash.lpush(targetQueue, JSON.stringify(queueItem));
                // Backward compatibility for existing consumers.
                await this.upstash.lpush(CONFIG.REDIS_KEYS.TASKS, JSON.stringify(queueItem));
                await this.upstash.ltrim(CONFIG.REDIS_KEYS.TASKS, 0, 99);
            }
            else if (this.redis) {
                await this.redis.lpush(targetQueue, JSON.stringify(queueItem));
                // Backward compatibility for existing consumers.
                await this.redis.lpush(CONFIG.REDIS_KEYS.TASKS, JSON.stringify(queueItem));
                await this.redis.ltrim(CONFIG.REDIS_KEYS.TASKS, 0, 99);
            }
            this.recentQueuedTasks.set(taskId, now);
            this.metrics.tasksQueued += 1;
            await this.emitActivityEvent('task_queued_from_votes', `Queued task ${taskId} (${queueItem.title}) with score ${rankedTask.score}`, {
                taskId,
                score: rankedTask.score,
                votes: queueItem.votes,
                priority: queueItem.priority,
                targetQueue,
                lane: queueItem.itinerary?.lane,
                tasksQueued: this.metrics.tasksQueued,
            });
        }
    }
    async emitActivityEvent(eventType, content, metadata) {
        const auditedMetadata = this.attachOrchestratorAudit({
            isSystemMessage: true,
            source: 'ORCHESTRATOR',
            eventType,
            activityChannel: 'General',
            sessionId: this.sessionId,
            ...metadata,
        }, {
            channelId: 'fuse-activity-log',
            sessionId: this.sessionId,
        });
        this.send({
            type: 'MESSAGE_SEND',
            channel: 'fuse-activity-log',
            payload: {
                to: 'broadcast',
                content,
                messageType: 'event',
                metadata: auditedMetadata,
            },
        });
        if (!this.redis && !this.upstash)
            return;
        try {
            const logEntry = JSON.stringify({
                timestamp: new Date().toISOString(),
                sessionId: this.sessionId,
                eventType,
                content,
                metadata: auditedMetadata,
            });
            if (this.upstash) {
                await this.upstash.lpush(CONFIG.REDIS_KEYS.LOGS, logEntry);
                await this.upstash.ltrim(CONFIG.REDIS_KEYS.LOGS, 0, 999);
            }
            else if (this.redis) {
                await this.redis.lpush(CONFIG.REDIS_KEYS.LOGS, logEntry);
                await this.redis.ltrim(CONFIG.REDIS_KEYS.LOGS, 0, 999);
            }
        }
        catch {
            // non-fatal
        }
    }
    startChronologicalPolling() {
        if (this.chronologicalPollingInterval)
            return;
        log('info', 'CHRONO', `Starting chronological scheduler poller (every ${CONFIG.CHRONOLOGICAL_POLL_INTERVAL_MS}ms)`);
        const run = () => {
            void this.pollAndRunChronologicalProcesses().catch((error) => {
                log('warn', 'CHRONO', `Chronological scheduler poll failed: ${error.message || String(error)}`);
            });
        };
        this.chronologicalPollingInterval = setInterval(run, CONFIG.CHRONOLOGICAL_POLL_INTERVAL_MS);
        run();
    }
    async pollAndRunChronologicalProcesses() {
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
    async loadChronologicalProcessSnapshots() {
        const registryPath = path_1.default.join(this.repoRoot, 'data', 'protocols', 'cron-jobs.registry.json');
        const statePath = path_1.default.join(this.repoRoot, 'data', 'protocols', 'cron-jobs.control-plane-state.json');
        const catalogPath = path_1.default.join(this.repoRoot, 'data', 'protocols', 'chronological-process-catalog.json');
        const registryRaw = await fs_1.promises
            .readFile(registryPath, 'utf8')
            .then((value) => JSON.parse(value))
            .catch(() => ({ jobs: [] }));
        const stateRaw = await fs_1.promises
            .readFile(statePath, 'utf8')
            .then((value) => JSON.parse(value))
            .catch(() => ({ overrides: {}, runtime: {} }));
        const catalogRaw = await fs_1.promises
            .readFile(catalogPath, 'utf8')
            .then((value) => JSON.parse(value))
            .catch(() => ({ entries: {} }));
        const jobs = Array.isArray(registryRaw.jobs) ? registryRaw.jobs : [];
        const overrides = stateRaw.overrides || {};
        const runtime = stateRaw.runtime || {};
        const entries = catalogRaw.entries || {};
        return jobs
            .map((job) => {
            const catalogEntry = entries[job.schedule_id];
            if (!catalogEntry)
                return null;
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
            };
        })
            .filter(Boolean);
    }
    shouldRunChronologicalProcess(snapshot, now) {
        if (!snapshot.enabled || !snapshot.runNow)
            return false;
        const normalizedCadence = this.normalizeCronExpression(snapshot.cadence);
        if (!normalizedCadence || normalizedCadence === 'manual')
            return false;
        const lastRunAtMs = this.parseTimestampMs(snapshot.runtime?.lastRunAt);
        if (snapshot.runtime?.status === 'running' && lastRunAtMs) {
            const lockWindowMs = Math.max(Number(snapshot.runNow.timeoutMs || 30000) * 2, CONFIG.CHRONOLOGICAL_POLL_INTERVAL_MS * 2);
            if (Date.now() - lastRunAtMs < lockWindowMs) {
                return false;
            }
        }
        const currentSlot = this.getScheduleSlot(now, normalizedCadence, snapshot.timezone);
        if (!currentSlot.matches || !currentSlot.key)
            return false;
        if (!lastRunAtMs)
            return true;
        const lastRunSlot = this.getScheduleSlot(new Date(lastRunAtMs), normalizedCadence, snapshot.timezone);
        return currentSlot.key !== lastRunSlot.key;
    }
    async executeChronologicalProcess(snapshot) {
        const runnerPath = path_1.default.join(this.repoRoot, 'scripts', 'protocols', 'run-chronological-process.cjs');
        const startedAt = new Date().toISOString();
        let status = 'healthy';
        let lastResult = 'ok';
        try {
            const result = await execFileAsync('node', [runnerPath, '--process-id', snapshot.processId, '--actor-id', 'tnf-master-clock'], {
                cwd: this.repoRoot,
                timeout: Number(snapshot.runNow?.timeoutMs || 30000) + 5000,
                maxBuffer: 1024 * 1024 * 2,
                env: process.env,
            });
            const parsed = this.parseJsonOutput(result.stdout);
            if (parsed?.run?.status) {
                status = parsed.run.status;
                lastResult = status;
            }
            await this.emitActivityEvent('chronological_process_executed', `Executed chronological process ${snapshot.processId}`, {
                processId: snapshot.processId,
                title: snapshot.title,
                status,
            });
        }
        catch (error) {
            status = 'error';
            lastResult = error.message || 'execution_failed';
            log('warn', 'CHRONO', `Chronological execution failed for ${snapshot.processId}: ${lastResult}`);
            await this.emitActivityEvent('chronological_process_error', `Chronological process ${snapshot.processId} failed`, {
                processId: snapshot.processId,
                title: snapshot.title,
                error: lastResult,
            });
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
    parseJsonOutput(stdout) {
        try {
            return stdout ? JSON.parse(stdout) : null;
        }
        catch {
            return null;
        }
    }
    deriveCadenceIntervalMs(cadence) {
        const normalized = this.normalizeCronExpression(cadence);
        if (!normalized || normalized === 'manual')
            return undefined;
        if (normalized === '0 * * * *')
            return 60 * 60 * 1000;
        if (normalized === '*/10 * * * *')
            return 10 * 60 * 1000;
        if (normalized === '*/15 * * * *')
            return 15 * 60 * 1000;
        if (normalized === '*/30 * * * *')
            return 30 * 60 * 1000;
        if (normalized === '0 */2 * * *')
            return 2 * 60 * 60 * 1000;
        if (normalized === '0 */4 * * *')
            return 4 * 60 * 60 * 1000;
        if (normalized === '0 */6 * * *')
            return 6 * 60 * 60 * 1000;
        if (normalized === '0 0 * * *')
            return 24 * 60 * 60 * 1000;
        return undefined;
    }
    getScheduleSlot(date, cadence, timezone) {
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
        const weekdayMatch = this.matchesCronField(parts.weekday, weekdayExpr, 0, 7, this.weekdayNameMap(), true);
        const dayIsWildcard = dayExpr.trim() === '*';
        const weekdayIsWildcard = weekdayExpr.trim() === '*';
        const dayConstraintMatch = dayIsWildcard || weekdayIsWildcard ? dayMatch && weekdayMatch : dayMatch || weekdayMatch;
        const matches = minuteMatch && hourMatch && monthMatch && dayConstraintMatch;
        return {
            matches,
            key: matches
                ? `${this.safeTimezone(timezone)}:${parts.year}-${String(parts.month).padStart(2, '0')}-${String(parts.day).padStart(2, '0')}:${String(parts.hour).padStart(2, '0')}:${String(parts.minute).padStart(2, '0')}`
                : null,
        };
    }
    getNextRunAt(cadence, timezone, fromDate = new Date()) {
        const normalized = this.normalizeCronExpression(cadence);
        if (!normalized || normalized === 'manual')
            return null;
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
    normalizeCronExpression(cadence) {
        const raw = String(cadence || '').trim();
        if (!raw)
            return null;
        if (raw.toLowerCase() === 'manual')
            return 'manual';
        const preset = raw.toLowerCase();
        const presetMap = {
            '@yearly': '0 0 1 1 *',
            '@annually': '0 0 1 1 *',
            '@monthly': '0 0 1 * *',
            '@weekly': '0 0 * * 0',
            '@daily': '0 0 * * *',
            '@hourly': '0 * * * *',
            '@reboot': 'manual',
        };
        if (presetMap[preset])
            return presetMap[preset];
        const tokens = raw.split(/\s+/).filter(Boolean);
        if (tokens.length === 5)
            return tokens.join(' ');
        if (tokens.length === 6)
            return tokens.slice(1).join(' ');
        if (tokens.length === 7)
            return tokens.slice(1, 6).join(' ');
        return null;
    }
    getZonedDateParts(date, timezone) {
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
        const getNumber = (type) => {
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
    safeTimezone(input) {
        try {
            const normalized = String(input || '').trim() || 'UTC';
            Intl.DateTimeFormat('en-US', { timeZone: normalized });
            return normalized;
        }
        catch {
            return 'UTC';
        }
    }
    monthNameMap() {
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
    weekdayNameMap() {
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
    matchesCronField(value, expression, min, max, names, normalizeSevenToZero = false) {
        const raw = String(expression || '')
            .trim()
            .toLowerCase();
        if (!raw || raw === '*')
            return true;
        const parts = raw.split(',');
        for (const part of parts) {
            if (this.matchesCronSegment(value, part.trim(), min, max, names, normalizeSevenToZero)) {
                return true;
            }
        }
        return false;
    }
    matchesCronSegment(value, segment, min, max, names, normalizeSevenToZero = false) {
        if (!segment)
            return false;
        const [rangeToken, stepToken] = segment.split('/');
        const step = stepToken ? Number.parseInt(stepToken, 10) : 1;
        if (!Number.isFinite(step) || step <= 0)
            return false;
        if (rangeToken === '*') {
            return (value - min) % step === 0;
        }
        if (rangeToken.includes('-')) {
            const [startToken, endToken] = rangeToken.split('-');
            const start = this.parseCronToken(startToken, names, normalizeSevenToZero);
            const end = this.parseCronToken(endToken, names, normalizeSevenToZero);
            if (start === null || end === null || start > end)
                return false;
            if (start < min || end > max || value < start || value > end)
                return false;
            return (value - start) % step === 0;
        }
        const single = this.parseCronToken(rangeToken, names, normalizeSevenToZero);
        if (single === null || single < min || single > max)
            return false;
        return value === single;
    }
    parseCronToken(token, names, normalizeSevenToZero = false) {
        const cleaned = String(token || '')
            .trim()
            .toLowerCase();
        if (!cleaned)
            return null;
        if (names && cleaned in names)
            return names[cleaned];
        const parsed = Number.parseInt(cleaned, 10);
        if (!Number.isFinite(parsed))
            return null;
        if (normalizeSevenToZero && parsed === 7)
            return 0;
        return parsed;
    }
    resolveRepoRoot() {
        const marker = path_1.default.join('data', 'protocols', 'chronological-process-catalog.json');
        let current = process.cwd();
        for (let i = 0; i < 8; i += 1) {
            if ((0, fs_1.existsSync)(path_1.default.join(current, marker))) {
                return current;
            }
            const next = path_1.default.dirname(current);
            if (next === current)
                break;
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
                agent.status = (0, lifecycle_1.normalizeAgentLifecycleStatus)('stalled') || 'stalled';
                this.metrics.stallsDetected++;
                log('warn', 'WATCHDOG', `STALL DETECTED: ${agent.agentId} (idle: ${Math.round(idleTime / 1000)}s)`, { agentId: agent.agentId });
                // Immediate recovery attempt
                this.attemptRecovery(agent.agentId, 1);
            }
            else if (attempts < CONFIG.MAX_RECOVERY_ATTEMPTS) {
                // Continue recovery attempts
                const timeSinceLastAttempt = idleTime - attempts * CONFIG.RECOVERY_INTERVAL;
                if (timeSinceLastAttempt >= CONFIG.RECOVERY_INTERVAL) {
                    this.attemptRecovery(agent.agentId, attempts + 1);
                }
            }
            else {
                // Max attempts reached - mark offline
                this.registry.markOffline(agent.agentId);
                this.broadcastAgentOffline(agent.agentId);
            }
        }
        this.checkForStaleScheduledProcesses();
    }
    attemptRecovery(agentId, attemptNumber) {
        this.recoveryAttempts.set(agentId, attemptNumber);
        this.metrics.recoveryAttempts++;
        log('info', 'RECOVERY', `Recovery attempt ${attemptNumber}/${CONFIG.MAX_RECOVERY_ATTEMPTS} for ${agentId}`, { agentId });
        const agent = this.registry.getAgent(agentId);
        if (!agent)
            return;
        const recoveryMessage = attemptNumber === 1
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
    handleRelayMessage(data) {
        try {
            const msg = JSON.parse(data.toString());
            this.processMessage(msg, 'relay');
        }
        catch (e) {
            // Invalid JSON - ignore
        }
    }
    handleRedisMessage(envelope) {
        this.processMessage(envelope, 'redis');
    }
    processMessage(msg, source) {
        this.metrics.messagesProcessed++;
        const normalized = this.normalizeIncomingMessage(msg);
        if (!normalized)
            return;
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
    normalizeIncomingMessage(msg) {
        if (!msg)
            return null;
        // TNF envelope compatibility over Redis ingress.
        if (msg.payload?.originalMessage?.type) {
            return msg.payload.originalMessage;
        }
        if (msg.type)
            return msg;
        return null;
    }
    handleChannelMessage(msg) {
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
            this.broadcastToChannel(channel, this.createAssignmentMessage(agentId));
        }
        else if (existingAgent) {
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
    handleAgentHeartbeat(msg) {
        const agentId = msg.payload?.agentId || msg.source;
        const existingAgent = this.registry.getAgentBySource(agentId);
        if (existingAgent) {
            this.registry.recordHeartbeat(existingAgent.agentId);
            this.recoveryAttempts.delete(existingAgent.agentId);
        }
    }
    handleAgentRegistration(msg) {
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
                this.broadcastToChannel(channel, this.createAssignmentMessage(agentId));
            }
        }
    }
    handleSuperCycleRegistration(msg) {
        const payload = msg.payload || {};
        const processId = payload.processId || payload.name || msg.source;
        if (!processId)
            return;
        const existing = this.scheduledProcesses.get(processId);
        const now = Date.now();
        const metadata = { ...(existing?.metadata || {}), ...(payload.metadata || {}) };
        const lastHeartbeat = this.parseTimestampMs(payload.lastHeartbeat) || now;
        const lastRunAt = this.parseTimestampMs(payload.lastRunAt) || existing?.lastRunAt;
        const interval = this.resolveScheduledProcessInterval(payload, metadata, existing);
        const nextExpectedAt = this.resolveNextExpectedAt(payload, lastRunAt || lastHeartbeat, interval.intendedIntervalMs) || existing?.nextExpectedAt;
        const next = {
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
        void this.emitActivityEvent('super_cycle_process_registered', `Registered scheduled process ${processId}`, {
            processId,
            status: next.status,
            kind: next.kind,
            owner: next.owner,
            intendedIntervalMs: next.intendedIntervalMs || null,
            intervalSource: next.intervalSource || 'inferred',
            intervalExact: Boolean(next.intervalExact),
            lastRunAt: next.lastRunAt ? new Date(next.lastRunAt).toISOString() : null,
            nextExpectedAt: next.nextExpectedAt ? new Date(next.nextExpectedAt).toISOString() : null,
        });
    }
    handleSuperCycleHeartbeat(msg) {
        const payload = msg.payload || {};
        const processId = payload.processId || payload.name || msg.source;
        if (!processId)
            return;
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
        const nextExpectedAt = this.resolveNextExpectedAt(payload, lastRunAt || heartbeatTimestamp, interval.intendedIntervalMs || existing.intendedIntervalMs) || existing.nextExpectedAt;
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
    handleSuperCycleUnregister(msg) {
        const payload = msg.payload || {};
        const processId = payload.processId || payload.name || msg.source;
        if (!processId)
            return;
        const existing = this.scheduledProcesses.get(processId);
        if (this.scheduledProcesses.delete(processId)) {
            log('info', 'SUPER-CYCLE', `Unregistered process ${processId}`, { processId });
            void this.emitActivityEvent('super_cycle_process_unregistered', `Unregistered scheduled process ${processId}`, {
                processId,
                intendedIntervalMs: existing?.intendedIntervalMs || null,
                intervalSource: existing?.intervalSource || 'inferred',
                intervalExact: Boolean(existing?.intervalExact),
                lastRunAt: existing?.lastRunAt ? new Date(existing.lastRunAt).toISOString() : null,
                nextExpectedAt: existing?.nextExpectedAt
                    ? new Date(existing.nextExpectedAt).toISOString()
                    : null,
                finalStatus: existing?.status || payload.status || 'unknown',
            });
        }
    }
    handleAgentJoined(msg) {
        const channel = msg.channel;
        const agentId = msg.payload?.agentId || msg.source;
        if (channel && this.channels.has(channel) && agentId) {
            const ch = this.channels.get(channel);
            if (ch)
                ch.members.add(agentId);
            // Check if this agent needs onboarding
            const existingAgent = this.registry.getAgentBySource(agentId);
            if (!existingAgent && agentId !== this.sessionId) {
                const newId = this.registry.assignAgentId(agentId, { channel, aliases: [agentId] });
                this.broadcastToChannel(channel, this.createAssignmentMessage(newId));
            }
        }
    }
    async handleChannelCreate(msg) {
        const channelName = msg.payload?.name || msg.channel;
        if (!channelName)
            return;
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
            if (this.upstash) {
                await this.upstash.sadd(CONFIG.REDIS_KEYS.CHANNELS, channelName);
            }
            else if (this.redis) {
                await this.redis.sadd(CONFIG.REDIS_KEYS.CHANNELS, channelName);
            }
            // Broadcast new channel existence
            this.broadcastToChannel('General', `📢 New channel created: ${channelName}`);
        }
    }
    // --------------------------------------------------------------------------
    // UTILITY METHODS
    // --------------------------------------------------------------------------
    send(msg) {
        if (this.ws && this.ws.readyState === ws_1.default.OPEN) {
            this.ws.send(JSON.stringify({
                ...msg,
                source: this.sessionId,
                timestamp: Date.now(),
            }));
        }
    }
    broadcastToChannel(channel, content) {
        this.send({
            type: 'MESSAGE_SEND',
            channel,
            payload: {
                to: 'broadcast',
                content,
                messageType: 'text',
                metadata: this.attachOrchestratorAudit({
                    isSystemMessage: true,
                    source: 'ORCHESTRATOR',
                }, {
                    channelId: channel,
                    sessionId: this.sessionId,
                }),
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
    createAssignmentMessage(agentId) {
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
    broadcastAgentOffline(agentId) {
        for (const channel of CONFIG.CHANNELS) {
            this.broadcastToChannel(channel, `⚫ Agent ${agentId} has been marked OFFLINE (no response after ${CONFIG.MAX_RECOVERY_ATTEMPTS} recovery attempts)`);
        }
    }
    sendSigningReminder(channel, agentId) {
        this.broadcastToChannel(channel, `⚠️ Reminder: ${agentId}, please sign your messages with [${agentId}]`);
    }
    isSignedMessage(content, agentId) {
        if (!content || !agentId)
            return false;
        return content.includes(`[${agentId}]`) || content.startsWith(`[${agentId}]`);
    }
    detectPlatform(content) {
        const lower = content.toLowerCase();
        if (lower.includes('gemini'))
            return 'gemini';
        if (lower.includes('claude'))
            return 'claude';
        if (lower.includes('chatgpt') || lower.includes('openai'))
            return 'chatgpt';
        if (lower.includes('perplexity'))
            return 'perplexity';
        if (lower.includes('deepseek'))
            return 'deepseek';
        if (lower.includes('cursor'))
            return 'cursor';
        if (lower.includes('jules'))
            return 'jules';
        return 'unknown';
    }
    detectCapabilities(content) {
        const capabilities = [];
        const lower = content.toLowerCase();
        if (lower.includes('code') || lower.includes('programming'))
            capabilities.push('code-generation');
        if (lower.includes('research') || lower.includes('search'))
            capabilities.push('research');
        if (lower.includes('analysis') || lower.includes('analyze'))
            capabilities.push('analysis');
        if (lower.includes('image') || lower.includes('vision'))
            capabilities.push('image-processing');
        if (lower.includes('file') || lower.includes('document'))
            capabilities.push('file-handling');
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
                void this.emitActivityEvent('super_cycle_process_stale', `Scheduled process ${processId} marked stale`, {
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
                });
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
    async emitSelfPrompt(params) {
        if (!CONFIG.SELF_PROMPT_ENABLED || (!this.redis && !this.upstash)) {
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
            id: (0, crypto_1.randomUUID)(),
            scope: {
                tenant_id: tenantId,
                session_key: this.sessionId,
                workflow_id: null,
                channel_id: params.channel,
            },
            lineage: {
                trace_id: null,
                correlation_id: (0, crypto_1.randomUUID)(),
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
        const broadcastEnvelope = (0, tnf_envelope_1.createTNFEnvelope)('event', this.getOrchestratorEnvelopeIdentity(), { broadcast: true }, {
            eventType: 'SELF_PROMPT',
            data: {
                ...params,
                cumulativeId,
                issuedAt: now,
            },
            originalMessage,
        }, {
            channelId: params.channel,
            sessionId: this.sessionId,
        }, {
            audit: this.getOrchestratorAudit({
                channelId: params.channel,
                sessionId: this.sessionId,
            }),
        });
        try {
            await this.redis.publish(CONFIG.REDIS_KEYS.INGRESS, JSON.stringify(broadcastEnvelope));
            await this.redis.lPush(CONFIG.REDIS_KEYS.SELF_PROMPTS, JSON.stringify({
                sessionId: this.sessionId,
                ...params,
                cumulativeId,
                issuedAt: now,
            }));
            await this.redis.lTrim(CONFIG.REDIS_KEYS.SELF_PROMPTS, 0, 499);
        }
        catch (error) {
            log('warn', 'SELF-PROMPT', `Failed to publish self-prompt: ${error.message}`);
        }
        if (params.targetSourceId) {
            const directEnvelope = (0, tnf_envelope_1.createTNFEnvelope)('task', this.getOrchestratorEnvelopeIdentity(), this.getAgentEnvelopeIdentity(params.targetSourceId), {
                action: 'self_prompt_continue',
                parameters: {
                    prompt: params.prompt,
                    reason: params.reason,
                    channel: params.channel,
                    cumulativeId,
                    ...(params.metadata || {}),
                },
                priority: 'high',
            }, {
                channelId: params.channel,
                sessionId: this.sessionId,
            }, {
                audit: this.getOrchestratorAudit({
                    channelId: params.channel,
                    sessionId: this.sessionId,
                }),
            });
            try {
                if (this.upstash) {
                    await this.upstash.publish(`${CONFIG.REDIS_KEYS.EGRESS_PREFIX}:${params.targetSourceId}`, JSON.stringify(directEnvelope));
                }
                else if (this.redis) {
                    await this.redis.publish(`${CONFIG.REDIS_KEYS.EGRESS_PREFIX}:${params.targetSourceId}`, JSON.stringify(directEnvelope));
                }
            }
            catch (error) {
                log('warn', 'SELF-PROMPT', `Failed targeted self-prompt publish for ${params.targetSourceId}: ${error.message}`);
            }
        }
        log('info', 'SELF-PROMPT', `Self-prompt issued (${params.kind})`, {
            channel: params.channel,
            targetAgentId: params.targetAgentId,
            targetProcessId: params.targetProcessId,
            reason: params.reason,
        });
    }
    getOrchestratorAudit(overrides = {}) {
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
    attachOrchestratorAudit(metadata, overrides = {}) {
        return (0, audit_1.attachAuditTrace)(metadata, this.getOrchestratorAudit(overrides));
    }
    getOrchestratorEnvelopeIdentity() {
        return {
            agentId: this.sessionId,
            canonicalEntityId: this.orchestratorIdentity.canonicalEntityId || undefined,
            operationalHandle: this.orchestratorIdentity.operationalHandle,
            runtimeSessionId: this.orchestratorIdentity.runtimeSessionId || undefined,
            aliases: this.orchestratorIdentity.aliases,
            role: 'orchestrator',
            platform: 'master-clock',
        };
    }
    getAgentEnvelopeIdentity(sourceOrAgentId) {
        const agent = this.registry.getAgent(sourceOrAgentId) || this.registry.getAgentBySource(sourceOrAgentId);
        if (!agent) {
            return {
                agentId: sourceOrAgentId,
                operationalHandle: sourceOrAgentId,
                runtimeSessionId: sourceOrAgentId,
                aliases: [sourceOrAgentId],
                role: 'worker',
            };
        }
        return {
            agentId: agent.sourceId,
            canonicalEntityId: agent.canonicalEntityId || undefined,
            operationalHandle: agent.operationalHandle,
            runtimeSessionId: agent.runtimeSessionId || undefined,
            aliases: agent.aliases,
            role: 'worker',
            platform: agent.platform,
        };
    }
    getSuperCycleStats() {
        const processes = Array.from(this.scheduledProcesses.values());
        return {
            total: processes.length,
            healthy: processes.filter((p) => !p.stale).length,
            stale: processes.filter((p) => p.stale).length,
        };
    }
    async persistSuperCycleState(now) {
        if (!this.redis && !this.upstash)
            return;
        const processes = Array.from(this.scheduledProcesses.values()).sort((a, b) => a.processId.localeCompare(b.processId));
        const statePayload = JSON.stringify({
            lastUpdated: now,
            staleThresholdMs: CONFIG.SUPER_CYCLE_STALE_THRESHOLD,
            stats: this.getSuperCycleStats(),
            processes,
        });
        if (this.upstash) {
            await this.upstash.hset(CONFIG.REDIS_KEYS.STATE, { superCycle: statePayload });
        }
        else if (this.redis) {
            await this.redis.hset(CONFIG.REDIS_KEYS.STATE, 'superCycle', statePayload);
        }
        const processState = {};
        for (const process of processes) {
            processState[process.processId] = JSON.stringify(process);
        }
        if (this.upstash) {
            await this.upstash.del(CONFIG.REDIS_KEYS.SUPER_CYCLE);
            if (Object.keys(processState).length > 0) {
                await this.upstash.hset(CONFIG.REDIS_KEYS.SUPER_CYCLE, processState);
            }
        }
        else if (this.redis) {
            await this.redis.del(CONFIG.REDIS_KEYS.SUPER_CYCLE);
            if (Object.keys(processState).length > 0) {
                await this.redis.hset(CONFIG.REDIS_KEYS.SUPER_CYCLE, processState);
            }
        }
    }
    parseTimestampMs(value) {
        if (typeof value === 'number' && Number.isFinite(value) && value > 0) {
            return value;
        }
        if (typeof value === 'string') {
            const isoValue = Date.parse(value);
            if (Number.isFinite(isoValue) && isoValue > 0)
                return isoValue;
            const numericValue = Number.parseInt(value, 10);
            if (Number.isFinite(numericValue) && numericValue > 0)
                return numericValue;
        }
        return undefined;
    }
    readCadenceMs(source) {
        if (!source || typeof source !== 'object')
            return undefined;
        const valueMs = Number(source.intendedIntervalMs ||
            source.expectedIntervalMs ||
            source.intervalMs ||
            source.heartbeatIntervalMs ||
            0);
        if (Number.isFinite(valueMs) && valueMs > 0)
            return valueMs;
        const valueSeconds = Number(source.intendedIntervalSeconds ||
            source.intervalSeconds ||
            source.heartbeatIntervalSeconds ||
            source.cadenceSeconds ||
            0);
        if (Number.isFinite(valueSeconds) && valueSeconds > 0)
            return valueSeconds * 1000;
        return undefined;
    }
    resolveScheduledProcessInterval(payload, metadata, existing) {
        const producerInterval = this.readCadenceMs(payload);
        if (producerInterval) {
            return {
                intendedIntervalMs: producerInterval,
                intervalSource: 'producer',
                intervalExact: true,
            };
        }
        const metadataInterval = this.readCadenceMs(metadata);
        if (metadataInterval) {
            return {
                intendedIntervalMs: metadataInterval,
                intervalSource: 'metadata',
                intervalExact: true,
            };
        }
        if (existing?.intendedIntervalMs) {
            return {
                intendedIntervalMs: existing.intendedIntervalMs,
                intervalSource: existing.intervalSource || 'inferred',
                intervalExact: Boolean(existing.intervalExact),
            };
        }
        return {
            intendedIntervalMs: undefined,
            intervalSource: 'inferred',
            intervalExact: false,
        };
    }
    resolveNextExpectedAt(payload, anchorMs, intervalMs) {
        const explicit = this.parseTimestampMs(payload.nextExpectedAt);
        if (explicit)
            return explicit;
        if (anchorMs && intervalMs && intervalMs > 0) {
            return anchorMs + intervalMs;
        }
        return undefined;
    }
    parseTimestampMs(value) {
        if (typeof value === 'number' && Number.isFinite(value) && value > 0) {
            return value;
        }
        if (typeof value === 'string') {
            const isoValue = Date.parse(value);
            if (Number.isFinite(isoValue) && isoValue > 0)
                return isoValue;
            const numericValue = Number.parseInt(value, 10);
            if (Number.isFinite(numericValue) && numericValue > 0)
                return numericValue;
        }
        return undefined;
    }
    readCadenceMs(source) {
        if (!source || typeof source !== 'object')
            return undefined;
        const valueMs = Number(source.intendedIntervalMs ||
            source.expectedIntervalMs ||
            source.intervalMs ||
            source.heartbeatIntervalMs ||
            0);
        if (Number.isFinite(valueMs) && valueMs > 0)
            return valueMs;
        const valueSeconds = Number(source.intendedIntervalSeconds ||
            source.intervalSeconds ||
            source.heartbeatIntervalSeconds ||
            source.cadenceSeconds ||
            0);
        if (Number.isFinite(valueSeconds) && valueSeconds > 0)
            return valueSeconds * 1000;
        return undefined;
    }
    resolveScheduledProcessInterval(payload, metadata, existing) {
        const producerInterval = this.readCadenceMs(payload);
        if (producerInterval) {
            return {
                intendedIntervalMs: producerInterval,
                intervalSource: 'producer',
                intervalExact: true,
            };
        }
        const metadataInterval = this.readCadenceMs(metadata);
        if (metadataInterval) {
            return {
                intendedIntervalMs: metadataInterval,
                intervalSource: 'metadata',
                intervalExact: true,
            };
        }
        if (existing?.intendedIntervalMs) {
            return {
                intendedIntervalMs: existing.intendedIntervalMs,
                intervalSource: existing.intervalSource || 'inferred',
                intervalExact: Boolean(existing.intervalExact),
            };
        }
        return {
            intendedIntervalMs: undefined,
            intervalSource: 'inferred',
            intervalExact: false,
        };
    }
    resolveNextExpectedAt(payload, anchorMs, intervalMs) {
        const explicit = this.parseTimestampMs(payload.nextExpectedAt);
        if (explicit)
            return explicit;
        if (anchorMs && intervalMs && intervalMs > 0) {
            return anchorMs + intervalMs;
        }
        return undefined;
    }
    parseTimestampMs(value) {
        if (typeof value === 'number' && Number.isFinite(value) && value > 0) {
            return value;
        }
        if (typeof value === 'string') {
            const isoValue = Date.parse(value);
            if (Number.isFinite(isoValue) && isoValue > 0)
                return isoValue;
            const numericValue = Number.parseInt(value, 10);
            if (Number.isFinite(numericValue) && numericValue > 0)
                return numericValue;
        }
        return undefined;
    }
    readCadenceMs(source) {
        if (!source || typeof source !== 'object')
            return undefined;
        const valueMs = Number(source.intendedIntervalMs ||
            source.expectedIntervalMs ||
            source.intervalMs ||
            source.heartbeatIntervalMs ||
            0);
        if (Number.isFinite(valueMs) && valueMs > 0)
            return valueMs;
        const valueSeconds = Number(source.intendedIntervalSeconds ||
            source.intervalSeconds ||
            source.heartbeatIntervalSeconds ||
            source.cadenceSeconds ||
            0);
        if (Number.isFinite(valueSeconds) && valueSeconds > 0)
            return valueSeconds * 1000;
        return undefined;
    }
    resolveScheduledProcessInterval(payload, metadata, existing) {
        const producerInterval = this.readCadenceMs(payload);
        if (producerInterval) {
            return {
                intendedIntervalMs: producerInterval,
                intervalSource: 'producer',
                intervalExact: true,
            };
        }
        const metadataInterval = this.readCadenceMs(metadata);
        if (metadataInterval) {
            return {
                intendedIntervalMs: metadataInterval,
                intervalSource: 'metadata',
                intervalExact: true,
            };
        }
        if (existing?.intendedIntervalMs) {
            return {
                intendedIntervalMs: existing.intendedIntervalMs,
                intervalSource: existing.intervalSource || 'inferred',
                intervalExact: Boolean(existing.intervalExact),
            };
        }
        return {
            intendedIntervalMs: undefined,
            intervalSource: 'inferred',
            intervalExact: false,
        };
    }
    resolveNextExpectedAt(payload, anchorMs, intervalMs) {
        const explicit = this.parseTimestampMs(payload.nextExpectedAt);
        if (explicit)
            return explicit;
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
        // Upstash client doesn't need explicit quit
        this.upstash = null;
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
//# sourceMappingURL=master-clock.js.map