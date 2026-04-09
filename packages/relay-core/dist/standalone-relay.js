#!/usr/bin/env node
"use strict";
/* eslint-disable no-console */
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.TNFRelayServer = void 0;
/**
 * TNF Relay Server - Standalone WebSocket Relay
 * Part of @the-new-fuse/relay-core package
 *
 * Usage:
 *   pnpm run relay         # Start on default port 3000
 *   PORT=3002 pnpm run relay  # Start on custom port
 *
 * Endpoints:
 *   WebSocket: ws://localhost:3000/ws
 *   Health:    http://localhost:3000/health
 *   Agents:    http://localhost:3000/agents
 *   Channels:  http://localhost:3000/channels
 */
const events_1 = require("events");
const http_1 = __importDefault(require("http"));
const ioredis_1 = require("ioredis");
const ws_1 = __importStar(require("ws"));
// @ts-ignore
const infrastructure_1 = require("@the-new-fuse/infrastructure");
const JWTAuthService_1 = require("./auth/JWTAuthService");
const audit_1 = require("./contracts/audit");
const identity_1 = require("./contracts/identity");
const lifecycle_1 = require("./contracts/lifecycle");
const conversation_state_machine_1 = require("./orchestrator/conversation-state-machine");
const subscription_registry_1 = require("./orchestrator/subscription-registry");
const redis_relay_bridge_1 = require("./redis-relay-bridge");
const stall_detector_1 = require("./services/stall-detector");
const Logger_1 = require("./utils/Logger");
const TerminalFormatter_1 = require("./utils/TerminalFormatter");
// Configuration
const PORT = parseInt(process.env.PORT || '3000', 10);
const HEARTBEAT_INTERVAL = 30000;
const AGENT_TIMEOUT = 60000;
function buildRelayAgentIdentity(input) {
    return (0, identity_1.createAgentIdentityRecord)({
        canonicalEntityId: typeof input.canonicalEntityId === 'string' ? input.canonicalEntityId : undefined,
        operationalHandle: typeof input.operationalHandle === 'string' && input.operationalHandle.trim()
            ? input.operationalHandle
            : input.id,
        runtimeSessionId: typeof input.runtimeSessionId === 'string' && input.runtimeSessionId.trim()
            ? input.runtimeSessionId
            : input.id,
        aliases: [input.id, ...(Array.isArray(input.aliases) ? input.aliases : [])],
    });
}
function resolveRelayAgentStatus(input) {
    return (0, lifecycle_1.normalizeAgentLifecycleStatus)(typeof input === 'string' ? input : null) || 'active';
}
function buildBridgeOperatorContext(req) {
    const headerActor = req.headers['x-tnf-operator'];
    const actor = typeof headerActor === 'string' && headerActor.trim() ? headerActor.trim() : 'relay-admin-http';
    return {
        actor,
        remoteAddress: req.socket.remoteAddress || null,
        userAgent: typeof req.headers['user-agent'] === 'string' ? req.headers['user-agent'] : null,
    };
}
// Relay Server Class
class TNFRelayServer extends events_1.EventEmitter {
    server;
    wss;
    agents = new Map();
    sockets = new Map();
    channels = new Map();
    agentChannels = new Map();
    heartbeatInterval = null;
    port;
    bridge = null;
    bridgeSubscribedAgents = new Set();
    pendingBridgeAgents = new Map();
    approvedBridgeAgents = new Set();
    bridgeGateEnabled;
    authService;
    stallDetector;
    logger;
    conversationManagers = new Map();
    subscriptionRegistry;
    activityRedis = null;
    activityUpstash = null;
    activityRedisConnectPromise = null;
    activityPersistenceEnabled;
    activityPersistenceRequired;
    activityStreamKey;
    activityChannelPrefix;
    activityMaxLen;
    constructor(port = PORT) {
        super();
        this.port = port;
        // Auth is optional for local development
        try {
            this.authService = (0, JWTAuthService_1.createAuthService)();
        }
        catch {
            console.log('[Relay] JWT auth disabled - running in open mode');
            this.authService = null;
        }
        this.subscriptionRegistry = new subscription_registry_1.SubscriptionRegistry();
        this.activityPersistenceEnabled = process.env.ENABLE_ACTIVITY_PERSISTENCE !== 'false';
        this.activityPersistenceRequired = process.env.ACTIVITY_PERSISTENCE_REQUIRED !== 'false';
        this.activityStreamKey = process.env.ACTIVITY_STREAM_KEY || 'tnf:activity:stream';
        this.activityChannelPrefix =
            process.env.ACTIVITY_CHANNEL_STREAM_PREFIX || 'tnf:activity:channel:';
        this.activityMaxLen = parseInt(process.env.ACTIVITY_STREAM_MAXLEN || '100000', 10);
        // Initialize activity persistence clients
        if (this.activityPersistenceEnabled) {
            this.activityRedis = (0, infrastructure_1.createStandaloneRedisClient)({ lazyConnect: true });
            this.activityUpstash = (0, infrastructure_1.createUpstashRestClient)();
            this.activityRedisConnectPromise = (async () => {
                if (this.activityRedis instanceof ioredis_1.Redis) {
                    try {
                        await this.activityRedis.connect();
                    }
                    catch (err) {
                        console.warn('[Relay] Failed to connect activity Redis (TCP):', err);
                    }
                }
            })();
        }
        // Create logger
        this.logger = new Logger_1.Logger(process.env.LOG_LEVEL || 'info', process.env.WORKSPACE_DIR || process.cwd());
        // Create HTTP server
        this.server = http_1.default.createServer(this.handleHttpRequest.bind(this));
        // Create WebSocket server at /ws path
        this.wss = new ws_1.WebSocketServer({ server: this.server, path: '/ws' });
        // Setup WebSocket handlers
        this.setupWebSocket();
        // Create default channel
        this.createDefaultChannel();
        // Initialize stall detector for conversation recovery
        this.stallDetector = (0, stall_detector_1.createStallDetector)(this.logger, {
            stallThresholdMs: 3600000, // 60 minutes (increased from 45s)
            checkIntervalMs: 5000, // Check every 5 seconds
            maxRecoveryAttempts: 3,
            autoRecover: true,
        });
        // Handle stall recovery events
        this.stallDetector.on('recovery:message', (event) => {
            this.sendRecoveryMessage(event.channelId, event.message, event.metadata);
        });
        this.stallDetector.on('conversation:stalled', (event) => {
            TerminalFormatter_1.relay.conversationStalled(event.channelId);
            this.emit('conversation:stalled', event);
        });
        this.stallDetector.on('conversation:terminated', (event) => {
            TerminalFormatter_1.relay.conversationTerminated(event.channelId);
            this.emit('conversation:terminated', event);
        });
        this.stallDetector.on('conversation:recovered', (event) => {
            TerminalFormatter_1.relay.conversationRecovered(event.channelId);
            const manager = this.conversationManagers.get(event.channelId);
            if (manager && manager.getPhase() === conversation_state_machine_1.ConversationPhase.STALLED) {
                void manager.transition(conversation_state_machine_1.ConversationPhase.EXECUTION);
            }
        });
        // Initialize Redis Bridge (always enabled for coordination, but gated)
        this.bridgeGateEnabled = process.env.BRIDGE_GATE_ENABLED !== 'false'; // Default: gate is ON
        this.bridge = (0, redis_relay_bridge_1.createRedisRelayBridge)();
        this.bridge.on('connected', () => {
            TerminalFormatter_1.relay.redisBridgeConnected();
            console.log('[Relay] Bridge connected - Agent gate:', this.bridgeGateEnabled ? 'ENABLED' : 'OPEN');
        });
        this.bridge.on('egress', (envelope) => {
            // Handle message from Redis -> WebSocket (egress messages go to approved agents only)
            this.handleBridgeEgress(envelope);
        });
        this.bridge.connect().catch((err) => {
            console.error('[Relay] Failed to connect bridge:', err);
            console.log('[Relay] Continuing without Redis bridge - local-only mode');
            this.bridge = null;
        });
        if (this.activityPersistenceEnabled) {
            this.activityRedis = (0, redis_1.createClient)({
                url: process.env.ACTIVITY_REDIS_URL ||
                    process.env.REDIS_URL ||
                    'redis://default:mDNmtwseaVHcQsCHaIoZapjlWrvAjtot@tramway.proxy.rlwy.net:13570',
            });
            this.activityRedis.on('error', (err) => {
                console.error('[Relay] Activity Redis client error:', err.message);
            });
            this.activityRedisConnectPromise = this.activityRedis
                .connect()
                .then(() => {
                TerminalFormatter_1.relay.activityPersistenceEnabled(this.activityStreamKey);
            })
                .catch((err) => {
                console.error('[Relay] Failed to connect activity Redis:', err.message);
                this.activityPersistenceEnabled = false;
                this.activityRedis = null;
                throw err;
            });
        }
    }
    handleHttpRequest(req, res) {
        const urlString = req.url || '/';
        const parsedUrl = new URL(urlString, `http://${req.headers.host || 'localhost'}`);
        const pathname = parsedUrl.pathname;
        // CORS headers
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
        res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
        if (req.method === 'OPTIONS') {
            res.writeHead(200);
            res.end();
            return;
        }
        res.setHeader('Content-Type', 'application/json');
        if (pathname === '/activity/recent') {
            void this.handleActivityRecentEndpoint(parsedUrl, res);
            return;
        }
        switch (pathname) {
            case '/':
            case '/health':
                res.writeHead(200);
                res.end(JSON.stringify({
                    status: 'ok',
                    relay: 'running',
                    version: '1.0.0',
                    agents: this.agents.size,
                    channels: this.channels.size,
                    uptime: process.uptime(),
                    timestamp: new Date().toISOString(),
                }));
                break;
            case '/agents':
                res.writeHead(200);
                res.end(JSON.stringify(Array.from(this.agents.values())));
                break;
            case '/channels':
                res.writeHead(200);
                res.end(JSON.stringify(Array.from(this.channels.values())));
                break;
            case '/status':
                res.writeHead(200);
                res.end(JSON.stringify({
                    agents: Array.from(this.agents.values()),
                    channels: Array.from(this.channels.values()),
                    connections: this.sockets.size,
                    bridge: {
                        connected: this.bridge?.isConnected() || false,
                        gateEnabled: this.bridgeGateEnabled,
                        pendingRequests: this.pendingBridgeAgents.size,
                        approvedAgents: Array.from(this.approvedBridgeAgents),
                    },
                }));
                break;
            case '/bridge/pending':
                res.writeHead(200);
                res.end(JSON.stringify({
                    pending: this.getPendingBridgeRequests(),
                    gateEnabled: this.bridgeGateEnabled,
                }));
                break;
            case '/bridge/approve':
                if (req.method === 'POST') {
                    this.handleBridgeApproveRequest(req, res);
                }
                else {
                    res.writeHead(405);
                    res.end(JSON.stringify({ error: 'Method not allowed' }));
                }
                break;
            case '/bridge/deny':
                if (req.method === 'POST') {
                    this.handleBridgeDenyRequest(req, res);
                }
                else {
                    res.writeHead(405);
                    res.end(JSON.stringify({ error: 'Method not allowed' }));
                }
                break;
            case '/bridge/toggle':
                if (req.method === 'POST') {
                    this.handleBridgeToggleRequest(req, res);
                }
                else {
                    res.writeHead(405);
                    res.end(JSON.stringify({ error: 'Method not allowed' }));
                }
                break;
            default:
                res.writeHead(404);
                res.end(JSON.stringify({ error: 'Not found' }));
        }
    }
    /**
     * Handle POST /bridge/approve - Approve an agent for bridge access
     */
    handleBridgeApproveRequest(req, res) {
        let body = '';
        req.on('data', (chunk) => {
            body += chunk.toString();
        });
        req.on('end', () => {
            try {
                const operator = buildBridgeOperatorContext(req);
                const { agentId } = JSON.parse(body);
                if (!agentId) {
                    res.writeHead(400);
                    res.end(JSON.stringify({ error: 'Missing agentId' }));
                    return;
                }
                const success = this.approveBridgeAccess(agentId, operator);
                res.writeHead(success ? 200 : 404);
                res.end(JSON.stringify({
                    success,
                    agentId,
                    approvedAgents: Array.from(this.approvedBridgeAgents),
                    pending: this.getPendingBridgeRequests(),
                }));
            }
            catch (err) {
                res.writeHead(400);
                res.end(JSON.stringify({ error: 'Invalid JSON', details: String(err) }));
            }
        });
    }
    /**
     * Handle POST /bridge/deny - Deny an agent bridge access
     */
    handleBridgeDenyRequest(req, res) {
        let body = '';
        req.on('data', (chunk) => {
            body += chunk.toString();
        });
        req.on('end', () => {
            try {
                const operator = buildBridgeOperatorContext(req);
                const { agentId, reason } = JSON.parse(body);
                if (!agentId) {
                    res.writeHead(400);
                    res.end(JSON.stringify({ error: 'Missing agentId' }));
                    return;
                }
                const success = this.denyBridgeAccess(agentId, reason, {
                    ...operator,
                    reason: typeof reason === 'string' ? reason : null,
                });
                res.writeHead(success ? 200 : 404);
                res.end(JSON.stringify({
                    success,
                    agentId,
                    reason,
                    pending: this.getPendingBridgeRequests(),
                }));
            }
            catch (err) {
                res.writeHead(400);
                res.end(JSON.stringify({ error: 'Invalid JSON', details: String(err) }));
            }
        });
    }
    /**
     * Handle POST /bridge/toggle - Toggle bridge gate on/off
     */
    handleBridgeToggleRequest(req, res) {
        let body = '';
        req.on('data', (chunk) => {
            body += chunk.toString();
        });
        req.on('end', () => {
            try {
                const operator = buildBridgeOperatorContext(req);
                const { enabled } = JSON.parse(body);
                if (typeof enabled !== 'boolean') {
                    res.writeHead(400);
                    res.end(JSON.stringify({ error: 'Missing or invalid enabled field' }));
                    return;
                }
                this.setBridgeGateEnabled(enabled, operator);
                res.writeHead(200);
                res.end(JSON.stringify({
                    success: true,
                    gateEnabled: this.bridgeGateEnabled,
                    approvedAgents: Array.from(this.approvedBridgeAgents),
                    pending: this.getPendingBridgeRequests(),
                }));
            }
            catch (err) {
                res.writeHead(400);
                res.end(JSON.stringify({ error: 'Invalid JSON', details: String(err) }));
            }
        });
    }
    async handleActivityRecentEndpoint(parsedUrl, res) {
        if (!this.activityPersistenceEnabled || !this.activityRedis) {
            res.writeHead(503);
            res.end(JSON.stringify({
                error: 'Activity persistence is disabled',
                enabled: this.activityPersistenceEnabled,
            }));
            return;
        }
        const channelId = parsedUrl.searchParams.get('channel');
        const rawCount = parsedUrl.searchParams.get('count') || '100';
        const count = Math.min(Math.max(parseInt(rawCount, 10) || 100, 1), 500);
        const streamKey = channelId
            ? `${this.activityChannelPrefix}${channelId}`
            : this.activityStreamKey;
        try {
            const entries = await this.activityRedis.xrevrange(streamKey, '+', '-', 'COUNT', count);
            const events = entries.map((entry) => {
                const [streamId, flatFields] = entry;
                const fields = {};
                for (let i = 0; i < flatFields.length; i += 2) {
                    fields[flatFields[i]] = flatFields[i + 1];
                }
                return {
                    streamId,
                    ...this.parseActivityFields(fields),
                };
            });
            res.writeHead(200);
            res.end(JSON.stringify({
                stream: streamKey,
                count: events.length,
                events,
            }));
        }
        catch (err) {
            res.writeHead(500);
            res.end(JSON.stringify({
                error: 'Failed to read activity stream',
                details: err instanceof Error ? err.message : String(err),
            }));
        }
    }
    getOrCreateConversationManager(channelId) {
        let manager = this.conversationManagers.get(channelId);
        if (!manager) {
            console.log(`[Relay] initializing conversation state machine for ${channelId}`);
            manager = new conversation_state_machine_1.ConversationStateMachine(channelId);
            // Hook up state machine events
            manager.on('phase:changed', (event) => {
                TerminalFormatter_1.relay.phaseChanged(event.conversationId, event.from, event.to);
                // Broadcast phase change to channel
                this.broadcastToChannel(event.conversationId, {
                    id: `sys-${Date.now()}`,
                    type: 'CHANNEL_MESSAGE',
                    source: 'system',
                    channel: event.conversationId,
                    payload: {
                        type: 'system',
                        content: `Conversation phase changed to: ${event.to.toUpperCase()}`,
                        metadata: {
                            isSystemMessage: true,
                            phase: event.to,
                            previousPhase: event.from,
                        },
                    },
                    timestamp: Date.now(),
                });
            });
            this.conversationManagers.set(channelId, manager);
        }
        return manager;
    }
    setupWebSocket() {
        this.wss.on('connection', (ws, req) => {
            let agentId = null;
            TerminalFormatter_1.relay.newConnection(req.socket.remoteAddress);
            // Send welcome message
            this.send(ws, {
                type: 'WELCOME',
                payload: {
                    message: 'Connected to TNF Relay',
                    version: '1.0.0',
                    timestamp: Date.now(),
                },
            });
            // Handle messages
            ws.on('message', (data) => {
                try {
                    const message = JSON.parse(data.toString());
                    agentId = this.handleMessage(ws, message, agentId);
                }
                catch (e) {
                    console.error('[Relay] Invalid message:', e.message);
                    this.send(ws, { type: 'ERROR', payload: { message: 'Invalid JSON' } });
                }
            });
            // Handle disconnect
            ws.on('close', () => {
                if (agentId) {
                    this.handleAgentDisconnect(agentId);
                }
            });
            ws.on('error', (err) => {
                console.error('[Relay] WebSocket error:', err.message);
            });
        });
    }
    handleMessage(ws, message, currentAgentId) {
        // Forward to Redis Bridge
        if (this.bridge && currentAgentId && message.type !== 'PING') {
            void this.bridge.handleRelayMessage(message, currentAgentId);
        }
        let { type, payload, source, channel } = message;
        const agentId = source || currentAgentId;
        // Back-compat: map legacy REGISTER to AGENT_REGISTER
        if (type === 'REGISTER') {
            const regPayload = (payload || {});
            const regName = regPayload.name ||
                regPayload.clientType ||
                regPayload.type ||
                'Unknown Agent';
            const regId = regPayload.id ||
                regPayload.instanceId ||
                regName.replace(/\s+/g, '-').toLowerCase() ||
                `agent-${Date.now()}`;
            const converted = {
                ...message,
                type: 'AGENT_REGISTER',
                source: regId,
                payload: {
                    agent: {
                        id: regId,
                        name: regName,
                        platform: regPayload.type || regPayload.clientType || 'unknown',
                        status: 'active',
                        capabilities: regPayload.capabilities || [],
                        channels: regPayload.channels || [],
                        metadata: regPayload.metadata || {},
                    },
                },
            };
            return this.handleMessage(ws, converted, currentAgentId);
        }
        TerminalFormatter_1.relay.protocolMessage(type, agentId || null);
        switch (type) {
            case 'AGENT_REGISTER': {
                // Authenticate if token provided
                const token = payload?.token ||
                    message?.token;
                let verifiedToken = null;
                if (token && this.authService) {
                    console.log(`[Relay] Authenticating agent via JWT...`);
                    verifiedToken = this.authService.verifyToken(token);
                    if (!verifiedToken) {
                        console.warn(`[Relay] Authentication failed for agent. Invalid token.`);
                        this.send(ws, {
                            type: 'REGISTRATION_ERROR',
                            payload: {
                                error: 'Invalid or expired authentication token',
                                code: 'AUTH_FAILED',
                            },
                        });
                        return null;
                    }
                    console.log(`[Relay] ✅ Authenticated agent: ${verifiedToken.agentId}`);
                }
                const agentData = payload?.agent || {};
                const id = verifiedToken?.agentId || agentData.id || agentId || `agent-${Date.now()}`;
                const identity = buildRelayAgentIdentity({
                    id,
                    canonicalEntityId: agentData.canonicalEntityId,
                    operationalHandle: agentData.operationalHandle,
                    runtimeSessionId: agentData.runtimeSessionId,
                    aliases: agentData.aliases,
                });
                const agent = {
                    id,
                    canonicalEntityId: identity.canonicalEntityId,
                    operationalHandle: identity.operationalHandle,
                    runtimeSessionId: identity.runtimeSessionId,
                    aliases: identity.aliases,
                    name: verifiedToken?.name || agentData.name || 'Unknown Agent',
                    platform: verifiedToken?.platform || agentData.platform || 'unknown',
                    status: resolveRelayAgentStatus(agentData.status),
                    capabilities: verifiedToken?.capabilities || agentData.capabilities || [],
                    channels: agentData.channels || [],
                    connectedAt: Date.now(),
                    lastSeen: Date.now(),
                    metadata: (0, audit_1.attachAuditTrace)({
                        ...agentData.metadata,
                        authenticated: !!verifiedToken,
                    }, {
                        source: 'standalone-relay',
                        actor: identity.operationalHandle,
                        sessionId: identity.runtimeSessionId || id,
                        canonicalEntityId: identity.canonicalEntityId,
                        operationalHandle: identity.operationalHandle,
                        runtimeSessionId: identity.runtimeSessionId,
                    }),
                };
                this.agents.set(id, agent);
                this.sockets.set(id, ws);
                this.agentChannels.set(id, new Set(agent.channels));
                this.ensureBridgeSubscription(id);
                for (const channelId of agent.channels) {
                    this.syncAgentChannelMembership(id, channelId);
                }
                // Register capabilities
                for (const cap of agent.capabilities) {
                    this.subscriptionRegistry.register(id, `capability:${cap}`);
                }
                TerminalFormatter_1.relay.agentRegistered(agent.name, id, agent.platform, !!verifiedToken);
                this.emit('agent:registered', agent);
                // Send current state to new agent
                this.send(ws, {
                    type: 'AGENT_LIST',
                    payload: { agents: Array.from(this.agents.values()) },
                });
                this.send(ws, {
                    type: 'CHANNEL_LIST',
                    payload: { channels: Array.from(this.channels.values()) },
                });
                // Send registration confirmation with auth status
                this.send(ws, {
                    type: 'REGISTRATION_CONFIRMED',
                    payload: {
                        relayInfo: {
                            id: 'relay-standalone',
                            version: '1.0.0',
                            authenticated: !!verifiedToken,
                        },
                    },
                });
                // Notify other agents
                this.broadcast({
                    type: 'AGENT_STATUS',
                    payload: { agent },
                }, id);
                return id;
            }
            case 'AGENT_UNREGISTER': {
                if (agentId) {
                    this.handleAgentDisconnect(agentId);
                }
                return null;
            }
            case 'AGENT_LIST': {
                this.send(ws, {
                    type: 'AGENT_LIST',
                    payload: { agents: Array.from(this.agents.values()) },
                });
                break;
            }
            case 'CHANNEL_LIST': {
                this.send(ws, {
                    type: 'CHANNEL_LIST',
                    payload: { channels: Array.from(this.channels.values()) },
                });
                break;
            }
            case 'CHANNEL_CREATE': {
                const rawName = payload?.name || 'Unnamed Channel';
                const requestedName = rawName.trim();
                const normalizedRequested = requestedName.toLowerCase().replace(/\s+/g, ' ');
                // Check if a channel with this name already exists
                let existingChannel = null;
                for (const ch of this.channels.values()) {
                    const normalizedExisting = ch.name.trim().toLowerCase().replace(/\s+/g, ' ');
                    if (normalizedExisting === normalizedRequested) {
                        existingChannel = ch;
                        break;
                    }
                }
                if (existingChannel) {
                    // Channel exists - join it instead of creating duplicate
                    console.log(`[Relay] Channel '${requestedName}' (normalized: '${normalizedRequested}') already exists (${existingChannel.id}), joining instead`);
                    if (agentId && !existingChannel.members.includes(agentId)) {
                        existingChannel.members.push(agentId);
                    }
                    if (agentId) {
                        const myChannels = this.agentChannels.get(agentId) || new Set();
                        myChannels.add(existingChannel.id);
                        this.agentChannels.set(agentId, myChannels);
                    }
                    // Send confirmation with existing channel info
                    this.send(ws, {
                        type: 'CHANNEL_JOINED',
                        payload: { channel: existingChannel, wasExisting: true },
                    });
                }
                else {
                    // Create new channel
                    const channelId = `channel-${Date.now()}`;
                    const newChannel = {
                        id: channelId,
                        name: requestedName,
                        description: payload?.description || '',
                        createdBy: agentId || 'unknown',
                        createdAt: Date.now(),
                        isPrivate: payload?.isPrivate || false,
                        members: agentId ? [agentId] : [],
                    };
                    this.channels.set(channelId, newChannel);
                    if (agentId) {
                        const myChannels = this.agentChannels.get(agentId) || new Set();
                        myChannels.add(channelId);
                        this.agentChannels.set(agentId, myChannels);
                    }
                    // Send confirmation with new channel info
                    this.send(ws, {
                        type: 'CHANNEL_CREATED',
                        payload: { channel: newChannel },
                    });
                }
                this.broadcast({
                    type: 'CHANNEL_LIST',
                    payload: { channels: Array.from(this.channels.values()) },
                });
                break;
            }
            case 'CHANNEL_JOIN': {
                const channelId = payload?.channelId;
                if (agentId && channelId) {
                    this.syncAgentChannelMembership(agentId, channelId);
                }
                break;
            }
            case 'CHANNEL_LEAVE': {
                const channelId = payload?.channelId;
                const ch = this.channels.get(channelId);
                if (ch && agentId) {
                    ch.members = ch.members.filter((m) => m !== agentId);
                    const myChannels = this.agentChannels.get(agentId);
                    if (myChannels) {
                        myChannels.delete(channelId);
                    }
                }
                break;
            }
            case 'TASK_DISPATCH': {
                const task = payload?.task;
                const targetChannel = payload?.channelId || channel;
                if (task && targetChannel) {
                    this.dispatchTask(task, targetChannel);
                }
                break;
            }
            case 'CHANNEL_DELETE': {
                const channelId = payload?.channelId;
                if (this.channels.has(channelId)) {
                    this.channels.delete(channelId);
                    // Remove from all agent channel sets
                    this.agentChannels.forEach((channels) => channels.delete(channelId));
                    TerminalFormatter_1.relay.channelDeleted(channelId);
                    this.broadcast({
                        type: 'CHANNEL_LIST',
                        payload: { channels: Array.from(this.channels.values()) },
                    });
                }
                break;
            }
            case 'CHANNEL_PAUSE': {
                const channelId = payload?.channelId;
                if (channelId) {
                    const manager = this.getOrCreateConversationManager(channelId);
                    void manager.pause(); // async but we don't await
                    TerminalFormatter_1.relay.channelPaused(channelId);
                }
                break;
            }
            case 'CHANNEL_RESUME': {
                const channelId = payload?.channelId;
                if (channelId) {
                    const manager = this.getOrCreateConversationManager(channelId);
                    void manager.resume(); // async but we don't await
                    TerminalFormatter_1.relay.channelResumed(channelId);
                }
                break;
            }
            case 'MESSAGE_SEND': {
                const rawPayload = payload;
                const to = rawPayload.to;
                const content = rawPayload.content;
                const messageType = rawPayload.messageType;
                const metadata = rawPayload.metadata;
                const msg = {
                    id: `msg-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
                    type: messageType || 'text',
                    from: agentId || 'unknown',
                    to,
                    content,
                    channel,
                    timestamp: Date.now(),
                    metadata, // <-- PRESERVE metadata for loop prevention
                };
                this.emit('message', msg);
                void this.persistActivityMessage(message, msg);
                if (channel && agentId) {
                    this.syncAgentChannelMembership(agentId, channel);
                }
                // Track activity for stall detection (skip system messages)
                // Update conversation state if this is not a system message
                if (channel && !metadata?.isSystemMessage && !metadata?.isRecoveryAttempt) {
                    // Update conversation state machine
                    const manager = this.getOrCreateConversationManager(channel);
                    const currentPhase = manager.getPhase();
                    // 1. Check for Pause
                    if (currentPhase === conversation_state_machine_1.ConversationPhase.PAUSED) {
                        // Do NOT record activity or update stall detector when paused
                        console.log(`[Relay] Skipping activity record for paused channel: ${channel}`);
                    }
                    else {
                        // 2. Auto-start if in initializing phase (User sent a message, so start it!)
                        if (currentPhase === conversation_state_machine_1.ConversationPhase.INITIALIZING) {
                            console.log(`[Relay] Auto-starting conversation in channel: ${channel}`);
                            void manager.transition(conversation_state_machine_1.ConversationPhase.EXECUTION);
                        }
                        // 3. Record activity only if we are in an active phase
                        // (This prevents stall detector from firing on a conversation that hasn't really started or is finished)
                        if (currentPhase === conversation_state_machine_1.ConversationPhase.EXECUTION ||
                            currentPhase === conversation_state_machine_1.ConversationPhase.STALLED ||
                            currentPhase === conversation_state_machine_1.ConversationPhase.RECOVERY) {
                            // Only track as conversation content if there's actual message content
                            const msgPayload = message?.payload;
                            const hasMessageContent = !!msgPayload?.content;
                            this.stallDetector.recordActivity(channel, agentId || undefined, hasMessageContent);
                            void manager.recordActivity();
                        }
                    }
                }
                if (to === 'broadcast') {
                    if (channel) {
                        // Broadcast to channel members
                        const ch = this.ensureChannelExists(channel, {
                            createdBy: agentId || 'unknown',
                            description: 'Auto-created from relay message traffic',
                        });
                        if (ch) {
                            ch.members.forEach((memberId) => {
                                const memberWs = this.sockets.get(memberId);
                                if (memberWs && memberWs.readyState === ws_1.default.OPEN) {
                                    this.send(memberWs, {
                                        type: 'CHANNEL_MESSAGE',
                                        payload: msg,
                                    });
                                }
                            });
                        }
                    }
                    else {
                        // Broadcast to all
                        this.broadcast({
                            type: 'MESSAGE_RECEIVE',
                            payload: msg,
                        });
                    }
                }
                else if (to) {
                    // Direct message
                    const targetWs = this.sockets.get(to);
                    if (targetWs && targetWs.readyState === ws_1.default.OPEN) {
                        this.send(targetWs, {
                            type: 'MESSAGE_RECEIVE',
                            payload: msg,
                        });
                    }
                }
                break;
            }
            case 'HEARTBEAT': {
                const agent = agentId ? this.agents.get(agentId) : null;
                if (agent) {
                    agent.lastSeen = Date.now();
                    agent.status = resolveRelayAgentStatus('active');
                }
                break;
            }
            case 'AGENT_METADATA_UPDATE': {
                const agentInfo = payload?.agent;
                if (agentInfo) {
                    // Update agent logic... we need to be careful with types here
                    // For now, let's assume agentInfo is partial update
                }
                break;
            }
            default:
                console.log(`[Relay] Unknown message type: ${type}`);
        }
        return currentAgentId;
    }
    shouldPersistActivityMessage(rawMessage, msg) {
        const messageType = msg.type || '';
        const metadata = msg.metadata || {};
        const eventType = metadata.eventType;
        return (msg.channel === 'fuse-activity-log' ||
            messageType === 'event' ||
            messageType === 'activity' ||
            typeof eventType === 'string');
    }
    async persistActivityMessage(rawMessage, msg) {
        if (!this.activityPersistenceEnabled || (!this.activityRedis && !this.activityUpstash)) {
            return;
        }
        if (!this.shouldPersistActivityMessage(rawMessage, msg)) {
            return;
        }
        const payload = (rawMessage.payload || {});
        const metadata = (msg.metadata || {});
        const agent = this.agents.get(msg.from);
        const auditedMetadata = (0, audit_1.attachAuditTrace)(metadata, {
            source: 'standalone-relay',
            actor: agent?.operationalHandle || msg.from || 'unknown',
            channelId: msg.channel,
            sessionId: agent?.runtimeSessionId || msg.from || undefined,
            canonicalEntityId: agent?.canonicalEntityId,
            operationalHandle: agent?.operationalHandle || msg.from || undefined,
            runtimeSessionId: agent?.runtimeSessionId || msg.from || undefined,
        });
        const activityChannel = typeof auditedMetadata.activityChannel === 'string' && auditedMetadata.activityChannel
            ? auditedMetadata.activityChannel
            : undefined;
        const resolvedChannel = activityChannel || msg.channel;
        const event = {
            id: msg.id,
            relayTimestamp: Date.now(),
            originalTimestamp: typeof rawMessage.timestamp === 'number'
                ? rawMessage.timestamp
                : typeof payload.timestamp === 'number'
                    ? payload.timestamp
                    : undefined,
            type: msg.type,
            eventType: typeof auditedMetadata.eventType === 'string' ? auditedMetadata.eventType : undefined,
            source: msg.from,
            channel: msg.channel,
            activityChannel: activityChannel,
            content: msg.content,
            metadata: auditedMetadata,
        };
        const fields = {
            id: event.id,
            relayTimestamp: String(event.relayTimestamp),
            type: event.type,
            source: event.source,
            channel: event.channel || '',
            activityChannel: event.activityChannel || '',
            content: event.content || '',
            metadata: JSON.stringify(event.metadata || {}),
        };
        if (typeof event.originalTimestamp === 'number') {
            fields.originalTimestamp = String(event.originalTimestamp);
        }
        if (typeof event.eventType === 'string' && event.eventType) {
            fields.eventType = event.eventType;
        }
        try {
            if (this.activityUpstash) {
                // Upstash REST doesn't support streams (XADD) natively via the main API in some versions,
                // but we can use simple HSET/LPUSH. For simplicity and breadth, we use LPUSH for history.
                const payloadStr = JSON.stringify(fields);
                await this.activityUpstash.lpush(this.activityStreamKey, payloadStr);
                await this.activityUpstash.ltrim(this.activityStreamKey, 0, this.activityMaxLen);
                if (resolvedChannel) {
                    await this.activityUpstash.lpush(`${this.activityChannelPrefix}${resolvedChannel}`, payloadStr);
                    await this.activityUpstash.ltrim(`${this.activityChannelPrefix}${resolvedChannel}`, 0, this.activityMaxLen);
                }
            }
            else if (this.activityRedis) {
                const flatFields = Object.entries(fields).flat();
                const streamId = await this.activityRedis.xadd(this.activityStreamKey, 'MAXLEN', '~', this.activityMaxLen, '*', ...flatFields);
                event.streamId = streamId || '';
                if (resolvedChannel) {
                    await this.activityRedis.xadd(`${this.activityChannelPrefix}${resolvedChannel}`, 'MAXLEN', '~', this.activityMaxLen, '*', ...flatFields);
                }
            }
        }
        catch (err) {
            console.error('[Relay] Failed to persist activity event:', err instanceof Error ? err.message : String(err));
        }
    }
    parseActivityFields(fields) {
        let parsedMetadata;
        const metadata = fields.metadata;
        if (metadata) {
            try {
                parsedMetadata = JSON.parse(metadata);
            }
            catch {
                parsedMetadata = { raw: metadata };
            }
        }
        return {
            id: fields.id || '',
            relayTimestamp: parseInt(fields.relayTimestamp || '0', 10),
            originalTimestamp: fields.originalTimestamp
                ? parseInt(fields.originalTimestamp, 10)
                : undefined,
            type: fields.type || 'event',
            eventType: fields.eventType || undefined,
            source: fields.source || 'unknown',
            channel: fields.channel || undefined,
            activityChannel: fields.activityChannel || undefined,
            content: fields.content || '',
            metadata: parsedMetadata,
        };
    }
    async ensureActivityPersistenceReady() {
        if (!this.activityPersistenceEnabled) {
            if (this.activityPersistenceRequired) {
                throw new Error('Activity persistence is disabled. Set ENABLE_ACTIVITY_PERSISTENCE=true or ACTIVITY_PERSISTENCE_REQUIRED=false.');
            }
            return;
        }
        if (!this.activityRedis || !this.activityRedisConnectPromise) {
            if (this.activityPersistenceRequired) {
                throw new Error('Activity persistence Redis client is unavailable');
            }
            return;
        }
        try {
            await this.activityRedisConnectPromise;
        }
        catch (err) {
            if (this.activityPersistenceRequired) {
                throw new Error(`Activity persistence Redis connection failed: ${err instanceof Error ? err.message : String(err)}`);
            }
        }
    }
    handleAgentDisconnect(agentId) {
        TerminalFormatter_1.relay.agentDisconnected(agentId);
        const agent = this.agents.get(agentId);
        this.agents.delete(agentId);
        this.sockets.delete(agentId);
        // Remove agent from all channel member lists
        const agentChannelSet = this.agentChannels.get(agentId);
        if (agentChannelSet) {
            for (const channelId of agentChannelSet) {
                const channel = this.channels.get(channelId);
                if (channel) {
                    channel.members = channel.members.filter((m) => m !== agentId);
                }
            }
        }
        this.agentChannels.delete(agentId);
        this.subscriptionRegistry.clearAgent(agentId);
        if (this.bridge && this.bridgeSubscribedAgents.has(agentId)) {
            this.bridgeSubscribedAgents.delete(agentId);
            void this.bridge
                .unsubscribeFromAgent(agentId)
                .catch((err) => console.warn(`[Relay] Failed to unsubscribe bridge channel for ${agentId}:`, err instanceof Error ? err.message : String(err)));
        }
        // Notify others
        this.broadcast({
            type: 'AGENT_STATUS',
            payload: {
                agent: {
                    id: agentId,
                    canonicalEntityId: agent?.canonicalEntityId,
                    operationalHandle: agent?.operationalHandle,
                    runtimeSessionId: agent?.runtimeSessionId,
                    aliases: agent?.aliases,
                    status: 'offline',
                    name: agent?.name,
                },
            },
        });
        this.emit('agent:disconnected', { agentId, agent });
    }
    send(ws, message) {
        if (ws.readyState === ws_1.default.OPEN) {
            ws.send(JSON.stringify({
                id: message.id || `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
                timestamp: Date.now(),
                ...message,
            }));
        }
    }
    handleBridgeEgress(envelope) {
        const payload = envelope.payload;
        const payloadMetadata = typeof payload.metadata === 'object' && payload.metadata
            ? payload.metadata
            : {};
        const envelopeMetadata = typeof envelope.metadata === 'object' && envelope.metadata
            ? envelope.metadata
            : undefined;
        const payloadChannel = typeof payload.channel === 'string'
            ? payload.channel
            : typeof payload.activityChannel === 'string'
                ? payload.activityChannel
                : undefined;
        const channelId = envelope.context?.channelId || payloadChannel;
        if (channelId) {
            this.ensureChannelExists(channelId, {
                createdBy: 'redis-bridge',
                description: 'Auto-created from Redis bridge traffic',
            });
            const fromAgentId = envelope.from?.agentId;
            if (fromAgentId) {
                this.syncAgentChannelMembership(fromAgentId, channelId);
            }
            if ('agentId' in envelope.to && envelope.to.agentId) {
                this.syncAgentChannelMembership(envelope.to.agentId, channelId);
            }
        }
        // Convert TNF Envelope back to Protocol Message format for WebSocket clients
        const protocolMsg = {
            id: envelope.id,
            type: envelope.type === 'event' ? 'CHANNEL_MESSAGE' : 'MESSAGE_RECEIVE', // Map to existing types
            source: envelope.from.agentId,
            channel: channelId,
            payload: envelopeMetadata
                ? {
                    ...payload,
                    metadata: {
                        ...payloadMetadata,
                        ...envelopeMetadata,
                    },
                }
                : envelope.payload,
            timestamp: new Date(envelope.timestamp).getTime(),
            metadata: envelopeMetadata,
        };
        // Determine routing
        if ('broadcast' in envelope.to && envelope.to.broadcast) {
            // Broadcast to channel if specified, otherwise global
            if (channelId) {
                this.broadcastToChannel(channelId, protocolMsg);
            }
            else {
                this.broadcast(protocolMsg);
            }
        }
        else if ('agentId' in envelope.to) {
            // Direct message to specific agent
            const targetSocket = this.sockets.get(envelope.to.agentId);
            if (targetSocket && targetSocket.readyState === ws_1.default.OPEN) {
                targetSocket.send(JSON.stringify(protocolMsg));
            }
        }
    }
    dispatchTask(task, channelId) {
        TerminalFormatter_1.relay.taskDispatched(task.id, channelId);
        void this.persistTaskDispatch(task, channelId);
        // If specific targets are defined, prioritize them
        if (task.targetAgents && task.targetAgents.length > 0) {
            for (const targetAgentId of task.targetAgents) {
                const targetSocket = this.sockets.get(targetAgentId);
                if (targetSocket && targetSocket.readyState === ws_1.default.OPEN) {
                    this.send(targetSocket, {
                        type: 'TASK_ASSIGN',
                        payload: { task },
                        channel: channelId,
                        timestamp: Date.now(),
                    });
                }
            }
        }
        else if (task.requiredCapabilities && task.requiredCapabilities.length > 0) {
            // Filter by capabilities
            const channel = this.channels.get(channelId);
            let dispatched = false;
            if (channel) {
                const capableAgents = channel.members.filter((agentId) => {
                    return (task.requiredCapabilities?.every((cap) => {
                        const subscribers = this.subscriptionRegistry.getSubscribers(`capability:${cap}`);
                        return subscribers.includes(agentId);
                    }) ?? false);
                });
                if (capableAgents.length > 0) {
                    console.log(`[Relay] Dispatching task via capabilities to: ${capableAgents.join(', ')}`);
                    capableAgents.forEach((agentId) => {
                        const ws = this.sockets.get(agentId);
                        if (ws && ws.readyState === ws_1.default.OPEN) {
                            this.send(ws, {
                                type: 'TASK_ASSIGN',
                                payload: { task },
                                channel: channelId,
                                timestamp: Date.now(),
                            });
                        }
                    });
                    dispatched = true;
                }
            }
            if (!dispatched) {
                console.log(`[Relay] No agents with required capabilities found. Broadcasting to channel.`);
                // Fallback to broadcast
                this.broadcastToChannel(channelId, {
                    type: 'TASK_ASSIGN',
                    payload: { task },
                    channel: channelId,
                    timestamp: Date.now(),
                });
            }
        }
        else {
            // Otherwise, broadcast to channel
            this.broadcastToChannel(channelId, {
                type: 'TASK_ASSIGN',
                payload: { task },
                channel: channelId,
                timestamp: Date.now(),
            });
        }
    }
    async persistTaskDispatch(task, channelId) {
        const ingestUrl = process.env.LEDGER_INTERNAL_INGEST_URL ||
            process.env.LEDGER_INGEST_URL ||
            'http://localhost:3001/api/unified-ledger/internal/ingest/orchestration';
        const internalSecret = process.env.TNF_INTERNAL_INGEST_SECRET || process.env.UNIFIED_LEDGER_INTERNAL_SECRET;
        const headers = { 'Content-Type': 'application/json' };
        if (internalSecret) {
            headers['x-tnf-internal-secret'] = internalSecret;
        }
        try {
            await globalThis.fetch(ingestUrl, {
                method: 'POST',
                headers,
                body: JSON.stringify({
                    type: 'TASK_DISPATCH',
                    action: 'relay_dispatch',
                    channelId,
                    task,
                }),
            });
        }
        catch (error) {
            console.warn('[Relay] Failed to persist task dispatch to unified ledger:', error);
        }
    }
    broadcastToChannel(channelId, message) {
        const channel = this.channels.get(channelId);
        if (!channel) {
            return;
        }
        channel.members.forEach((memberId) => {
            const socket = this.sockets.get(memberId);
            if (socket && socket.readyState === ws_1.default.OPEN) {
                socket.send(JSON.stringify(message));
            }
        });
    }
    broadcast(message, excludeAgentId) {
        const data = JSON.stringify({
            id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            timestamp: Date.now(),
            ...message,
        });
        this.sockets.forEach((ws, agentId) => {
            if (agentId !== excludeAgentId && ws.readyState === ws_1.default.OPEN) {
                ws.send(data);
            }
        });
    }
    toChannelDisplayName(channelId) {
        const compact = channelId.trim();
        if (!compact) {
            return 'Auto Channel';
        }
        return compact
            .replace(/^channel-/, '')
            .replace(/[-_]+/g, ' ')
            .replace(/\s+/g, ' ')
            .trim()
            .replace(/\b\w/g, (m) => m.toUpperCase());
    }
    ensureChannelExists(channelId, options) {
        const normalized = (channelId || '').trim();
        if (!normalized) {
            return null;
        }
        let channel = this.channels.get(normalized);
        if (!channel) {
            channel = {
                id: normalized,
                name: options?.name || this.toChannelDisplayName(normalized),
                description: options?.description || 'Auto-synced channel',
                createdBy: options?.createdBy || 'system',
                createdAt: Date.now(),
                isPrivate: options?.isPrivate || false,
                members: [],
            };
            this.channels.set(normalized, channel);
            console.log(`[Relay] Auto-created channel: ${normalized} (${channel.name})`);
            this.broadcast({
                type: 'CHANNEL_LIST',
                payload: { channels: Array.from(this.channels.values()) },
            });
        }
        return channel;
    }
    syncAgentChannelMembership(agentId, channelId) {
        const channel = this.ensureChannelExists(channelId);
        if (!channel) {
            return;
        }
        if (!channel.members.includes(agentId)) {
            channel.members.push(agentId);
        }
        const myChannels = this.agentChannels.get(agentId) || new Set();
        if (!myChannels.has(channel.id)) {
            myChannels.add(channel.id);
            this.agentChannels.set(agentId, myChannels);
        }
        const agent = this.agents.get(agentId);
        if (agent && !agent.channels.includes(channel.id)) {
            agent.channels.push(channel.id);
        }
    }
    syncBridgeSubscriptions() {
        for (const agentId of this.agents.keys()) {
            this.ensureBridgeSubscription(agentId);
        }
    }
    ensureBridgeSubscription(agentId, attempt = 0) {
        if (!this.bridge) {
            return;
        }
        // Gate check: if gating is enabled, only approved agents can bridge
        if (this.bridgeGateEnabled && !this.approvedBridgeAgents.has(agentId)) {
            // Agent is not approved - they are in the "waiting area"
            const agent = this.agents.get(agentId);
            const socket = this.sockets.get(agentId);
            if (agent && socket && !this.pendingBridgeAgents.has(agentId)) {
                this.pendingBridgeAgents.set(agentId, { agent, socket, requestedAt: Date.now() });
                console.log('[Relay] Agent ' + agentId + ' (' + agent.name + ') is waiting at the bridge gate');
                // Notify the agent they are pending approval
                this.send(socket, {
                    type: 'BRIDGE_PENDING',
                    payload: {
                        message: 'Waiting for bridge access approval',
                        agentId,
                        requestedAt: Date.now(),
                    },
                });
                // Notify operators/admins (broadcast to all for now - could be filtered)
                this.broadcast({
                    type: 'BRIDGE_ACCESS_REQUEST',
                    payload: {
                        agentId,
                        agentName: agent.name,
                        platform: agent.platform,
                        requestedAt: Date.now(),
                    },
                });
            }
            return;
        }
        if (this.bridgeSubscribedAgents.has(agentId)) {
            return;
        }
        if (!this.bridge.isConnected()) {
            if (attempt < 10) {
                setTimeout(() => this.ensureBridgeSubscription(agentId, attempt + 1), 500);
            }
            return;
        }
        void this.bridge
            .subscribeToAgent(agentId, () => {
            // No-op callback; bridge emits global 'egress' events that we handle centrally.
        })
            .then(() => {
            this.bridgeSubscribedAgents.add(agentId);
            console.log('[Relay] Agent ' + agentId + ' subscribed to bridge egress');
            // Notify the agent they are connected
            const socket = this.sockets.get(agentId);
            if (socket) {
                this.send(socket, {
                    type: 'BRIDGE_CONNECTED',
                    payload: { agentId, connectedAt: Date.now() },
                });
            }
        })
            .catch((err) => {
            if (attempt < 10) {
                setTimeout(() => this.ensureBridgeSubscription(agentId, attempt + 1), 500);
                return;
            }
            console.error('[Relay] Failed to subscribe bridge egress for ' + agentId + ':', err instanceof Error ? err.message : String(err));
        });
    }
    emitRelayActivityEvent(eventType, content, metadata, operator = { actor: 'relay-admin-http' }) {
        const channelId = 'fuse-activity-log';
        const timestamp = Date.now();
        const auditedMetadata = (0, audit_1.attachAuditTrace)({
            isSystemMessage: true,
            source: 'RELAY',
            eventType,
            activityChannel: channelId,
            ...metadata,
        }, {
            source: 'standalone-relay',
            actor: operator.actor || 'relay-admin-http',
            channelId,
            sessionId: operator.actor || 'relay-admin-http',
            operationalHandle: operator.actor || 'relay-admin-http',
            runtimeSessionId: operator.actor || 'relay-admin-http',
        });
        const msg = {
            id: `relay-activity-${timestamp}-${Math.random().toString(36).slice(2, 11)}`,
            type: 'event',
            from: 'relay-system',
            to: 'broadcast',
            content,
            channel: channelId,
            timestamp,
            metadata: auditedMetadata,
        };
        const protocolMsg = {
            id: msg.id,
            type: 'CHANNEL_MESSAGE',
            source: msg.from,
            channel: channelId,
            payload: msg,
            timestamp,
            metadata: auditedMetadata,
        };
        this.ensureChannelExists(channelId, {
            createdBy: 'relay-system',
            description: 'Relay activity log',
        });
        void this.persistActivityMessage(protocolMsg, msg);
        void this.persistRelayActivityTimelineEvent(eventType, content, timestamp, auditedMetadata, operator);
        this.broadcastToChannel(channelId, protocolMsg);
    }
    async persistRelayActivityTimelineEvent(eventType, content, timestamp, metadata, operator) {
        const timelineUrl = process.env.LEDGER_INTERNAL_TIMELINE_URL ||
            process.env.LEDGER_TIMELINE_URL ||
            'http://localhost:3001/api/timeline/internal/events';
        const internalSecret = process.env.TNF_INTERNAL_INGEST_SECRET || process.env.UNIFIED_LEDGER_INTERNAL_SECRET;
        const headers = { 'Content-Type': 'application/json' };
        if (internalSecret) {
            headers['x-tnf-internal-secret'] = internalSecret;
        }
        try {
            await globalThis.fetch(timelineUrl, {
                method: 'POST',
                headers,
                body: JSON.stringify({
                    userId: process.env.TNF_INTERNAL_TIMELINE_USER_ID,
                    eventType: 'historical_event',
                    actor: operator.actor || 'relay-admin-http',
                    timestamp: new Date(timestamp).toISOString(),
                    payload: {
                        source: 'standalone-relay',
                        relayEventType: eventType,
                        content,
                        metadata,
                    },
                }),
            });
        }
        catch (error) {
            console.warn('[Relay] Failed to persist relay activity timeline event:', error);
        }
    }
    /**
     * Approve an agent for bridge access (operator action)
     */
    approveBridgeAccess(agentId, operator = { actor: 'relay-admin-http' }) {
        const pending = this.pendingBridgeAgents.get(agentId);
        const agent = pending?.agent || this.agents.get(agentId);
        if (!pending && !agent) {
            console.warn('[Relay] Cannot approve unknown agent: ' + agentId);
            return false;
        }
        this.approvedBridgeAgents.add(agentId);
        this.pendingBridgeAgents.delete(agentId);
        console.log('[Relay] Agent ' + agentId + ' approved for bridge access');
        // Subscribe them to the bridge
        this.ensureBridgeSubscription(agentId);
        // Notify the agent
        const socket = this.sockets.get(agentId);
        if (socket) {
            this.send(socket, {
                type: 'BRIDGE_APPROVED',
                payload: { agentId, approvedAt: Date.now() },
            });
        }
        this.emitRelayActivityEvent('bridge_access_approved', `Approved bridge access for ${agentId}`, {
            bridgeDecision: 'approve',
            agentId,
            agentName: agent?.name || null,
            platform: agent?.platform || null,
            gateEnabled: this.bridgeGateEnabled,
            pendingCount: this.pendingBridgeAgents.size,
            approvedCount: this.approvedBridgeAgents.size,
            remoteAddress: operator.remoteAddress || null,
            userAgent: operator.userAgent || null,
            operatorReason: operator.reason || null,
        }, operator);
        return true;
    }
    /**
     * Deny an agent bridge access (operator action)
     */
    denyBridgeAccess(agentId, reason, operator = { actor: 'relay-admin-http' }) {
        const pending = this.pendingBridgeAgents.get(agentId);
        if (!pending) {
            console.warn('[Relay] No pending bridge request for agent: ' + agentId);
            return false;
        }
        this.pendingBridgeAgents.delete(agentId);
        console.log('[Relay] Agent ' + agentId + ' denied bridge access');
        // Notify the agent
        const socket = this.sockets.get(agentId);
        if (socket) {
            this.send(socket, {
                type: 'BRIDGE_DENIED',
                payload: { agentId, reason: reason || 'Access denied by operator', deniedAt: Date.now() },
            });
        }
        this.emitRelayActivityEvent('bridge_access_denied', `Denied bridge access for ${agentId}`, {
            bridgeDecision: 'deny',
            agentId,
            agentName: pending.agent?.name || null,
            platform: pending.agent?.platform || null,
            gateEnabled: this.bridgeGateEnabled,
            pendingCount: this.pendingBridgeAgents.size,
            approvedCount: this.approvedBridgeAgents.size,
            reason: reason || 'Access denied by operator',
            remoteAddress: operator.remoteAddress || null,
            userAgent: operator.userAgent || null,
            operatorReason: operator.reason || null,
        }, {
            ...operator,
            reason: reason || operator.reason || null,
        });
        return true;
    }
    /**
     * Get list of pending bridge access requests
     */
    getPendingBridgeRequests() {
        return Array.from(this.pendingBridgeAgents.values()).map(({ agent, requestedAt }) => ({
            agentId: agent.id,
            name: agent.name,
            platform: agent.platform,
            requestedAt,
        }));
    }
    /**
     * Toggle bridge gate on/off
     */
    setBridgeGateEnabled(enabled, operator = { actor: 'relay-admin-http' }) {
        const previousEnabled = this.bridgeGateEnabled;
        this.bridgeGateEnabled = enabled;
        console.log('[Relay] Bridge gate ' + (enabled ? 'ENABLED' : 'DISABLED'));
        this.emitRelayActivityEvent('bridge_gate_toggled', `Bridge gate ${enabled ? 'enabled' : 'disabled'}`, {
            bridgeDecision: 'toggle',
            enabled,
            previousEnabled,
            pendingCount: this.pendingBridgeAgents.size,
            approvedCount: this.approvedBridgeAgents.size,
            remoteAddress: operator.remoteAddress || null,
            userAgent: operator.userAgent || null,
            operatorReason: operator.reason || null,
        }, operator);
        // If disabling, auto-approve all pending
        if (!enabled) {
            for (const [agentId] of this.pendingBridgeAgents) {
                this.approveBridgeAccess(agentId, {
                    ...operator,
                    reason: operator.reason || 'gate_disabled_auto_approve',
                });
            }
        }
    }
    /**
     * Approve an agent for bridge access (operator action)
     */
    approveBridgeAccess(agentId) {
        const pending = this.pendingBridgeAgents.get(agentId);
        if (!pending && !this.agents.has(agentId)) {
            console.warn('[Relay] Cannot approve unknown agent: ' + agentId);
            return false;
        }
        this.approvedBridgeAgents.add(agentId);
        this.pendingBridgeAgents.delete(agentId);
        console.log('[Relay] Agent ' + agentId + ' approved for bridge access');
        // Subscribe them to the bridge
        this.ensureBridgeSubscription(agentId);
        // Notify the agent
        const socket = this.sockets.get(agentId);
        if (socket) {
            this.send(socket, {
                type: 'BRIDGE_APPROVED',
                payload: { agentId, approvedAt: Date.now() },
            });
        }
        return true;
    }
    /**
     * Deny an agent bridge access (operator action)
     */
    denyBridgeAccess(agentId, reason) {
        const pending = this.pendingBridgeAgents.get(agentId);
        if (!pending) {
            console.warn('[Relay] No pending bridge request for agent: ' + agentId);
            return false;
        }
        this.pendingBridgeAgents.delete(agentId);
        console.log('[Relay] Agent ' + agentId + ' denied bridge access');
        // Notify the agent
        const socket = this.sockets.get(agentId);
        if (socket) {
            this.send(socket, {
                type: 'BRIDGE_DENIED',
                payload: { agentId, reason: reason || 'Access denied by operator', deniedAt: Date.now() },
            });
        }
        return true;
    }
    /**
     * Get list of pending bridge access requests
     */
    getPendingBridgeRequests() {
        return Array.from(this.pendingBridgeAgents.values()).map(({ agent, requestedAt }) => ({
            agentId: agent.id,
            name: agent.name,
            platform: agent.platform,
            requestedAt,
        }));
    }
    /**
     * Toggle bridge gate on/off
     */
    setBridgeGateEnabled(enabled) {
        this.bridgeGateEnabled = enabled;
        console.log('[Relay] Bridge gate ' + (enabled ? 'ENABLED' : 'DISABLED'));
        // If disabling, auto-approve all pending
        if (!enabled) {
            for (const [agentId] of this.pendingBridgeAgents) {
                this.approveBridgeAccess(agentId);
            }
        }
    }
    /**
     * Approve an agent for bridge access (operator action)
     */
    approveBridgeAccess(agentId) {
        const pending = this.pendingBridgeAgents.get(agentId);
        if (!pending && !this.agents.has(agentId)) {
            console.warn('[Relay] Cannot approve unknown agent: ' + agentId);
            return false;
        }
        this.approvedBridgeAgents.add(agentId);
        this.pendingBridgeAgents.delete(agentId);
        console.log('[Relay] Agent ' + agentId + ' approved for bridge access');
        // Subscribe them to the bridge
        this.ensureBridgeSubscription(agentId);
        // Notify the agent
        const socket = this.sockets.get(agentId);
        if (socket) {
            this.send(socket, {
                type: 'BRIDGE_APPROVED',
                payload: { agentId, approvedAt: Date.now() },
            });
        }
        return true;
    }
    /**
     * Deny an agent bridge access (operator action)
     */
    denyBridgeAccess(agentId, reason) {
        const pending = this.pendingBridgeAgents.get(agentId);
        if (!pending) {
            console.warn('[Relay] No pending bridge request for agent: ' + agentId);
            return false;
        }
        this.pendingBridgeAgents.delete(agentId);
        console.log('[Relay] Agent ' + agentId + ' denied bridge access');
        // Notify the agent
        const socket = this.sockets.get(agentId);
        if (socket) {
            this.send(socket, {
                type: 'BRIDGE_DENIED',
                payload: { agentId, reason: reason || 'Access denied by operator', deniedAt: Date.now() },
            });
        }
        return true;
    }
    /**
     * Get list of pending bridge access requests
     */
    getPendingBridgeRequests() {
        return Array.from(this.pendingBridgeAgents.values()).map(({ agent, requestedAt }) => ({
            agentId: agent.id,
            name: agent.name,
            platform: agent.platform,
            requestedAt,
        }));
    }
    /**
     * Toggle bridge gate on/off
     */
    setBridgeGateEnabled(enabled) {
        this.bridgeGateEnabled = enabled;
        console.log('[Relay] Bridge gate ' + (enabled ? 'ENABLED' : 'DISABLED'));
        // If disabling, auto-approve all pending
        if (!enabled) {
            for (const [agentId] of this.pendingBridgeAgents) {
                this.approveBridgeAccess(agentId);
            }
        }
    }
    /**
     * Approve an agent for bridge access (operator action)
     */
    approveBridgeAccess(agentId) {
        const pending = this.pendingBridgeAgents.get(agentId);
        if (!pending && !this.agents.has(agentId)) {
            console.warn('[Relay] Cannot approve unknown agent: ' + agentId);
            return false;
        }
        this.approvedBridgeAgents.add(agentId);
        this.pendingBridgeAgents.delete(agentId);
        console.log('[Relay] Agent ' + agentId + ' approved for bridge access');
        // Subscribe them to the bridge
        this.ensureBridgeSubscription(agentId);
        // Notify the agent
        const socket = this.sockets.get(agentId);
        if (socket) {
            this.send(socket, {
                type: 'BRIDGE_APPROVED',
                payload: { agentId, approvedAt: Date.now() },
            });
        }
        return true;
    }
    /**
     * Deny an agent bridge access (operator action)
     */
    denyBridgeAccess(agentId, reason) {
        const pending = this.pendingBridgeAgents.get(agentId);
        if (!pending) {
            console.warn('[Relay] No pending bridge request for agent: ' + agentId);
            return false;
        }
        this.pendingBridgeAgents.delete(agentId);
        console.log('[Relay] Agent ' + agentId + ' denied bridge access');
        // Notify the agent
        const socket = this.sockets.get(agentId);
        if (socket) {
            this.send(socket, {
                type: 'BRIDGE_DENIED',
                payload: { agentId, reason: reason || 'Access denied by operator', deniedAt: Date.now() },
            });
        }
        return true;
    }
    /**
     * Get list of pending bridge access requests
     */
    getPendingBridgeRequests() {
        return Array.from(this.pendingBridgeAgents.values()).map(({ agent, requestedAt }) => ({
            agentId: agent.id,
            name: agent.name,
            platform: agent.platform,
            requestedAt,
        }));
    }
    /**
     * Toggle bridge gate on/off
     */
    setBridgeGateEnabled(enabled) {
        this.bridgeGateEnabled = enabled;
        console.log('[Relay] Bridge gate ' + (enabled ? 'ENABLED' : 'DISABLED'));
        // If disabling, auto-approve all pending
        if (!enabled) {
            for (const [agentId] of this.pendingBridgeAgents) {
                this.approveBridgeAccess(agentId);
            }
        }
    }
    /**
     * Approve an agent for bridge access (operator action)
     */
    approveBridgeAccess(agentId) {
        const pending = this.pendingBridgeAgents.get(agentId);
        if (!pending && !this.agents.has(agentId)) {
            console.warn('[Relay] Cannot approve unknown agent: ' + agentId);
            return false;
        }
        this.approvedBridgeAgents.add(agentId);
        this.pendingBridgeAgents.delete(agentId);
        console.log('[Relay] Agent ' + agentId + ' approved for bridge access');
        // Subscribe them to the bridge
        this.ensureBridgeSubscription(agentId);
        // Notify the agent
        const socket = this.sockets.get(agentId);
        if (socket) {
            this.send(socket, {
                type: 'BRIDGE_APPROVED',
                payload: { agentId, approvedAt: Date.now() },
            });
        }
        return true;
    }
    /**
     * Deny an agent bridge access (operator action)
     */
    denyBridgeAccess(agentId, reason) {
        const pending = this.pendingBridgeAgents.get(agentId);
        if (!pending) {
            console.warn('[Relay] No pending bridge request for agent: ' + agentId);
            return false;
        }
        this.pendingBridgeAgents.delete(agentId);
        console.log('[Relay] Agent ' + agentId + ' denied bridge access');
        // Notify the agent
        const socket = this.sockets.get(agentId);
        if (socket) {
            this.send(socket, {
                type: 'BRIDGE_DENIED',
                payload: { agentId, reason: reason || 'Access denied by operator', deniedAt: Date.now() },
            });
        }
        return true;
    }
    /**
     * Get list of pending bridge access requests
     */
    getPendingBridgeRequests() {
        return Array.from(this.pendingBridgeAgents.values()).map(({ agent, requestedAt }) => ({
            agentId: agent.id,
            name: agent.name,
            platform: agent.platform,
            requestedAt,
        }));
    }
    /**
     * Toggle bridge gate on/off
     */
    setBridgeGateEnabled(enabled) {
        this.bridgeGateEnabled = enabled;
        console.log('[Relay] Bridge gate ' + (enabled ? 'ENABLED' : 'DISABLED'));
        // If disabling, auto-approve all pending
        if (!enabled) {
            for (const [agentId] of this.pendingBridgeAgents) {
                this.approveBridgeAccess(agentId);
            }
        }
    }
    /**
     * Send a recovery message to wake up stalled conversations
     */
    sendRecoveryMessage(channelId, message, metadata) {
        const ch = this.channels.get(channelId);
        if (!ch) {
            console.warn(`[Relay] Cannot send recovery message - channel ${channelId} not found`);
            return;
        }
        const recoveryMsg = {
            id: `recovery-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            type: 'system',
            from: 'stall-detector',
            to: 'broadcast',
            content: message,
            channel: channelId,
            timestamp: Date.now(),
            metadata: (0, audit_1.attachAuditTrace)({
                ...metadata,
                isSystemMessage: true,
                isRecoveryAttempt: true,
                forceInject: true, // Ensure this reaches the chat input field
            }, {
                source: 'standalone-relay',
                actor: 'stall-detector',
                channelId,
                operationalHandle: 'stall-detector',
                runtimeSessionId: 'stall-detector',
            }),
        };
        console.log(`[Relay] Sending recovery message to channel ${channelId}`);
        // Broadcast to all channel members
        ch.members.forEach((memberId) => {
            const memberWs = this.sockets.get(memberId);
            if (memberWs && memberWs.readyState === ws_1.default.OPEN) {
                this.send(memberWs, {
                    type: 'CHANNEL_MESSAGE',
                    payload: recoveryMsg,
                });
            }
        });
    }
    createDefaultChannel() {
        this.channels.set('general', {
            id: 'general',
            name: 'General',
            description: 'Default channel for all agents',
            createdBy: 'system',
            createdAt: Date.now(),
            isPrivate: false,
            members: [],
        });
    }
    startHeartbeatMonitor() {
        this.heartbeatInterval = setInterval(() => {
            const now = Date.now();
            this.agents.forEach((agent, agentId) => {
                if (now - agent.lastSeen > AGENT_TIMEOUT) {
                    TerminalFormatter_1.relay.agentTimeout(agentId);
                    const ws = this.sockets.get(agentId);
                    if (ws) {
                        ws.close();
                    }
                    this.handleAgentDisconnect(agentId);
                }
            });
        }, HEARTBEAT_INTERVAL);
    }
    start() {
        return new Promise((resolve, reject) => {
            void this.ensureActivityPersistenceReady()
                .then(() => {
                this.server.listen(this.port, () => {
                    TerminalFormatter_1.relay.banner({
                        port: this.port,
                        redisBridge: !!this.bridge,
                        activityPersistence: this.activityPersistenceEnabled,
                        stallDetection: true,
                        jwtAuth: true,
                    });
                    this.startHeartbeatMonitor();
                    this.stallDetector.start(); // Start stall detection
                    TerminalFormatter_1.relay.stallDetectorStarted();
                    this.emit('started', { port: this.port });
                    resolve();
                });
            })
                .catch((err) => {
                console.error('[Relay] Startup blocked:', err.message);
                reject(err);
            });
        });
    }
    stop() {
        return new Promise((resolve) => {
            if (this.heartbeatInterval) {
                clearInterval(this.heartbeatInterval);
            }
            // Stop stall detector
            this.stallDetector.stop();
            // Close all connections
            this.sockets.forEach((ws) => ws.close());
            this.wss.close(() => {
                this.server.close(() => {
                    const finalize = async () => {
                        if (this.activityRedis) {
                            try {
                                await this.activityRedis.quit();
                            }
                            catch (err) {
                                console.warn('[Relay] Failed to close activity Redis cleanly:', err instanceof Error ? err.message : String(err));
                            }
                            finally {
                                this.activityRedis = null;
                            }
                        }
                        TerminalFormatter_1.relay.serverStopped();
                        this.emit('stopped');
                        resolve();
                    };
                    void finalize();
                });
            });
        });
    }
    // Getters for external access
    getAgents() {
        return Array.from(this.agents.values());
    }
    getChannels() {
        return Array.from(this.channels.values());
    }
    getAgent(id) {
        return this.agents.get(id);
    }
    getChannel(id) {
        return this.channels.get(id);
    }
}
exports.TNFRelayServer = TNFRelayServer;
// CLI entry point
if (require.main === module) {
    const relay = new TNFRelayServer(PORT);
    relay.start().catch((err) => {
        console.error('[Relay] Failed to start:', err);
        process.exit(1);
    });
    // Graceful shutdown
    // Graceful shutdown
    process.on('SIGINT', () => {
        void (async () => {
            TerminalFormatter_1.relay.shutdownRequested();
            await relay.stop();
            process.exit(0);
        })();
    });
    process.on('SIGTERM', () => {
        void (async () => {
            await relay.stop();
            process.exit(0);
        })();
    });
}
exports.default = TNFRelayServer;
//# sourceMappingURL=standalone-relay.js.map