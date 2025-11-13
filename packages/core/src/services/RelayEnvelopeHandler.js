"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RelayEnvelopeHandler = void 0;
/**
 * RelayEnvelopeHandler
 * - consumes canonical envelopes emitted by clients (extensions, agents)
 * - updates AIAvailabilityManager registry (register/heartbeat)
 * - emits lightweight events back to the manager for context
 */
class RelayEnvelopeHandler {
    manager;
    constructor(manager) {
        this.manager = manager;
    }
    handleEnvelope(envelope) {
        if (!envelope || !envelope.event)
            return;
        const originId = envelope.origin?.id;
        const payload = envelope.payload;
        try {
            switch (envelope.event) {
                case 'extension.register': {
                    const p = payload;
                    const id = p['id'] || originId || `agent-${Date.now()}`;
                    const features = Array.isArray(p['features']) ? p['features'] : [];
                    const config = p['config'];
                    const agent = {
                        id,
                        name: id,
                        type: 'extension',
                        capabilities: features,
                        metadata: config || {},
                        score: 0
                    };
                    this.manager.registerAgent(agent);
                    break;
                }
                case 'extension.heartbeat': {
                    const p = payload;
                    const id = p['id'] || originId;
                    if (!id)
                        break;
                    const features = Array.isArray(p['features']) ? p['features'] : [];
                    const status = p['status'];
                    this.manager.handleHeartbeat(id, { name: id, type: 'extension', capabilities: features, metadata: status });
                    break;
                }
                case 'context.selection': {
                    // broadcast context selection as a manager event so other services can react
                    this.manager.emit('contextSelection', { origin: envelope.origin, payload });
                    break;
                }
                default:
                    // ignore other events for now
                    break;
            }
        }
        catch (err) {
            // don't allow handler to crash
            this.manager.emit('handlerError', { envelope, error: String(err) });
        }
    }
}
exports.RelayEnvelopeHandler = RelayEnvelopeHandler;
exports.default = RelayEnvelopeHandler;
//# sourceMappingURL=RelayEnvelopeHandler.js.map