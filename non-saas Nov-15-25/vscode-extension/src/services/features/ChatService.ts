import * as vscode from 'vscode';
import { ConfigurationService } from '../core/ConfigurationService';
import { NotificationService } from '../core/NotificationService';

export interface ChatMessage {
    id: string;
    content: string;
    role: 'user' | 'assistant' | 'system';
    timestamp: number;
    sessionId: string;
    metadata?: any;
}

export interface ChatSession {
    id: string;
    title: string;
    messages: ChatMessage[];
    createdAt: number;
    updatedAt: number;
    isActive: boolean;
}

export class ChatService {
    private sessions: Map<string, ChatSession> = new Map();
    private currentSessionId?: string;

    constructor(
        private context: vscode.ExtensionContext,
        private configService: ConfigurationService,
        private notificationService: NotificationService
    ) {
        this.loadSessions();
    }

    async initialize(): Promise<void> {
        // Initialize chat service
        console.log('ChatService initialized');
    }

    async createNewSession(title?: string): Promise<ChatSession> {
        const sessionId = `session-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        const session: ChatSession = {
            id: sessionId,
            title: title || `Chat ${new Date().toLocaleString()}`,
            messages: [],
            createdAt: Date.now(),
            updatedAt: Date.now(),
            isActive: true
        };

        this.sessions.set(sessionId, session);
        this.currentSessionId = sessionId;
        await this.saveSessions();
        
        return session;
    }

    async addMessage(content: string, role: 'user' | 'assistant' | 'system', sessionId?: string): Promise<ChatMessage> {
        const targetSessionId = sessionId || this.currentSessionId;
        if (!targetSessionId) {
            throw new Error('No active session');
        }

        const session = this.sessions.get(targetSessionId);
        if (!session) {
            throw new Error('Session not found');
        }

        const message: ChatMessage = {
            id: `msg-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            content,
            role,
            timestamp: Date.now(),
            sessionId: targetSessionId
        };

        session.messages.push(message);
        session.updatedAt = Date.now();
        
        await this.saveSessions();
        return message;
    }

    async getCurrentSession(): Promise<ChatSession | undefined> {
        if (!this.currentSessionId) return undefined;
        return this.sessions.get(this.currentSessionId);
    }

    async getSession(sessionId: string): Promise<ChatSession | undefined> {
        return this.sessions.get(sessionId);
    }

    async getAllSessions(): Promise<ChatSession[]> {
        return Array.from(this.sessions.values());
    }

    async switchSession(sessionId: string): Promise<void> {
        if (!this.sessions.has(sessionId)) {
            throw new Error('Session not found');
        }
        this.currentSessionId = sessionId;
    }

    async clearHistory(sessionId?: string): Promise<void> {
        if (sessionId) {
            const session = this.sessions.get(sessionId);
            if (session) {
                session.messages = [];
                session.updatedAt = Date.now();
            }
        } else {
            this.sessions.clear();
            this.currentSessionId = undefined;
        }
        await this.saveSessions();
    }

    async deleteSession(sessionId: string): Promise<void> {
        this.sessions.delete(sessionId);
        if (this.currentSessionId === sessionId) {
            this.currentSessionId = undefined;
        }
        await this.saveSessions();
    }

    private async saveSessions(): Promise<void> {
        const sessionsData = Array.from(this.sessions.entries());
        await this.context.globalState.update('chatSessions', sessionsData);
    }

    private async loadSessions(): Promise<void> {
        const sessionsData = this.context.globalState.get<[string, ChatSession][]>('chatSessions', []);
        this.sessions = new Map(sessionsData);
        
        // Set first session as active if none is set
        if (!this.currentSessionId && this.sessions.size > 0) {
            this.currentSessionId = Array.from(this.sessions.keys())[0];
        }
    }

    async exportSession(sessionId: string): Promise<any> {
        const session = this.sessions.get(sessionId);
        if (!session) {
            throw new Error('Session not found');
        }
        
        return {
            session,
            exportedAt: Date.now(),
            version: '1.0'
        };
    }

    async importSession(sessionData: any): Promise<ChatSession> {
        if (!sessionData.session) {
            throw new Error('Invalid session data');
        }
        
        const session = sessionData.session as ChatSession;
        this.sessions.set(session.id, session);
        await this.saveSessions();
        
        return session;
    }
}