"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BaseBridge = exports.Priority = exports.MessageType = void 0;
var MessageType;
(function (MessageType) {
    MessageType["TASK"] = "TASK";
    MessageType["RESULT"] = "RESULT";
    MessageType["STATUS"] = "STATUS";
    MessageType["ERROR"] = "ERROR";
    MessageType["HEARTBEAT"] = "HEARTBEAT";
})(MessageType || (exports.MessageType = MessageType = {}));
var Priority;
(function (Priority) {
    Priority["LOW"] = "LOW";
    Priority["MEDIUM"] = "MEDIUM";
    Priority["HIGH"] = "HIGH";
    Priority["URGENT"] = "URGENT";
})(Priority || (exports.Priority = Priority = {}));
class BaseBridge {
}
exports.BaseBridge = BaseBridge;
//# sourceMappingURL=index.js.map