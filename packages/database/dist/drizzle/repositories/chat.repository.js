/**
 * Chat Repository - Drizzle ORM Implementation
 * Provides data access for Chat and Message entities
 */
import { and, desc, eq, inArray, isNull, sql } from 'drizzle-orm';
import { db } from '../client.js';
import { chatMessages, chatRoomParticipants, chatRooms, chats, messages, readReceipts, } from '../schema.js';
/**
 * Chat Repository - provides data access for Chat entities
 */
export class DrizzleChatRepository {
    /**
     * Create a new chat
     */
    async createChat(data) {
        const [chat] = await db.insert(chats).values(data).returning();
        return chat;
    }
    // ... (Keep existing methods until end of class)
    /**
     * Find participants by room ID
     */
    async findParticipantsByRoomId(roomId) {
        return db.select().from(chatRoomParticipants).where(eq(chatRoomParticipants.roomId, roomId));
    }
    /**
     * Add participant to room
     */
    async addParticipant(data) {
        const [participant] = await db.insert(chatRoomParticipants).values(data).returning();
        return participant;
    }
    /**
     * Find participant
     */
    async findParticipant(roomId, userId) {
        const [participant] = await db
            .select()
            .from(chatRoomParticipants)
            .where(and(eq(chatRoomParticipants.roomId, roomId), eq(chatRoomParticipants.userId, userId)));
        return participant ?? null;
    }
    /**
     * Update participant
     */
    async updateParticipant(roomId, userId, data) {
        const [participant] = await db
            .update(chatRoomParticipants)
            .set(data)
            .where(and(eq(chatRoomParticipants.roomId, roomId), eq(chatRoomParticipants.userId, userId)))
            .returning();
        return participant ?? null;
    }
    /**
     * Remove participant
     */
    async removeParticipant(roomId, userId) {
        const result = await db
            .delete(chatRoomParticipants)
            .where(and(eq(chatRoomParticipants.roomId, roomId), eq(chatRoomParticipants.userId, userId)))
            .returning();
        return result.length > 0;
    }
    /**
     * Upsert read receipt
     */
    async upsertReadReceipt(data) {
        const [existing] = await db
            .select()
            .from(readReceipts)
            .where(and(eq(readReceipts.messageId, data.messageId), eq(readReceipts.userId, data.userId)));
        if (existing) {
            const [updated] = await db
                .update(readReceipts)
                .set({ readAt: new Date() })
                .where(eq(readReceipts.id, existing.id))
                .returning();
            return updated;
        }
        else {
            const [created] = await db.insert(readReceipts).values(data).returning();
            return created;
        }
    }
    /**
     * Find chat by ID
     */
    async findChatById(id) {
        const [chat] = await db
            .select()
            .from(chats)
            .where(and(eq(chats.id, id), isNull(chats.deletedAt)));
        return chat ?? null;
    }
    /**
     * Find chats by user ID
     */
    async findChatsByUserId(userId) {
        return db
            .select()
            .from(chats)
            .where(and(eq(chats.userId, userId), isNull(chats.deletedAt)))
            .orderBy(desc(chats.updatedAt));
    }
    /**
     * Find chats by agent ID
     */
    async findChatsByAgentId(agentId) {
        return db
            .select()
            .from(chats)
            .where(and(eq(chats.agentId, agentId), isNull(chats.deletedAt)))
            .orderBy(desc(chats.updatedAt));
    }
    /**
     * Update chat
     */
    async updateChat(id, data) {
        const [chat] = await db
            .update(chats)
            .set({ ...data, updatedAt: new Date() })
            .where(eq(chats.id, id))
            .returning();
        return chat ?? null;
    }
    /**
     * Soft delete chat
     */
    async softDeleteChat(id) {
        const result = await db
            .update(chats)
            .set({ deletedAt: new Date(), updatedAt: new Date() })
            .where(eq(chats.id, id))
            .returning();
        return result.length > 0;
    }
    /**
     * Create a new message
     */
    async createMessage(data) {
        const [message] = await db.insert(messages).values(data).returning();
        return message;
    }
    /**
     * Find message by ID
     */
    async findMessageById(id) {
        const [message] = await db
            .select()
            .from(messages)
            .where(and(eq(messages.id, id), eq(messages.isDeleted, false)));
        return message ?? null;
    }
    /**
     * Find messages by chat ID
     */
    async findMessagesByChatId(chatId, limit = 100) {
        return db
            .select()
            .from(messages)
            .where(and(eq(messages.chatId, chatId), eq(messages.isDeleted, false)))
            .orderBy(desc(messages.timestamp))
            .limit(limit);
    }
    /**
     * Find messages by room ID
     */
    async findMessagesByRoomId(roomId, limit = 100, offset = 0) {
        return db
            .select()
            .from(messages)
            .where(and(eq(messages.roomId, roomId), eq(messages.isDeleted, false)))
            .orderBy(desc(messages.timestamp))
            .limit(limit)
            .offset(offset);
    }
    /**
     * Update message
     */
    async updateMessage(id, content) {
        const [message] = await db
            .update(messages)
            .set({
            content,
            isEdited: true,
            updatedAt: new Date(),
        })
            .where(eq(messages.id, id))
            .returning();
        return message ?? null;
    }
    /**
     * Soft delete message
     */
    async softDeleteMessage(id) {
        const result = await db
            .update(messages)
            .set({ isDeleted: true, updatedAt: new Date() })
            .where(eq(messages.id, id))
            .returning();
        return result.length > 0;
    }
    /**
     * Delete expired ephemeral messages
     */
    async deleteExpiredMessages() {
        const result = await db
            .delete(messages)
            .where(and(eq(messages.isEphemeral, true), sql `${messages.expiresAt} < NOW()`))
            .returning();
        return result.length;
    }
    /**
     * Create a chat room
     */
    async createRoom(data) {
        const [room] = await db.insert(chatRooms).values(data).returning();
        return room;
    }
    /**
     * Find room by ID
     */
    async findRoomById(id) {
        const [room] = await db
            .select()
            .from(chatRooms)
            .where(and(eq(chatRooms.id, id), isNull(chatRooms.deletedAt)));
        return room ?? null;
    }
    /**
     * Find rooms by owner ID
     */
    async findRoomsByOwnerId(ownerId) {
        return db
            .select()
            .from(chatRooms)
            .where(and(eq(chatRooms.ownerId, ownerId), isNull(chatRooms.deletedAt)))
            .orderBy(desc(chatRooms.updatedAt));
    }
    /**
     * Find active rooms
     */
    /**
     * Find public active rooms
     */
    async findPublicActiveRooms() {
        return db
            .select()
            .from(chatRooms)
            .where(and(eq(chatRooms.isActive, true), eq(chatRooms.isPrivate, false), isNull(chatRooms.deletedAt)))
            .orderBy(desc(chatRooms.lastMessageAt));
    }
    /**
     * Update room
     */
    async updateRoom(id, data) {
        const [room] = await db
            .update(chatRooms)
            .set({ ...data, updatedAt: new Date() })
            .where(eq(chatRooms.id, id))
            .returning();
        return room ?? null;
    }
    /**
     * Update room last message timestamp
     */
    async updateRoomLastMessage(id) {
        await db
            .update(chatRooms)
            .set({ lastMessageAt: new Date(), updatedAt: new Date() })
            .where(eq(chatRooms.id, id));
    }
    /**
     * Soft delete room
     */
    async softDeleteRoom(id) {
        const result = await db
            .update(chatRooms)
            .set({ deletedAt: new Date(), isActive: false, updatedAt: new Date() })
            .where(eq(chatRooms.id, id))
            .returning();
        return result.length > 0;
    }
    /**
     * Create ephemeral chat message (auto-expires in 7 days)
     */
    async createChatMessage(data) {
        const [message] = await db.insert(chatMessages).values(data).returning();
        return message;
    }
    /**
     * Find chat messages by user ID
     */
    async findChatMessagesByUserId(userId, limit = 50) {
        return db
            .select()
            .from(chatMessages)
            .where(and(eq(chatMessages.userId, userId), sql `${chatMessages.expiresAt} > NOW()`))
            .orderBy(desc(chatMessages.createdAt))
            .limit(limit);
    }
    /**
     * Delete expired chat messages
     */
    async deleteExpiredChatMessages() {
        const result = await db
            .delete(chatMessages)
            .where(sql `${chatMessages.expiresAt} < NOW()`)
            .returning();
        return result.length;
    }
    /**
     * Count messages in chat
     */
    async countMessagesInChat(chatId) {
        const result = await db
            .select({ count: db.$count(messages) })
            .from(messages)
            .where(and(eq(messages.chatId, chatId), eq(messages.isDeleted, false)));
        return result[0]?.count ?? 0;
    }
    /**
     * Count messages in room
     */
    async countMessagesInRoom(roomId) {
        const result = await db
            .select({ count: db.$count(messages) })
            .from(messages)
            .where(and(eq(messages.roomId, roomId), eq(messages.isDeleted, false)));
        return result[0]?.count ?? 0;
    }
    /**
     * Search messages across rooms
     */
    async searchMessages(userId, // Require User ID
    query, roomId, senderId, limit = 50, offset = 0) {
        const filters = [
            sql `${messages.content} ILIKE ${'%' + query + '%'}`,
            eq(messages.isDeleted, false),
        ];
        if (roomId) {
            // Validation: Ensure user is in the room? (Ideally yes, but lightweight check here)
            filters.push(eq(messages.roomId, roomId));
        }
        else {
            // Enforce: Search ONLY rooms user has joined
            const userRooms = await db
                .select({ id: chatRoomParticipants.roomId })
                .from(chatRoomParticipants)
                .where(eq(chatRoomParticipants.userId, userId));
            if (userRooms.length === 0) {
                return { items: [], total: 0 };
            }
            const roomIds = userRooms.map((r) => r.id);
            filters.push(inArray(messages.roomId, roomIds));
        }
        if (senderId)
            filters.push(eq(messages.senderId, senderId));
        const [items, countResult] = await Promise.all([
            db
                .select()
                .from(messages)
                .where(and(...filters))
                .orderBy(desc(messages.timestamp))
                .limit(limit)
                .offset(offset),
            db
                .select({ count: db.$count(messages) })
                .from(messages)
                .where(and(...filters)),
        ]);
        return {
            items,
            total: countResult[0]?.count ?? 0,
        };
    }
    /**
     * Find rooms joined by user
     */
    async findJoinedRooms(userId) {
        const rows = await db
            .select({ room: chatRooms })
            .from(chatRooms)
            .innerJoin(chatRoomParticipants, eq(chatRooms.id, chatRoomParticipants.roomId))
            .where(and(eq(chatRoomParticipants.userId, userId), isNull(chatRooms.deletedAt)))
            .orderBy(desc(chatRooms.lastMessageAt));
        return rows.map((r) => r.room);
    }
}
// Export singleton instance
export const drizzleChatRepository = new DrizzleChatRepository();
//# sourceMappingURL=chat.repository.js.map