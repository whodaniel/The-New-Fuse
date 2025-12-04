import { ChatService } from './chat.service';
interface ChatSession {
    id: string;
    agentId: string;
    messages: Array<{
        content: string;
        timestamp: Date;
    }>;
    metadata: Record<string, unknown>;
}
export declare class AgentChatManager extends EventEmitter {
    private readonly chatService;
    private activeSessions;
    constructor(chatService: ChatService);
    createSession(agentId: string, metadata?: Record<string, unknown>): Promise<ChatSession>;
    sendMessage(sessionId: string, content: string): Promise<void>;
    getSession(sessionId: string): ChatSession | undefined;
    getAllSessions(): ChatSession[];
    closeSession(sessionId: string): void;
}
export {};
