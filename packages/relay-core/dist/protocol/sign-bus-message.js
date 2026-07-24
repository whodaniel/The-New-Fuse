"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.stringifySignedBusMessage = stringifySignedBusMessage;
/**
 * Sign A2A / TNF bus payloads with the canonical scripts/lib/tnf-message-auth.cjs
 * implementation so broker/relay publishes verify on RedisAgentClient receivers.
 *
 * Fail-open to unsigned JSON only when signing itself throws — warn-mode bus
 * still accepts unsigned; enforce mode will reject at the consumer.
 */
const node_module_1 = require("node:module");
const node_path_1 = __importDefault(require("node:path"));
let cached = null;
function resolveMessageAuth() {
    if (cached)
        return cached;
    const require = (0, node_module_1.createRequire)(__filename);
    const candidates = [
        node_path_1.default.resolve(__dirname, '../../../../scripts/lib/tnf-message-auth.cjs'),
        node_path_1.default.resolve(process.cwd(), 'scripts/lib/tnf-message-auth.cjs'),
        node_path_1.default.resolve(process.cwd(), '../../scripts/lib/tnf-message-auth.cjs'),
    ];
    for (const candidate of candidates) {
        try {
            cached = require(candidate);
            return cached;
        }
        catch {
            /* try next */
        }
    }
    return null;
}
function looksLikeBusEnvelope(obj) {
    if (!obj || typeof obj !== 'object')
        return false;
    const o = obj;
    return Boolean(o.type || o.payload || o.from || o.to);
}
/**
 * Return a JSON string suitable for Redis publish. TNF envelopes are signed;
 * already-signed packets and non-envelope telemetry pass through.
 */
function stringifySignedBusMessage(agentId, channel, message, typeHint) {
    const auth = resolveMessageAuth();
    let obj = message;
    if (typeof message === 'string') {
        try {
            obj = JSON.parse(message);
        }
        catch {
            return message;
        }
    }
    if (!auth || !looksLikeBusEnvelope(obj) || auth.isSignedEnvelope(obj)) {
        return typeof message === 'string' ? message : JSON.stringify(message ?? null);
    }
    const type = typeHint ||
        (typeof obj.type === 'string'
            ? String(obj.type)
            : 'event');
    try {
        const signed = auth.signEnvelope({ agent_id: agentId }, { type, channel, data: obj });
        return JSON.stringify(signed);
    }
    catch (err) {
        const reason = err instanceof Error ? err.message : String(err);
        console.warn(`[sign-bus-message] signing failed; publishing unsigned (${reason})`);
        return typeof message === 'string' ? message : JSON.stringify(obj);
    }
}
//# sourceMappingURL=sign-bus-message.js.map