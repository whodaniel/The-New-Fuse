"use strict";
/**
 * WebSocket Real-Time Communication Types
 *
 * Comprehensive type definitions for WebSocket-based real-time
 * communication with The New Fuse AI Agent framework.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.WebSocketMessageType = exports.WebSocketDirection = exports.WebSocketStatus = void 0;
var WebSocketStatus;
(function (WebSocketStatus) {
    WebSocketStatus["CONNECTING"] = "CONNECTING";
    WebSocketStatus["CONNECTED"] = "CONNECTED";
    WebSocketStatus["DISCONNECTED"] = "DISCONNECTED";
    WebSocketStatus["ERROR"] = "ERROR";
})(WebSocketStatus || (exports.WebSocketStatus = WebSocketStatus = {}));
var WebSocketDirection;
(function (WebSocketDirection) {
    WebSocketDirection["INBOUND"] = "INBOUND";
    WebSocketDirection["OUTBOUND"] = "OUTBOUND";
})(WebSocketDirection || (exports.WebSocketDirection = WebSocketDirection = {}));
var WebSocketMessageType;
(function (WebSocketMessageType) {
    // Connection management
    WebSocketMessageType["CONNECT"] = "connect";
    WebSocketMessageType["DISCONNECT"] = "disconnect";
    WebSocketMessageType["PING"] = "ping";
    WebSocketMessageType["PONG"] = "pong";
    // Room management
    WebSocketMessageType["JOIN_ROOM"] = "join_room";
    WebSocketMessageType["LEAVE_ROOM"] = "leave_room";
    WebSocketMessageType["ROOM_MESSAGE"] = "room_message";
    // Channel subscription
    WebSocketMessageType["SUBSCRIBE"] = "subscribe";
    WebSocketMessageType["UNSUBSCRIBE"] = "unsubscribe";
    WebSocketMessageType["CHANNEL_MESSAGE"] = "channel_message";
    // Agent communication
    WebSocketMessageType["AGENT_MESSAGE"] = "agent_message";
    WebSocketMessageType["AGENT_STATUS"] = "agent_status";
    WebSocketMessageType["AGENT_COMMAND"] = "agent_command";
    WebSocketMessageType["AGENT_RESPONSE"] = "agent_response";
    // System messages
    WebSocketMessageType["SYSTEM_NOTIFICATION"] = "system_notification";
    WebSocketMessageType["SYSTEM_ALERT"] = "system_alert";
    WebSocketMessageType["SYSTEM_BROADCAST"] = "system_broadcast";
    // Data streaming
    WebSocketMessageType["DATA_STREAM"] = "data_stream";
    WebSocketMessageType["FILE_TRANSFER"] = "file_transfer";
    // Custom messages
    WebSocketMessageType["CUSTOM"] = "custom";
})(WebSocketMessageType || (exports.WebSocketMessageType = WebSocketMessageType = {}));
//# sourceMappingURL=websocket-types.js.map