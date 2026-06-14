import { DatabaseService } from '@the-new-fuse/database';
declare enum MessageRole {
    USER = "USER",
    ASSISTANT = "ASSISTANT",
    SYSTEM = "SYSTEM"
}
/**
 * ChatRoomService handles multi-user chat room operations.
 *
 * This service works with ChatRoom model for collaborative conversations
 * between multiple users and/or agents.
 *
 * Note: For 1:1 agent conversations, see modules/chat/chat.service.ts
 */
export declare class ChatService {
    private readonly db;
    private readonly logger;
    constructor(db: DatabaseService);
    /**
     * Get all chat rooms with pagination
     */
    getRooms(page?: number, limit?: number, userId?: string): Promise<{
        rooms: any[];
        total: number;
        page: number;
        limit: number;
    }>;
    /**
     * Get a specific chat room by ID
     */
    getRoom(roomId: string, includeMessages?: boolean): Promise<any>;
    /**
     * Get messages for a room with pagination
     */
    getMessages(roomId: string, options: {
        limit: number;
        offset: number;
    }): Promise<any[]>;
    /**
     * Send a message to a chat room
     */
    sendMessage(roomId: string, content: string, senderId: string, options?: {
        role?: MessageRole;
        agentId?: string;
        metadata?: Record<string, unknown>;
    }): Promise<any>;
    /**
     * Create a new chat room
     */
    createRoom(ownerId: string, name: string, options?: {
        description?: string;
        isPrivate?: boolean;
        settings?: Record<string, unknown>;
        metadata?: Record<string, unknown>;
    }): Promise<any>;
    /**
     * Get chat analytics
     */
    getAnalytics(): Promise<{
        totalRooms: number;
        totalMessages: number;
        activeRooms: number;
        timestamp: Date;
    }>;
}
export {};
//# sourceMappingURL=chat.service.d.ts.map