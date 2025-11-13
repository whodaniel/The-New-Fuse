/**
 * Local type definitions for agent protocol bridge
 * These types replace missing Prisma types and provide local interfaces
 */
export interface ProtocolAdapter {
    id: string;
    protocol: string;
    version: string;
    capabilities: string[];
    messageTypes: string[];
    isActive: boolean;
    configuration?: Record<string, any>;
    createdAt: Date;
    updatedAt: Date;
}
export interface AgentBridgeConnection {
    id: string;
    agentId: string;
    bridgeType: string;
    targetSystem: string;
    state: string;
    config?: Record<string, any>;
    lastHeartbeat?: Date;
    createdAt: Date;
    updatedAt: Date;
}
export interface MCPResource {
    id: string;
    name: string;
    description: string;
    uri: string;
    mimeType?: string;
    metadata?: Record<string, any>;
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
}
export interface MCPTool {
    id: string;
    name: string;
    description: string;
    inputSchema: Record<string, any>;
    handler: string;
    metadata?: Record<string, any>;
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
}
export interface Conversation {
    id: string;
    title?: string;
    participants: string[];
    initiatorId: string;
    topic?: string;
    metadata?: Record<string, any>;
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
}
export interface ConversationMessage {
    id: string;
    conversationId: string;
    senderId: string;
    content: string;
    messageType: string;
    metadata?: Record<string, any>;
    timestamp: Date;
    createdAt: Date;
    updatedAt: Date;
}
//# sourceMappingURL=local-types.d.ts.map