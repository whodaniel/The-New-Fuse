"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.RelayConnectionManager = void 0;
const ws_1 = __importDefault(require("ws"));
class RelayConnectionManager {
    constructor(config, log, processMessage, getOrchestratorEnvelopeIdentity, onDisconnect, sessionId) {
        this.config = config;
        this.log = log;
        this.processMessage = processMessage;
        this.getOrchestratorEnvelopeIdentity = getOrchestratorEnvelopeIdentity;
        this.onDisconnect = onDisconnect;
        this.ws = null;
        this.reconnectTimer = null;
        this.sessionId = sessionId;
    }
    async connectRelay() {
        return new Promise((resolve, reject) => {
            this.log('info', 'RELAY', `Connecting to ${this.config.RELAY_URL}...`);
            this.ws = new ws_1.default(this.config.RELAY_URL);
            const timeout = setTimeout(() => {
                reject(new Error('Connection timeout'));
            }, 10000);
            this.ws.on('open', () => {
                clearTimeout(timeout);
                this.log('info', 'RELAY', '✅ Connected to WebSocket relay');
                this.registerAsOrchestrator();
                resolve();
            });
            this.ws.on('message', (data) => {
                this.handleRelayMessageInternal(data);
            });
            this.ws.on('close', () => {
                this.log('warn', 'RELAY', 'Disconnected from relay');
                this.onDisconnect();
            });
            this.ws.on('error', (err) => {
                this.log('error', 'RELAY', `Connection error: ${err.message}`);
                clearTimeout(timeout);
                reject(err);
            });
        });
    }
    // MasterClock will call this if it needs to reconnect overall
    scheduleReconnect() {
        // This method is now effectively owned by MasterClock, which orchestrates reconnection.
        // The RelayConnectionManager simply reports disconnection via onDisconnect callback.
        // No op here, MasterClock will handle scheduling a full restart.
    }
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
    send(msg) {
        if (this.ws && this.ws.readyState === ws_1.default.OPEN) {
            this.ws.send(JSON.stringify({
                ...msg,
                source: this.sessionId,
                timestamp: Date.now(),
            }));
        }
    }
    handleRelayMessageInternal(data) {
        try {
            const msg = JSON.parse(data.toString());
            this.processMessage(msg, 'relay');
        }
        catch (e) {
            // Invalid JSON - ignore
        }
    }
    // For shutdown
    close() {
        if (this.ws) {
            this.ws.close();
        }
        if (this.reconnectTimer) {
            clearTimeout(this.reconnectTimer);
            this.reconnectTimer = null;
        }
    }
}
exports.RelayConnectionManager = RelayConnectionManager;
//# sourceMappingURL=relay-connection.service.js.map