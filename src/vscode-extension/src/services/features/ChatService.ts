import * as vscode from 'vscode';

export interface ChatSession {
    id: string;
    title: string;
    messages: ChatMessage[];
    createdAt: Date;
    updatedAt: Date;
}

export interface ChatMessage {
    id: string;
    content: string;
    role: 'user' | 'assistant' | 'system';
    timestamp: Date;
}

export class ChatService {
    private sessions: ChatSession[] = [];
    private currentSession: ChatSession | null = null;

    constructor(private context: vscode.ExtensionContext) {
        this.loadSessions();
    }

    async createNewSession(title?: string): Promise<ChatSession> {
        const session: ChatSession = {
            id: this.generateId(),
            title: title || `Chat ${this.sessions.length + 1}`,
            messages: [],
            createdAt: new Date(),
            updatedAt: new Date()
        };

        this.sessions.push(session);
        this.currentSession = session;
        await this.saveSessions();
        return session;
    }

    async addMessage(content: string, role: 'user' | 'assistant' | 'system'): Promise<void> {
        if (!this.currentSession) {
            await this.createNewSession();
        }

        const message: ChatMessage = {
            id: this.generateId(),
            content,
            role,
            timestamp: new Date()
        };

        this.currentSession!.messages.push(message);
        this.currentSession!.updatedAt = new Date();
        await this.saveSessions();
    }

    getCurrentSession(): ChatSession | null {
        return this.currentSession;
    }

    getAllSessions(): ChatSession[] {
        return this.sessions;
    }

    async clearHistory(): Promise<void> {
        this.sessions = [];
        this.currentSession = null;
        await this.saveSessions();
    }

    private async loadSessions(): Promise<void> {
        try {
            const stored = this.context.globalState.get<ChatSession[]>('chatSessions', []);
            this.sessions = stored;
            if (this.sessions.length > 0) {
                this.currentSession = this.sessions[this.sessions.length - 1];
            }
        } catch (error) {
            console.error('Failed to load chat sessions:', error);
        }
    }

    private async saveSessions(): Promise<void> {
        try {
            await this.context.globalState.update('chatSessions', this.sessions);
        } catch (error) {
            console.error('Failed to save chat sessions:', error);
        }
    }

    private generateId(): string {
        return Math.random().toString(36).substr(2, 9);
    }
}