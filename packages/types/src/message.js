"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MessageType = void 0;
var MessageType;
(function (MessageType) {
    MessageType["TEXT"] = "text";
    MessageType["COMMAND"] = "command";
    MessageType["EVENT"] = "event";
    MessageType["ERROR"] = "error";
    MessageType["STATUS"] = "status";
    MessageType["RESPONSE"] = "response";
    MessageType["NOTIFICATION"] = "notification";
    MessageType["TASK_ASSIGNMENT"] = "task_assignment";
})(MessageType || (exports.MessageType = MessageType = {}));
