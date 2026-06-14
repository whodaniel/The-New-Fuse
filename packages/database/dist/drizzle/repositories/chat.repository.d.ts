import type { Chat, ChatMessage, ChatRoom, ChatRoomParticipant, Message, NewChat, NewChatMessage, NewChatRoom, NewChatRoomParticipant, NewMessage, NewReadReceipt, ReadReceipt } from '../types/index.js';
/**
 * Chat Repository - provides data access for Chat entities
 */
export declare class DrizzleChatRepository {
    /**
     * Create a new chat
     */
    createChat(data: NewChat): Promise<Chat>;
    /**
     * Find participants by room ID
     */
    findParticipantsByRoomId(roomId: string): Promise<ChatRoomParticipant[]>;
    /**
     * Add participant to room
     */
    addParticipant(data: NewChatRoomParticipant): Promise<ChatRoomParticipant>;
    /**
     * Find participant
     */
    findParticipant(roomId: string, userId: string): Promise<ChatRoomParticipant | null>;
    /**
     * Update participant
     */
    updateParticipant(roomId: string, userId: string, data: Partial<NewChatRoomParticipant>): Promise<ChatRoomParticipant | null>;
    /**
     * Remove participant
     */
    removeParticipant(roomId: string, userId: string): Promise<boolean>;
    /**
     * Upsert read receipt
     */
    upsertReadReceipt(data: NewReadReceipt): Promise<ReadReceipt>;
    /**
     * Find chat by ID
     */
    findChatById(id: string): Promise<Chat | null>;
    /**
     * Find chats by user ID
     */
    findChatsByUserId(userId: string): Promise<Chat[]>;
    /**
     * Find chats by agent ID
     */
    findChatsByAgentId(agentId: string): Promise<Chat[]>;
    /**
     * Update chat
     */
    updateChat(id: string, data: Partial<NewChat>): Promise<Chat | null>;
    /**
     * Soft delete chat
     */
    softDeleteChat(id: string): Promise<boolean>;
    /**
     * Create a new message
     */
    createMessage(data: NewMessage): Promise<Message>;
    /**
     * Find message by ID
     */
    findMessageById(id: string): Promise<Message | null>;
    /**
     * Find messages by chat ID
     */
    findMessagesByChatId(chatId: string, limit?: number): Promise<Message[]>;
    /**
     * Find messages by room ID
     */
    findMessagesByRoomId(roomId: string, limit?: number, offset?: number): Promise<Message[]>;
    /**
     * Update message
     */
    updateMessage(id: string, content: string): Promise<Message | null>;
    /**
     * Soft delete message
     */
    softDeleteMessage(id: string): Promise<boolean>;
    /**
     * Delete expired ephemeral messages
     */
    deleteExpiredMessages(): Promise<number>;
    /**
     * Create a chat room
     */
    createRoom(data: NewChatRoom): Promise<ChatRoom>;
    /**
     * Find room by ID
     */
    findRoomById(id: string): Promise<ChatRoom | null>;
    /**
     * Find rooms by owner ID
     */
    findRoomsByOwnerId(ownerId: string): Promise<ChatRoom[]>;
    /**
     * Find active rooms
     */
    /**
     * Find public active rooms
     */
    findPublicActiveRooms(): Promise<ChatRoom[]>;
    /**
     * Update room
     */
    updateRoom(id: string, data: Partial<NewChatRoom>): Promise<ChatRoom | null>;
    /**
     * Update room last message timestamp
     */
    updateRoomLastMessage(id: string): Promise<void>;
    /**
     * Soft delete room
     */
    softDeleteRoom(id: string): Promise<boolean>;
    /**
     * Create ephemeral chat message (auto-expires in 7 days)
     */
    createChatMessage(data: NewChatMessage): Promise<ChatMessage>;
    /**
     * Find chat messages by user ID
     */
    findChatMessagesByUserId(userId: string, limit?: number): Promise<ChatMessage[]>;
    /**
     * Delete expired chat messages
     */
    deleteExpiredChatMessages(): Promise<number>;
    /**
     * Count messages in chat
     */
    countMessagesInChat(chatId: string): Promise<number>;
    /**
     * Count messages in room
     */
    countMessagesInRoom(roomId: string): Promise<number>;
    /**
     * Search messages across rooms
     */
    searchMessages(userId: string, // Require User ID
    query: string, roomId?: string, senderId?: string, limit?: number, offset?: number): Promise<{
        items: Message[];
        total: number;
    }>;
    /**
     * Find rooms joined by user
     */
    findJoinedRooms(userId: string): Promise<ChatRoom[]>;
}
export declare const drizzleChatRepository: DrizzleChatRepository;
//# sourceMappingURL=chat.repository.d.ts.map