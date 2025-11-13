/**
 * MCP Connection interfaces for managing connections in the MCP protocol
 */
/**
 * Connection status enumeration
 */
export var ConnectionStatus;
(function (ConnectionStatus) {
    ConnectionStatus["CONNECTING"] = "connecting";
    ConnectionStatus["CONNECTED"] = "connected";
    ConnectionStatus["DISCONNECTED"] = "disconnected";
    ConnectionStatus["ERROR"] = "error";
    ConnectionStatus["RECONNECTING"] = "reconnecting";
})(ConnectionStatus || (ConnectionStatus = {}));
//# sourceMappingURL=IMCPConnection.js.map