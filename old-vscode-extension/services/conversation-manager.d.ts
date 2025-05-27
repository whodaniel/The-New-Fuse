/// <reference types="node" />
import { EventEmitter } from 'events';
import { AIMessage, MessageType } from '../types/shared.js';
interface ConversationState {
    id: string;
    sourceAgent: string;
    targetAgent: string;
    messages: AIMessage[];
    startTime: number;
    status: 'active' | 'idle' | 'ended';
    metadata?: Record<string, any>;
    lastMessageTime?: number;
}
export declare class ConversationManager extends EventEmitter {
    private static instance;
    private logger;
    private conversations;
    private relayService;
    private agentDiscovery;
    private messageHandlers;
    private constructor();
    static getInstance(): ConversationManager;
    private setupEventHandlers;
    startConversation(sourceAgent: string, targetAgent: string, metadata?: Record<string, any>): Promise<ConversationState>;
    sendMessage(messageInput: string | AIMessage): Promise<AIMessage>;
    private routeMessage;
    private handleInitiation;
    private handleMessage;
    private handleCodeInput;
    private handleAIRequest;
    private handleAgentStatusChange;
    registerHandler(type: MessageType, handler: Function): void;
    getConversation(id: string): ConversationState | undefined;
    getActiveConversations(): ConversationState[];
    endConversation(id: string): Promise<void>;
    /**
     * Clear all messages from all conversations
     */
    clearMessages(): void;
    dispose(): void;
}
export {};
//# sourceMappingURL=conversation-manager.d.ts.map