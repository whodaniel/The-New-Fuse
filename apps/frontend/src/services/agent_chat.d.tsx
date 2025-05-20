import { EventEmitter } from 'events';
export interface ChatMessage {
    id: string;
    content: string;
    role: 'user' | 'assistant' | 'system';
    timestamp: number;
    metadata?: Record<string, any>;
}
export declare class AgentChatService extends EventEmitter {
    private static instance;
    private ws;
    private messageQueue;
    private constructor();
    static getInstance(): AgentChatService;
    private setupWebSocketListeners;
    sendMessage(content: string, metadata?: Record<string, any>): Promise<void>;
    getMessageHistory(): ChatMessage[];
    clearHistory(): void;
}
