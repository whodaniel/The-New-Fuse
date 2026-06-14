import { EventEmitter } from 'events';
export interface ChatMessage {
    id: string;
    role: 'user' | 'assistant' | 'system';
    content: string;
    timestamp: string;
    metadata?: Record<string, unknown>;
}
export interface ChatSession {
    id: string;
    messages: ChatMessage[];
    createdAt: string;
    updatedAt: string;
}
export declare class ChatManager extends EventEmitter {
    private sessions;
    createSession(id?: string): ChatSession;
    getSession(id: string): ChatSession | undefined;
    listSessions(): ChatSession[];
    addMessage(sessionId: string, role: ChatMessage['role'], content: string, metadata?: Record<string, unknown>): ChatMessage;
    deleteSession(id: string): boolean;
}
