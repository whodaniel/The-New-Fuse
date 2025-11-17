/**
 * A2A Protocol Adapter for The New Fuse Relay System
 */
export class A2AProtocolAdapter {
    name = 'a2a';
    version = '2.0';
    supportedProtocols = ['a2a-v2.0'];
    canTranslate(from, to) {
        return from === 'a2a-v2.0' && this.supportedProtocols.includes(to);
    }
    async translate(message, from, to) {
        // Since this is the native protocol, no translation is needed.
        // In a real scenario, this would handle different versions of the A2A protocol.
        return message;
    }
}
//# sourceMappingURL=A2AProtocolAdapter.js.map