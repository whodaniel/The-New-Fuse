"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.handler = exports.manager = void 0;
exports.forwardEnvelope = forwardEnvelope;
exports.listAgentsSnapshot = listAgentsSnapshot;
const events_1 = __importDefault(require("events"));
const aiavailabilitymanager_1 = __importDefault(require("../../../../packages/core/src/services/aiavailabilitymanager"));
const relayenvelopehandler_1 = __importDefault(require("../../../../packages/core/src/services/relayenvelopehandler"));
// Lightweight availability bootstrap for the backend.
// This file intentionally keeps dependencies minimal and in-process.
const events = new events_1.default();
exports.manager = new aiavailabilitymanager_1.default();
exports.handler = new relayenvelopehandler_1.default(exports.manager);
// attach an in-process forwarder that expects messages of shape { envelope }
events.on('envelope', (env) => {
    try {
        exports.handler.handleEnvelope(env);
    }
    catch (err) {
        // swallow - handler will emit errors on manager
        exports.manager.emit('handlerError', { error: String(err), envelope: env });
    }
});
// expose a simple helper to forward envelopes into the handler
function forwardEnvelope(envelope) {
    events.emit('envelope', envelope);
}
// expose an HTTP-friendly snapshot
function listAgentsSnapshot() {
    return exports.manager.listAgents();
}
exports.default = { manager: exports.manager, handler: exports.handler, forwardEnvelope, listAgentsSnapshot };
//# sourceMappingURL=availability.service.js.map