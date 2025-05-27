"use strict";
/**
 * Shared type definitions for The New Fuse extension components
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.ConnectionStatus = exports.MessageType = void 0;
var MessageType;
(function (MessageType) {
    MessageType["INITIATION"] = "initiation";
    MessageType["MESSAGE"] = "message";
    MessageType["CODE_INPUT"] = "code_input";
    MessageType["CODE_OUTPUT"] = "code_output";
    MessageType["AI_REQUEST"] = "ai_request";
    MessageType["AI_RESPONSE"] = "ai_response";
    MessageType["CAPABILITY_QUERY"] = "capability_query";
    MessageType["CAPABILITY_RESPONSE"] = "capability_response";
    MessageType["MCP_REQUEST"] = "mcp_request";
    MessageType["MCP_RESPONSE"] = "mcp_response";
    MessageType["HEARTBEAT"] = "heartbeat";
})(MessageType || (exports.MessageType = MessageType = {}));
var ConnectionStatus;
(function (ConnectionStatus) {
    ConnectionStatus["CONNECTED"] = "CONNECTED";
    ConnectionStatus["DISCONNECTED"] = "DISCONNECTED";
    ConnectionStatus["ERROR"] = "ERROR";
})(ConnectionStatus || (exports.ConnectionStatus = ConnectionStatus = {}));
//# sourceMappingURL=shared.js.map