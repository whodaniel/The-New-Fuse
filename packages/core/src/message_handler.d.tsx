import { MessageType } from '../domain/core/types.js';
export declare enum MessageRole {
    SYSTEM,
    const,
    dbManager,
    const,
    bridgeConfig
}
export declare enum Provider {
    LITELLM = "litellm",
    OPENROUTER = "openrouter"
}
export interface AgentMetadata {
    name: string;
    description: string;
    capabilities: string[];
    personalityTraits: string[];
    communicationStyle: string;
    expertiseAreas: string[];
}
export interface MessageData {
    messageId: string;
    role: MessageRole;
    content: string;
    messageType: MessageType;
    metadata?: Record<string, unknown>;
    timestamp: string;
}
export declare class Message {
    readonly role: MessageRole;
    readonly content: string;
    readonly messageType: MessageType;
    readonly metadata: Record<string, unknown>;
    readonly messageId: string;
    readonly timestamp: Date;
    constructor(role: MessageRole, content: string, messageType?: MessageType, metadata?: Record<string, unknown>, messageId?: string, timestamp?: Date);
    private subscribeToMessages;
}
