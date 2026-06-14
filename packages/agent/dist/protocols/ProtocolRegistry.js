"use strict";
// packages/agent/src/protocols/ProtocolRegistry.ts
Object.defineProperty(exports, "__esModule", { value: true });
exports.ProtocolRegistry = void 0;
const WebSocketCommunicationProtocol_js_1 = require("./WebSocketCommunicationProtocol.js");
class ProtocolRegistry {
    static { this.protocols = new Map(); }
    static registerProtocol(name, ctor) {
        ProtocolRegistry.protocols.set(name, ctor);
    }
    static getProtocol(name) {
        return ProtocolRegistry.protocols.get(name);
    }
    static listProtocols() {
        return Array.from(ProtocolRegistry.protocols.keys());
    }
}
exports.ProtocolRegistry = ProtocolRegistry;
// Register WebSocket protocol by default
ProtocolRegistry.registerProtocol('websocket', WebSocketCommunicationProtocol_js_1.WebSocketCommunicationProtocol);
//# sourceMappingURL=ProtocolRegistry.js.map