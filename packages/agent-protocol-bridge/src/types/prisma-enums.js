"use strict";
/**
 * Prisma enum types re-exported for use in agent-protocol-bridge
 * These match the enums defined in packages/database/prisma/schema.prisma
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.ConnectionState = exports.BridgeType = exports.ProtocolType = void 0;
var ProtocolType;
(function (ProtocolType) {
    ProtocolType["A2A_V1"] = "A2A_V1";
    ProtocolType["A2A_V2"] = "A2A_V2";
    ProtocolType["MCP"] = "MCP";
    ProtocolType["GOOGLE_A2A"] = "GOOGLE_A2A";
    ProtocolType["GOOGLE_JULES"] = "GOOGLE_JULES";
    ProtocolType["AUGMENT_A2A"] = "AUGMENT_A2A";
    ProtocolType["ANTHROPIC_MCP"] = "ANTHROPIC_MCP";
    ProtocolType["PYDANTIC_AI"] = "PYDANTIC_AI";
    ProtocolType["PYDANTIC"] = "PYDANTIC";
    ProtocolType["OPENAI_REALTIME"] = "OPENAI_REALTIME";
    ProtocolType["CLAUDE_SUB_AGENT"] = "CLAUDE_SUB_AGENT";
    ProtocolType["CUSTOM"] = "CUSTOM";
})(ProtocolType || (exports.ProtocolType = ProtocolType = {}));
var BridgeType;
(function (BridgeType) {
    BridgeType["MCP"] = "MCP";
    BridgeType["A2A"] = "A2A";
    BridgeType["WEBSOCKET"] = "WEBSOCKET";
    BridgeType["REDIS"] = "REDIS";
    BridgeType["HTTP"] = "HTTP";
    BridgeType["GRPC"] = "GRPC";
    BridgeType["SSE"] = "SSE";
})(BridgeType || (exports.BridgeType = BridgeType = {}));
var ConnectionState;
(function (ConnectionState) {
    ConnectionState["CONNECTED"] = "CONNECTED";
    ConnectionState["DISCONNECTED"] = "DISCONNECTED";
    ConnectionState["CONNECTING"] = "CONNECTING";
    ConnectionState["RECONNECTING"] = "RECONNECTING";
    ConnectionState["ERROR"] = "ERROR";
    ConnectionState["IDLE"] = "IDLE";
})(ConnectionState || (exports.ConnectionState = ConnectionState = {}));
//# sourceMappingURL=prisma-enums.js.map