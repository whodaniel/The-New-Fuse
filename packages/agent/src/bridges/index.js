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
exports.BaseBridge = exports.Priority = exports.MessageType = void 0;
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
    name;
    isConnected = false;
    constructor(name) {
        super();
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
// Export all bridge implementations
__exportStar(require("./cline_bridge"), exports);
__exportStar(require("./types"), exports);
//# sourceMappingURL=index.js.map