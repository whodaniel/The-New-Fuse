"use strict";
// packages/agent/src/protocols/WebSocketCommunicationProtocol.ts
Object.defineProperty(exports, "__esModule", { value: true });
exports.WebSocketCommunicationProtocol = void 0;
// Constants for WebSocket states
const WebSocketStates = {
    OPEN: 1
};
class WebSocketCommunicationProtocol {
    agents = new Map();
    wss;
    constructor() {
        // This is a stub implementation for compilation
        this.wss = {};
        this.setup();
    }
    setup() {
        // Stub implementation for compilation
        if (this.wss.on) {
            this.wss.on('connection', (ws, _req) => {
                ws.on('message', (data) => {
                    let parsed;
                    try {
                        parsed = JSON.parse(data.toString());
                    }
                    catch {
                        return;
                    }
                    const { agentId, payload } = parsed;
                    const agent = this.agents.get(agentId);
                    if (agent) {
                        agent.onMessage(payload);
                    }
                });
            });
        }
    }
    registerAgent(agent) {
        this.agents.set(agent.id, agent);
    }
    unregisterAgent(agentId) {
        this.agents.delete(agentId);
    }
    sendMessage(agentId, message) {
        if (this.wss.clients) {
            for (const client of this.wss.clients) {
                if (client.readyState === WebSocketStates.OPEN) {
                    client.send(JSON.stringify({ agentId, message }));
                }
            }
        }
    }
    broadcast(message) {
        if (this.wss.clients) {
            for (const client of this.wss.clients) {
                if (client.readyState === WebSocketStates.OPEN) {
                    client.send(JSON.stringify({ message }));
                }
            }
        }
    }
}
exports.WebSocketCommunicationProtocol = WebSocketCommunicationProtocol;
//# sourceMappingURL=WebSocketCommunicationProtocol.js.map