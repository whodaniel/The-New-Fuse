"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const AIAvailabilityManager_1 = __importDefault(require("./AIAvailabilityManager"));
const RelayEnvelopeHandler_1 = __importDefault(require("./RelayEnvelopeHandler"));
async function runDemo() {
    const manager = new AIAvailabilityManager_1.default({ heartbeatTTL: 30_000 });
    const handler = new RelayEnvelopeHandler_1.default(manager);
    // Log manager events
    manager.on('agentRegistered', (agent) => console.log('[manager] agentRegistered', agent.id));
    manager.on('agentHeartbeat', (agent) => console.log('[manager] agentHeartbeat', agent.id));
    manager.on('taskAssigned', ({ task, agent, score }) => console.log(`[manager] taskAssigned -> ${task.id} -> ${agent.id} (score=${score})`));
    // Simulate extension registration envelope
    const registerEnvelope = {
        event: 'extension.register',
        cid: 'cid-demo-1',
        origin: { app: 'chrome-extension', id: 'chrome-ext-demo', version: '1.0.0' },
        timestamp: new Date().toISOString(),
        payload: {
            id: 'chrome-ext-demo',
            features: ['element-selection', 'ai-automation'],
            config: { relayUrl: 'ws://localhost:3001'
            },
            handler, : .handleEnvelope(registerEnvelope),
            // Simulate heartbeat
            const: heartbeat = {
                event: 'extension.heartbeat',
                cid: 'cid-demo-2',
                origin: { app: 'chrome-extension', id: 'chrome-ext-demo', version: '1.0.0' },
                timestamp: new Date().toISOString(),
                payload: { id: 'chrome-ext-demo', uptimeSeconds: 10, features: ['ai-automation'], status: { connected: true } }
            },
            handler, : .handleEnvelope(heartbeat),
            // Create a task and ask manager to assign
            const: task = { id: 'task-1', type: 'capture', payload: { query: 'hello',
                    const: assigned = manager.assignTask(task),
                    if(assigned) {
                        console.log('Assigned to', assigned.id);
                    }, else: {
                        console, : .log('No agent assigned')
                    }
                    // Wait a bit to allow events to print
                    ,
                    // Wait a bit to allow events to print
                    await: new Promise((r) => setTimeout(r, 200)) },
                runDemo() { }, : .catch((err) => {
                    console.error('Demo failed', err);
                    process.exit(1);
                }) }
        }
    };
}
//# sourceMappingURL=demoRelayConsumer.js.map