"use strict";
/**
 * Bridges module exports
 * Provides communication bridges between different agent systems
 */
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __exportStar = (this && this.__exportStar) || function(m, exports) {
    for (var p in m) if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports, p)) __createBinding(exports, m, p);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ExtendedBridge = exports.MCPBridge = exports.ProtocolBridge = exports.BaseBridge = exports.Priority = exports.MessageType = void 0;
const events_1 = require("events");
var MessageType;
(function (MessageType) {
    MessageType["COMMAND"] = "command";
    MessageType["RESPONSE"] = "response";
    MessageType["ERROR"] = "error";
    MessageType["EVENT"] = "event";
    MessageType["NOTIFICATION"] = "notification";
    MessageType["REQUEST"] = "request";
    MessageType["STATUS"] = "status";
    MessageType["LOG"] = "log";
    MessageType["METRIC"] = "metric";
    MessageType["ALERT"] = "alert";
    MessageType["HEARTBEAT"] = "heartbeat";
    MessageType["INFO"] = "info";
    MessageType["WARNING"] = "warning";
    MessageType["TEXT"] = "text";
})(MessageType || (exports.MessageType = MessageType = {}));
var Priority;
(function (Priority) {
    Priority["LOW"] = "low";
    Priority["MEDIUM"] = "medium";
    Priority["HIGH"] = "high";
    Priority["CRITICAL"] = "critical";
})(Priority || (exports.Priority = Priority = {}));
class BaseBridge extends events_1.EventEmitter {
    constructor(name) {
        super();
        this.isConnected = false;
        this.name = name;
    }
    get connected() {
        return this.isConnected;
    }
    get bridgeName() {
        return this.name;
    }
}
exports.BaseBridge = BaseBridge;
// Export cline bridge
__exportStar(require("./cline_bridge.js"), exports);
// Export types (primary source)
__exportStar(require("./types/index.js"), exports);
// Core bridges
__exportStar(require("./cascade_bridge.js"), exports);
__exportStar(require("./redis_bridge.js"), exports);
__exportStar(require("./universal_bridge.js"), exports);
__exportStar(require("./vscode_bridge.js"), exports);
// Protocol bridge - explicit exports (it has MCPTool, MCPResource, MCPPrompt)
var protocol_bridge_js_1 = require("./protocol_bridge.js");
Object.defineProperty(exports, "ProtocolBridge", { enumerable: true, get: function () { return protocol_bridge_js_1.ProtocolBridge; } });
// MCP bridge - explicit exports (avoid MCP type duplicates with protocol_bridge)
var mcp_bridge_js_1 = require("./mcp_bridge.js");
Object.defineProperty(exports, "MCPBridge", { enumerable: true, get: function () { return mcp_bridge_js_1.MCPBridge; } });
// Electron bridge
__exportStar(require("./electron_bridge.js"), exports);
// Base bridge - explicit exports to avoid BridgeMessage/BridgeConfig duplicates
var base_js_1 = require("./base.js");
Object.defineProperty(exports, "ExtendedBridge", { enumerable: true, get: function () { return base_js_1.Bridge; } });
// Other infrastructure bridges
__exportStar(require("./agent_sync_bridge.js"), exports);
__exportStar(require("./bridge_adapter.js"), exports);
__exportStar(require("./communication.js"), exports);
__exportStar(require("./enhanced_communication.js"), exports);
__exportStar(require("./monitor_bridge.js"), exports);
__exportStar(require("./monitor_communication.js"), exports);
__exportStar(require("./system_bridge.js"), exports);
//# sourceMappingURL=index.js.map