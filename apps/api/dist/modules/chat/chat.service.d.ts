import { DatabaseService, MessageRole } from '@the-new-fuse/database';
import { AgentsService } from '../../agents/agents.service';
/**
 * ChatService handles agent-based chat conversations.
 * Migrated to Drizzle ORM.
 */
export declare class ChatService {
    private db;
    private agentsService;
    private readonly logger;
    constructor(db: DatabaseService, agentsService: AgentsService);
    /**
     * Find all chats for a user (via their agents)
     */
    findAll(userId: string): Promise<any>;
    /**
     * Find a specific chat by ID
     */
    findOne(id: string, userId: string): Promise<any>;
    /**
     * Create a new chat with an agent
     */
    create(userId: string, agentId: string, title?: string): Promise<any>;
    /**
     * Add a message to a chat
     */
    addMessage(chatId: string, content: string, role: MessageRole, options?: {
        senderId?: string;
        agentId?: string;
        metadata?: Record<string, unknown>;
    }): Promise<any>;
    /**
     * Get messages for a chat with pagination
     */
    getMessages(chatId: string, options?: {
        limit?: number;
        cursor?: string;
    }): Promise<any>;
    /**
     * Generate an agent response for a prompt
     */
    generateAgentResponse(_prompt: string, agentId: string, userId: string): Promise<void>;
    /**
     * Delete a chat and its messages
     */
    delete(chatId: string, userId: string): Promise<{
        success: boolean;
    }>;
}
//# sourceMappingURL=chat.service.d.ts.map