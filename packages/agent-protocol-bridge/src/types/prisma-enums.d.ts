/**
 * Prisma enum types re-exported for use in agent-protocol-bridge
 * These match the enums defined in packages/database/prisma/schema.prisma
 */
export declare enum ProtocolType {
    A2A_V1 = "A2A_V1",
    A2A_V2 = "A2A_V2",
    MCP = "MCP",
    GOOGLE_A2A = "GOOGLE_A2A",
    GOOGLE_JULES = "GOOGLE_JULES",
    AUGMENT_A2A = "AUGMENT_A2A",
    ANTHROPIC_MCP = "ANTHROPIC_MCP",
    PYDANTIC_AI = "PYDANTIC_AI",
    PYDANTIC = "PYDANTIC",// Add PYDANTIC alias for compatibility
    OPENAI_REALTIME = "OPENAI_REALTIME",
    CLAUDE_SUB_AGENT = "CLAUDE_SUB_AGENT",
    CUSTOM = "CUSTOM"
}
export declare enum BridgeType {
    MCP = "MCP",
    A2A = "A2A",
    WEBSOCKET = "WEBSOCKET",
    REDIS = "REDIS",
    HTTP = "HTTP",
    GRPC = "GRPC",
    SSE = "SSE"
}
export declare enum ConnectionState {
    CONNECTED = "CONNECTED",
    DISCONNECTED = "DISCONNECTED",
    CONNECTING = "CONNECTING",
    RECONNECTING = "RECONNECTING",
    ERROR = "ERROR",
    IDLE = "IDLE"
}
export type PrismaClient = any;
//# sourceMappingURL=prisma-enums.d.ts.map