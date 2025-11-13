"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.RelayConsumer = void 0;
const RelayEnvelopeHandler_1 = __importDefault(require("./RelayEnvelopeHandler"));
/**
 * RelayConsumer
 * A small adapter that can be used by a backend to wire a WebSocket client
 * (or any event emitter that emits messages) to the RelayEnvelopeHandler.
 * The consumer avoids introducing a hard dependency on a specific ws library by
 * accepting an injected client that emits 'message' events with the raw data
 * or a { message } detail shape.
 */
class RelayConsumer {
    handler;
    constructor(manager) {
        this.handler = new RelayEnvelopeHandler_1.default(manager);
    }
    // Attach a generic message source (EventTarget / EventEmitter-like)
    attachSource(source) {
        // Browser-style EventTarget with CustomEvent
        if (source.addEventListener) {
            source.addEventListener('message', (ev) => {
                const custom = ev;
                const detail = custom.detail ?? null;
                const envelope = detail?.message ?? detail;
                if (envelope)
                    this.handler.handleEnvelope(envelope);
            });
            return;
        }
        // Node-style EventEmitter
        if (source.on) {
            source.on('message', (data) => {
                // data may be stringified JSON or object
                let parsed = data;
                if (typeof data === 'string') {
                    try {
                        parsed = JSON.parse(data);
                    }
                    catch {
                        parsed = data;
                    }
                }
                const envelope = parsed?.message ?? parsed;
                if (envelope)
                    this.handler.handleEnvelope(envelope);
            });
            return;
        }
        throw new Error('Unsupported source type for RelayConsumer');
    }
}
exports.RelayConsumer = RelayConsumer;
exports.default = RelayConsumer;
//# sourceMappingURL=RelayConsumer.js.map