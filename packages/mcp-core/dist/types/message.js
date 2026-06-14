/**
 * MCP Message type definitions
 */
/**
 * Message priority enumeration
 */
export var MessagePriority;
(function (MessagePriority) {
    MessagePriority["LOW"] = "low";
    MessagePriority["NORMAL"] = "normal";
    MessagePriority["HIGH"] = "high";
    MessagePriority["CRITICAL"] = "critical";
})(MessagePriority || (MessagePriority = {}));
/**
 * Message type enumeration
 */
export var MessageType;
(function (MessageType) {
    MessageType["REQUEST"] = "request";
    MessageType["RESPONSE"] = "response";
    MessageType["NOTIFICATION"] = "notification";
    MessageType["ERROR"] = "error";
})(MessageType || (MessageType = {}));
/**
 * Notification type enumeration
 */
export var NotificationType;
(function (NotificationType) {
    NotificationType["EVENT"] = "event";
    NotificationType["STATUS"] = "status";
    NotificationType["ALERT"] = "alert";
    NotificationType["HEARTBEAT"] = "heartbeat";
})(NotificationType || (NotificationType = {}));
//# sourceMappingURL=message.js.map