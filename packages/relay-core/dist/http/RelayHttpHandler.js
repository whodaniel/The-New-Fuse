"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RelayHttpHandler = void 0;
const url_1 = require("url");
// Assuming these functions are either imported or passed
function buildBridgeOperatorContext(req) {
    const headerActor = req.headers['x-tnf-operator'];
    const actor = typeof headerActor === 'string' && headerActor.trim() ? headerActor.trim() : 'relay-admin-http';
    return {
        actor,
        remoteAddress: req.socket.remoteAddress || null,
        userAgent: typeof req.headers['user-agent'] === 'string' ? req.headers['user-agent'] : null,
    };
}
// Assuming isLoopbackAddress, parseCsvSet are in a utils file or passed in
function isLoopbackAddress(address) {
    if (!address)
        return false;
    const normalized = address.trim();
    if (!normalized)
        return false;
    return (normalized === '127.0.0.1' ||
        normalized === '::1' ||
        normalized === '::ffff:127.0.0.1' ||
        normalized.startsWith('localhost'));
}
// Re-defining parseCsvSet for now, will consider moving to shared utils later
function parseCsvSet(raw, normalize = true) {
    if (!raw)
        return new Set();
    return new Set(raw
        .split(',')
        .map((item) => (normalize ? item.trim().toLowerCase() : item.trim()))
        .filter(Boolean));
}
// --- End Placeholder ---
class RelayHttpHandler {
    constructor(core, logger) {
        this.core = core;
        this.logger = logger;
        this.bridgeAutoApproveLoopback = process.env.BRIDGE_AUTO_APPROVE_LOOPBACK !== 'false';
        this.bridgeAutoApprovePlatforms = parseCsvSet(process.env.BRIDGE_AUTO_APPROVE_PLATFORMS || 'orchestrator,system,relay,master-clock');
        this.bridgeAutoApproveAgentIds = parseCsvSet(process.env.BRIDGE_AUTO_APPROVE_AGENT_IDS || '');
    }
    handleRequest(req, res) {
        const urlString = req.url || '/';
        const parsedUrl = new url_1.URL(urlString, `http://${req.headers.host || 'localhost'}`);
        const pathname = parsedUrl.pathname;
        // CORS headers
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
        res.setHeader('Access-Control-Allow-Headers', 'Content-Type, X-TNF-Operator'); // Added X-TNF-Operator
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
                this.handleHealthEndpoint(res);
                break;
            case '/agents':
                this.handleAgentsEndpoint(res);
                break;
            case '/channels':
                this.handleChannelsEndpoint(res);
                break;
            case '/status':
                this.handleStatusEndpoint(res);
                break;
            case '/bridge/pending':
                this.handleBridgePendingEndpoint(res);
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
    handleHealthEndpoint(res) {
        res.writeHead(200);
        res.end(JSON.stringify({
            status: 'ok',
            relay: 'running',
            version: '1.0.0', // This should probably come from package.json
            agents: this.core.agents.size,
            channels: this.core.channels.size,
            uptime: process.uptime(),
            timestamp: new Date().toISOString(),
        }));
    }
    handleAgentsEndpoint(res) {
        res.writeHead(200);
        res.end(JSON.stringify(Array.from(this.core.agents.values())));
    }
    handleChannelsEndpoint(res) {
        res.writeHead(200);
        res.end(JSON.stringify(Array.from(this.core.channels.values())));
    }
    handleStatusEndpoint(res) {
        res.writeHead(200);
        res.end(JSON.stringify({
            agents: Array.from(this.core.agents.values()),
            channels: Array.from(this.core.channels.values()),
            connections: this.core.sockets.size,
            bridge: {
                connected: this.core.bridge?.isConnected() || false,
                gateEnabled: this.core.bridgeGateEnabled,
                pendingRequests: this.core.pendingBridgeAgents.size,
                approvedAgents: Array.from(this.core.approvedBridgeAgents),
            },
        }));
    }
    handleBridgePendingEndpoint(res) {
        res.writeHead(200);
        res.end(JSON.stringify({
            pending: this.getPendingBridgeRequests(),
            gateEnabled: this.core.bridgeGateEnabled,
        }));
    }
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
                const success = this.core.approveBridgeAccess(agentId, operator);
                res.writeHead(success ? 200 : 404);
                res.end(JSON.stringify({
                    success,
                    agentId,
                    approvedAgents: Array.from(this.core.approvedBridgeAgents),
                    pending: this.getPendingBridgeRequests(),
                }));
            }
            catch (err) {
                res.writeHead(400);
                res.end(JSON.stringify({ error: 'Invalid JSON', details: String(err) }));
            }
        });
    }
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
                const success = this.core.denyBridgeAccess(agentId, reason, {
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
                this.core.setBridgeGateEnabled(enabled, operator);
                res.writeHead(200);
                res.end(JSON.stringify({
                    success: true,
                    gateEnabled: this.core.bridgeGateEnabled,
                    approvedAgents: Array.from(this.core.approvedBridgeAgents),
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
        if (!this.core.activityPersistenceEnabled || !this.core.activityRedis) {
            res.writeHead(503);
            res.end(JSON.stringify({
                error: 'Activity persistence is disabled',
                enabled: this.core.activityPersistenceEnabled,
            }));
            return;
        }
        const channelId = parsedUrl.searchParams.get('channel');
        const rawCount = parsedUrl.searchParams.get('count') || '100';
        const count = Math.min(Math.max(parseInt(rawCount, 10) || 100, 1), 500);
        const streamKey = channelId
            ? `${this.core.activityChannelPrefix}${channelId}`
            : this.core.activityStreamKey;
        try {
            const entries = await this.core.readActivityStream(streamKey, count);
            const events = entries.map((entry) => {
                const [streamId, flatFields] = entry;
                const fields = {};
                for (let i = 0; i < flatFields.length; i += 2) {
                    fields[flatFields[i]] = flatFields[i + 1];
                }
                return {
                    streamId,
                    ...this.core.parseActivityFields(fields),
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
    getPendingBridgeRequests() {
        return Array.from(this.core.pendingBridgeAgents.values()).map(({ agent, requestedAt }) => ({
            agentId: agent.id,
            name: agent.name,
            platform: agent.platform,
            requestedAt,
        }));
    }
}
exports.RelayHttpHandler = RelayHttpHandler;
//# sourceMappingURL=RelayHttpHandler.js.map