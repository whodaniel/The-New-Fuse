"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AgentRegistryBridge = void 0;
/**
 * TNF Agent Registry WebSocket Bridge
 * Registers agents with Master Clock and keeps them alive via heartbeat
 * Acts as a living agent on the relay — always present, always listening
 */
const ws_1 = require("ws");
const crypto_1 = require("crypto");
const RELAY_URL = process.env.RELAY_URL || 'ws://localhost:3000/ws';
const AGENT_ID = process.env.AGENT_ID || 'LAUNCHPAD-AGENT';
const HEARTBEAT_INTERVAL = parseInt(process.env.HEARTBEAT_INTERVAL || '3000');
class AgentRegistryBridge {
    ws = null;
    sessionId = (0, crypto_1.randomUUID)();
    registered = false;
    messageHandlers = new Map();
    async connect() {
        return new Promise((resolve, reject) => {
            this.ws = new ws_1.WebSocket(RELAY_URL);
            this.ws.on('open', () => {
                console.log(`[${AGENT_ID}] Connected to relay ${RELAY_URL}`);
                this.register();
                resolve();
            });
            this.ws.on('message', (data) => {
                try {
                    const msg = JSON.parse(data.toString());
                    this.handleMessage(msg);
                }
                catch (e) {
                    // Ignore non-JSON
                }
            });
            this.ws.on('error', (err) => {
                console.error(`[${AGENT_ID}] WS error:`, err.message);
            });
            this.ws.on('close', () => {
                console.log(`[${AGENT_ID}] Disconnected. Reconnecting in 5s...`);
                this.registered = false;
                setTimeout(() => this.connect(), 5000);
            });
        });
    }
    register() {
        if (!this.ws || this.registered)
            return;
        this.ws.send(JSON.stringify({
            type: 'AGENT_REGISTER',
            payload: {
                agent: {
                    id: this.sessionId,
                    canonicalEntityId: `AGENT://TNFCORE/${AGENT_ID}`,
                    operationalHandle: AGENT_ID,
                    name: AGENT_ID,
                    platform: 'tnf-core',
                    capabilities: ['launchpad', 'orchestrator', 'heartbeat'],
                }
            },
            source: this.sessionId,
            timestamp: Date.now(),
        }));
        this.registered = true;
        console.log(`[${AGENT_ID}] Registered with session ${this.sessionId}`);
    }
    handleMessage(msg) {
        const handler = this.messageHandlers.get(msg.type);
        if (handler)
            handler(msg);
    }
    on(type, handler) {
        this.messageHandlers.set(type, handler);
    }
    send(type, payload) {
        if (!this.ws || this.ws.readyState !== ws_1.WebSocket.OPEN)
            return;
        this.ws.send(JSON.stringify({
            type,
            payload,
            source: this.sessionId,
            timestamp: Date.now(),
        }));
    }
    startHeartbeat() {
        setInterval(() => {
            if (this.ws?.readyState === ws_1.WebSocket.OPEN) {
                this.ws.send(JSON.stringify({
                    type: 'AGENT_HEARTBEAT',
                    payload: { agentId: this.sessionId, status: 'active' },
                    source: this.sessionId,
                    timestamp: Date.now(),
                }));
            }
        }, HEARTBEAT_INTERVAL);
    }
}
exports.AgentRegistryBridge = AgentRegistryBridge;
// Auto-start if run directly
if (require.main === module) {
    const bridge = new AgentRegistryBridge();
    bridge.connect().then(() => {
        bridge.startHeartbeat();
        console.log(`[${AGENT_ID}] Agent registry bridge started`);
        console.log(`[${AGENT_ID}] Session: ${bridge['sessionId']}`);
    });
}
//# sourceMappingURL=agent-registry-bridge.js.map