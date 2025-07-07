"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.WebSocketError = exports.MessageType = void 0;
var MessageType;
(function (MessageType) {
    MessageType["COMMAND"] = "COMMAND";
    MessageType["RESPONSE"] = "RESPONSE";
    MessageType["ERROR"] = "ERROR";
    MessageType["EVENT"] = "EVENT";
    MessageType["NOTIFICATION"] = "NOTIFICATION";
    MessageType["REQUEST"] = "REQUEST";
    MessageType["STATUS"] = "STATUS";
    MessageType["LOG"] = "LOG";
    MessageType["METRIC"] = "METRIC";
    MessageType["ALERT"] = "ALERT";
    MessageType["HEARTBEAT"] = "HEARTBEAT";
})(MessageType || (exports.MessageType = MessageType = {}));
class WebSocketError extends Error {
    code;
    timestamp;
    constructor(message, code) {
        super(message);
        this.name = 'WebSocketError';
        this.code = code;
        this.timestamp = new Date();
    }
}
exports.WebSocketError = WebSocketError;
