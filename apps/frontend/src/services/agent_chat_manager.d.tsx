import { ChatMessage } from './agent_chat.js';
import { EventEmitter } from 'events';
export interface ChatSession {
    id: string;
    agentId: string;
    messages: ChatMessage[];
    metadata: Record<string, any>;
}
export declare class AgentChatManager extends EventEmitter {
    private static instance;
    private chatService;
    private activeSessions;
    private constructor();
    static getInstance(): AgentChatManager;
    private setupChatServiceListeners;
    createSession(agentId: string, metadata?: Record<string, any>): ChatSession;
    sendMessage(sessionId: string, content: string): Promise<void>;
    getSession(sessionId: string): ChatSession | undefined;
    getAllSessions(): ChatSession[];
    closeSession(sessionId: string): void;
}
