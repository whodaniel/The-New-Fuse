
export {}
exports.MessageStatus = exports.MessagePriority = exports.MessageType = void 0;
var MessageType;
(function (MessageType): any {
    MessageType["INTRODUCTION"] = "INTRODUCTION";
    MessageType["TASK"] = "TASK";
    MessageType["RESPONSE"] = "RESPONSE";
    MessageType["ERROR"] = "ERROR";
})(MessageType || (exports.MessageType = MessageType = {}));
var MessagePriority;
(function (MessagePriority): any {
    MessagePriority["HIGH"] = "HIGH";
    MessagePriority["MEDIUM"] = "MEDIUM";
    MessagePriority["LOW"] = "LOW";
})(MessagePriority || (exports.MessagePriority = MessagePriority = {}));
var MessageStatus;
(function (MessageStatus): any {
    MessageStatus["PENDING"] = "pending";
    MessageStatus["DELIVERED"] = "delivered";
    MessageStatus["READ"] = "read";
    MessageStatus["FAILED"] = "failed";
})(MessageStatus || (exports.MessageStatus = MessageStatus = {}));
//# sourceMappingURL=index.js.mapexport {};
