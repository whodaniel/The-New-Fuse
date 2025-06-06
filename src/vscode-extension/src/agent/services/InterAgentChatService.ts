import * as vscode from 'vscode';

export interface ChatSession {
    id: string;
    participants: string[];
    messages: ChatMessage[];
    createdAt: Date;
    lastActivity: Date;
    status: 'active' | 'archived' | 'closed';
}

export interface ChatMessage {
    id: string;
    sessionId: string;
    sender: string;
    content: string;
    timestamp: Date;
    type: 'text' | 'system' | 'error';
    metadata?: any;
}

export interface AgentInfo {
    id: string;
    name: string;
    type: string;
    status: 'online' | 'offline' | 'busy';
    capabilities: string[];
}

export class InterAgentChatService {
    private sessions = new Map<string, ChatSession>();
    private agents = new Map<string, AgentInfo>();

    constructor(private context: vscode.ExtensionContext) {}

    public createSession(participants: string[]): ChatSession {
        const session: ChatSession = {
            id: this.generateId(),
            participants,
            messages: [],
            createdAt: new Date(),
            lastActivity: new Date(),
            status: 'active'
        };

        this.sessions.set(session.id, session);
        return session;
    }

    public async sendMessage(sessionId: string, senderId: string, content: string): Promise<ChatMessage> {
        const session = this.sessions.get(sessionId);
        if (!session) {
            throw new Error(`Session ${sessionId} not found`);
        }

        const message: ChatMessage = {
            id: this.generateId(),
            sessionId,
            sender: senderId,
            content,
            timestamp: new Date(),
            type: 'text'
        };

        session.messages.push(message);
        session.lastActivity = new Date();

        return message;
    }

    public getSession(sessionId: string): ChatSession | undefined {
        return this.sessions.get(sessionId);
    }

    public getSessions(): ChatSession[] {
        return Array.from(this.sessions.values());
    }

    public getActiveAgents(): AgentInfo[] {
        return Array.from(this.agents.values()).filter(agent => agent.status === 'online');
    }

    public registerAgent(agent: AgentInfo): void {
        this.agents.set(agent.id, agent);
    }

    public unregisterAgent(agentId: string): void {
        this.agents.delete(agentId);
    }

    public getAgent(agentId: string): AgentInfo | undefined {
        return this.agents.get(agentId);
    }

    private generateId(): string {
        return `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }

    public dispose(): void {
        this.sessions.clear();
        this.agents.clear();
    }
}
