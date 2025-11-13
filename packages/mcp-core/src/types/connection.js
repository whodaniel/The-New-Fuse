/**
 * MCP Connection type definitions
 */
/**
 * Connection type enumeration
 */
export var ConnectionType;
(function (ConnectionType) {
    ConnectionType["WEBSOCKET"] = "websocket";
    ConnectionType["HTTP"] = "http";
    ConnectionType["TCP"] = "tcp";
    ConnectionType["IPC"] = "ipc";
    ConnectionType["CUSTOM"] = "custom";
})(ConnectionType || (ConnectionType = {}));
/**
 * Connection event enumeration
 */
export var ConnectionEvent;
(function (ConnectionEvent) {
    ConnectionEvent["CONNECTING"] = "connecting";
    ConnectionEvent["CONNECTED"] = "connected";
    ConnectionEvent["DISCONNECTED"] = "disconnected";
    ConnectionEvent["ERROR"] = "error";
    ConnectionEvent["RECONNECTING"] = "reconnecting";
    ConnectionEvent["MESSAGE_SENT"] = "message_sent";
    ConnectionEvent["MESSAGE_RECEIVED"] = "message_received";
})(ConnectionEvent || (ConnectionEvent = {}));
//# sourceMappingURL=connection.js.map