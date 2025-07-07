import { EventEmitter } from 'events';
import { ConfigService } from './config/ConfigService';
export declare enum MessageRole {
    SYSTEM = "system",
    USER = "user",
    ASSISTANT = "assistant",
    FUNCTION = "function"
}
export declare enum MessageType {
    CHAT = "chat",
    COMMAND = "command",
    STREAM = "stream",
    STATUS = "status",
    RESPONSE = "response"
}
export declare enum Provider {
    LITELLM = "litellm",
    OPENROUTER = "openrouter"
}
export interface MessageContent {
    role: MessageRole;
    content: string;
    timestamp: number;
    metadata?: Record<string, any>;
}
export interface AgentConfig {
    name: string;
    model: string;
    apiKey: string;
    provider: Provider;
    metadata: AgentMetadata;
}
export interface AgentMetadata {
    description: string;
    capabilities: string[];
    personalityTraits: string[];
    communicationStyle: string;
    expertiseAreas: string[];
}
export declare class MessageHandler extends EventEmitter {
    private readonly configService;
    private readonly logger;
    private readonly maxMemoryMessages;
    private readonly agents;
    private readonly conversationContexts;
    constructor(configService: ConfigService);
    private createAgentConfig;
    private subscribeToMessages;
    private handleMessage;
    private determineTargetAgent;
    private addToConversationContext;
    private processMessage;
    private callAgent;
    private buildSystemPrompt;
    sendMessage(content: string, toAgent: string, fromAgent?: string): Promise<void>;
    getConversationContext(agentId: string): MessageContent[];
    clearConversationContext(agentId?: string): void;
    getAgents(): string[];
    getAgentConfig(agentId: string): AgentConfig | undefined;
}
//# sourceMappingURL=message_handler.d.ts.map