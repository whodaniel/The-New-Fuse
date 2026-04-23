"use strict";
/**
 * A2A Protocol Adapter for The New Fuse Relay System
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.A2AProtocolAdapter = void 0;
class A2AProtocolAdapter {
    constructor() {
        this.name = 'a2a';
        this.version = '2.0';
        this.supportedProtocols = ['a2a-v2.0'];
    }
    canTranslate(from, to) {
        return from === 'a2a-v2.0' && this.supportedProtocols.includes(to);
    }
    async translate(message, from, to) {
        // Since this is the native protocol, no translation is needed.
        // In a real scenario, this would handle different versions of the A2A protocol.
        return message;
    }
}
exports.A2AProtocolAdapter = A2AProtocolAdapter;
//# sourceMappingURL=A2AProtocolAdapter.js.map