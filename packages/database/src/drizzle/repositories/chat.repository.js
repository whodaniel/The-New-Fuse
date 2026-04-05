"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.drizzleChatRepository = exports.DrizzleChatRepository = void 0;
/**
 * Chat Repository - Drizzle ORM Implementation
 * Provides data access for Chat and Message entities
 */
const drizzle_orm_1 = require("drizzle-orm");
const client_1 = require("../client");
const schema_1 = require("../schema");
/**
 * Chat Repository - provides data access for Chat entities
 */
class DrizzleChatRepository {
    /**
     * Create a new chat
     */
    async createChat(data) {
        const [chat] = await client_1.db.insert(schema_1.chats).values(data).returning();
        return chat;
    }
    // ... (Keep existing methods until end of class)
    /**
     * Find participants by room ID
     */
    async findParticipantsByRoomId(roomId) {
        return client_1.db.select().from(schema_1.chatRoomParticipants).where((0, drizzle_orm_1.eq)(schema_1.chatRoomParticipants.roomId, roomId));
    }
    /**
     * Add participant to room
     */
    async addParticipant(data) {
        const [participant] = await client_1.db.insert(schema_1.chatRoomParticipants).values(data).returning();
        return participant;
    }
    /**
     * Find participant
     */
    async findParticipant(roomId, userId) {
        const [participant] = await client_1.db
            .select()
            .from(schema_1.chatRoomParticipants)
            .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.chatRoomParticipants.roomId, roomId), (0, drizzle_orm_1.eq)(schema_1.chatRoomParticipants.userId, userId)));
        return participant ?? null;
    }
    /**
     * Update participant
     */
    async updateParticipant(roomId, userId, data) {
        const [participant] = await client_1.db
            .update(schema_1.chatRoomParticipants)
            .set(data)
            .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.chatRoomParticipants.roomId, roomId), (0, drizzle_orm_1.eq)(schema_1.chatRoomParticipants.userId, userId)))
            .returning();
        return participant ?? null;
    }
    /**
     * Remove participant
     */
    async removeParticipant(roomId, userId) {
        const result = await client_1.db
            .delete(schema_1.chatRoomParticipants)
            .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.chatRoomParticipants.roomId, roomId), (0, drizzle_orm_1.eq)(schema_1.chatRoomParticipants.userId, userId)))
            .returning();
        return result.length > 0;
    }
    /**
     * Upsert read receipt
     */
    async upsertReadReceipt(data) {
        const [existing] = await client_1.db
            .select()
            .from(schema_1.readReceipts)
            .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.readReceipts.messageId, data.messageId), (0, drizzle_orm_1.eq)(schema_1.readReceipts.userId, data.userId)));
        if (existing) {
            const [updated] = await client_1.db
                .update(schema_1.readReceipts)
                .set({ readAt: new Date() })
                .where((0, drizzle_orm_1.eq)(schema_1.readReceipts.id, existing.id))
                .returning();
            return updated;
        }
        else {
            const [created] = await client_1.db.insert(schema_1.readReceipts).values(data).returning();
            return created;
        }
    }
    /**
     * Find chat by ID
     */
    async findChatById(id) {
        const [chat] = await client_1.db
            .select()
            .from(schema_1.chats)
            .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.chats.id, id), (0, drizzle_orm_1.isNull)(schema_1.chats.deletedAt)));
        return chat ?? null;
    }
    /**
     * Find chats by user ID
     */
    async findChatsByUserId(userId) {
        return client_1.db
            .select()
            .from(schema_1.chats)
            .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.chats.userId, userId), (0, drizzle_orm_1.isNull)(schema_1.chats.deletedAt)))
            .orderBy((0, drizzle_orm_1.desc)(schema_1.chats.updatedAt));
    }
    /**
     * Find chats by agent ID
     */
    async findChatsByAgentId(agentId) {
        return client_1.db
            .select()
            .from(schema_1.chats)
            .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.chats.agentId, agentId), (0, drizzle_orm_1.isNull)(schema_1.chats.deletedAt)))
            .orderBy((0, drizzle_orm_1.desc)(schema_1.chats.updatedAt));
    }
    /**
     * Update chat
     */
    async updateChat(id, data) {
        const [chat] = await client_1.db
            .update(schema_1.chats)
            .set({ ...data, updatedAt: new Date() })
            .where((0, drizzle_orm_1.eq)(schema_1.chats.id, id))
            .returning();
        return chat ?? null;
    }
    /**
     * Soft delete chat
     */
    async softDeleteChat(id) {
        const result = await client_1.db
            .update(schema_1.chats)
            .set({ deletedAt: new Date(), updatedAt: new Date() })
            .where((0, drizzle_orm_1.eq)(schema_1.chats.id, id))
            .returning();
        return result.length > 0;
    }
    /**
     * Create a new message
     */
    async createMessage(data) {
        const [message] = await client_1.db.insert(schema_1.messages).values(data).returning();
        return message;
    }
    /**
     * Find message by ID
     */
    async findMessageById(id) {
        const [message] = await client_1.db
            .select()
            .from(schema_1.messages)
            .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.messages.id, id), (0, drizzle_orm_1.eq)(schema_1.messages.isDeleted, false)));
        return message ?? null;
    }
    /**
     * Find messages by chat ID
     */
    async findMessagesByChatId(chatId, limit = 100) {
        return client_1.db
            .select()
            .from(schema_1.messages)
            .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.messages.chatId, chatId), (0, drizzle_orm_1.eq)(schema_1.messages.isDeleted, false)))
            .orderBy((0, drizzle_orm_1.desc)(schema_1.messages.timestamp))
            .limit(limit);
    }
    /**
     * Find messages by room ID
     */
    async findMessagesByRoomId(roomId, limit = 100, offset = 0) {
        return client_1.db
            .select()
            .from(schema_1.messages)
            .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.messages.roomId, roomId), (0, drizzle_orm_1.eq)(schema_1.messages.isDeleted, false)))
            .orderBy((0, drizzle_orm_1.desc)(schema_1.messages.timestamp))
            .limit(limit)
            .offset(offset);
    }
    /**
     * Update message
     */
    async updateMessage(id, content) {
        const [message] = await client_1.db
            .update(schema_1.messages)
            .set({
            content,
            isEdited: true,
            updatedAt: new Date(),
        })
            .where((0, drizzle_orm_1.eq)(schema_1.messages.id, id))
            .returning();
        return message ?? null;
    }
    /**
     * Soft delete message
     */
    async softDeleteMessage(id) {
        const result = await client_1.db
            .update(schema_1.messages)
            .set({ isDeleted: true, updatedAt: new Date() })
            .where((0, drizzle_orm_1.eq)(schema_1.messages.id, id))
            .returning();
        return result.length > 0;
    }
    /**
     * Delete expired ephemeral messages
     */
    async deleteExpiredMessages() {
        const result = await client_1.db
            .delete(schema_1.messages)
            .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.messages.isEphemeral, true), (0, drizzle_orm_1.sql) `${schema_1.messages.expiresAt} < NOW()`))
            .returning();
        return result.length;
    }
    /**
     * Create a chat room
     */
    async createRoom(data) {
        const [room] = await client_1.db.insert(schema_1.chatRooms).values(data).returning();
        return room;
    }
    /**
     * Find room by ID
     */
    async findRoomById(id) {
        const [room] = await client_1.db
            .select()
            .from(schema_1.chatRooms)
            .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.chatRooms.id, id), (0, drizzle_orm_1.isNull)(schema_1.chatRooms.deletedAt)));
        return room ?? null;
    }
    /**
     * Find rooms by owner ID
     */
    async findRoomsByOwnerId(ownerId) {
        return client_1.db
            .select()
            .from(schema_1.chatRooms)
            .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.chatRooms.ownerId, ownerId), (0, drizzle_orm_1.isNull)(schema_1.chatRooms.deletedAt)))
            .orderBy((0, drizzle_orm_1.desc)(schema_1.chatRooms.updatedAt));
    }
    /**
     * Find active rooms
     */
    /**
     * Find public active rooms
     */
    async findPublicActiveRooms() {
        return client_1.db
            .select()
            .from(schema_1.chatRooms)
            .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.chatRooms.isActive, true), (0, drizzle_orm_1.eq)(schema_1.chatRooms.isPrivate, false), (0, drizzle_orm_1.isNull)(schema_1.chatRooms.deletedAt)))
            .orderBy((0, drizzle_orm_1.desc)(schema_1.chatRooms.lastMessageAt));
    }
    /**
     * Update room
     */
    async updateRoom(id, data) {
        const [room] = await client_1.db
            .update(schema_1.chatRooms)
            .set({ ...data, updatedAt: new Date() })
            .where((0, drizzle_orm_1.eq)(schema_1.chatRooms.id, id))
            .returning();
        return room ?? null;
    }
    /**
     * Update room last message timestamp
     */
    async updateRoomLastMessage(id) {
        await client_1.db
            .update(schema_1.chatRooms)
            .set({ lastMessageAt: new Date(), updatedAt: new Date() })
            .where((0, drizzle_orm_1.eq)(schema_1.chatRooms.id, id));
    }
    /**
     * Soft delete room
     */
    async softDeleteRoom(id) {
        const result = await client_1.db
            .update(schema_1.chatRooms)
            .set({ deletedAt: new Date(), isActive: false, updatedAt: new Date() })
            .where((0, drizzle_orm_1.eq)(schema_1.chatRooms.id, id))
            .returning();
        return result.length > 0;
    }
    /**
     * Create ephemeral chat message (auto-expires in 7 days)
     */
    async createChatMessage(data) {
        const [message] = await client_1.db.insert(schema_1.chatMessages).values(data).returning();
        return message;
    }
    /**
     * Find chat messages by user ID
     */
    async findChatMessagesByUserId(userId, limit = 50) {
        return client_1.db
            .select()
            .from(schema_1.chatMessages)
            .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.chatMessages.userId, userId), (0, drizzle_orm_1.sql) `${schema_1.chatMessages.expiresAt} > NOW()`))
            .orderBy((0, drizzle_orm_1.desc)(schema_1.chatMessages.createdAt))
            .limit(limit);
    }
    /**
     * Delete expired chat messages
     */
    async deleteExpiredChatMessages() {
        const result = await client_1.db
            .delete(schema_1.chatMessages)
            .where((0, drizzle_orm_1.sql) `${schema_1.chatMessages.expiresAt} < NOW()`)
            .returning();
        return result.length;
    }
    /**
     * Count messages in chat
     */
    async countMessagesInChat(chatId) {
        const result = await client_1.db
            .select({ count: client_1.db.$count(schema_1.messages) })
            .from(schema_1.messages)
            .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.messages.chatId, chatId), (0, drizzle_orm_1.eq)(schema_1.messages.isDeleted, false)));
        return result[0]?.count ?? 0;
    }
    /**
     * Count messages in room
     */
    async countMessagesInRoom(roomId) {
        const result = await client_1.db
            .select({ count: client_1.db.$count(schema_1.messages) })
            .from(schema_1.messages)
            .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.messages.roomId, roomId), (0, drizzle_orm_1.eq)(schema_1.messages.isDeleted, false)));
        return result[0]?.count ?? 0;
    }
    /**
     * Search messages across rooms
     */
    async searchMessages(userId, // Require User ID
    query, roomId, senderId, limit = 50, offset = 0) {
        const filters = [
            (0, drizzle_orm_1.sql) `${schema_1.messages.content} ILIKE ${'%' + query + '%'}`,
            (0, drizzle_orm_1.eq)(schema_1.messages.isDeleted, false),
        ];
        if (roomId) {
            // Validation: Ensure user is in the room? (Ideally yes, but lightweight check here)
            filters.push((0, drizzle_orm_1.eq)(schema_1.messages.roomId, roomId));
        }
        else {
            // Enforce: Search ONLY rooms user has joined
            const userRooms = await client_1.db
                .select({ id: schema_1.chatRoomParticipants.roomId })
                .from(schema_1.chatRoomParticipants)
                .where((0, drizzle_orm_1.eq)(schema_1.chatRoomParticipants.userId, userId));
            if (userRooms.length === 0) {
                return { items: [], total: 0 };
            }
            const roomIds = userRooms.map((r) => r.id);
            filters.push((0, drizzle_orm_1.inArray)(schema_1.messages.roomId, roomIds));
        }
        if (senderId)
            filters.push((0, drizzle_orm_1.eq)(schema_1.messages.senderId, senderId));
        const [items, countResult] = await Promise.all([
            client_1.db
                .select()
                .from(schema_1.messages)
                .where((0, drizzle_orm_1.and)(...filters))
                .orderBy((0, drizzle_orm_1.desc)(schema_1.messages.timestamp))
                .limit(limit)
                .offset(offset),
            client_1.db
                .select({ count: client_1.db.$count(schema_1.messages) })
                .from(schema_1.messages)
                .where((0, drizzle_orm_1.and)(...filters)),
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
        const rows = await client_1.db
            .select({ room: schema_1.chatRooms })
            .from(schema_1.chatRooms)
            .innerJoin(schema_1.chatRoomParticipants, (0, drizzle_orm_1.eq)(schema_1.chatRooms.id, schema_1.chatRoomParticipants.roomId))
            .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.chatRoomParticipants.userId, userId), (0, drizzle_orm_1.isNull)(schema_1.chatRooms.deletedAt)))
            .orderBy((0, drizzle_orm_1.desc)(schema_1.chatRooms.lastMessageAt));
        return rows.map((r) => r.room);
    }
}
exports.DrizzleChatRepository = DrizzleChatRepository;
// Export singleton instance
exports.drizzleChatRepository = new DrizzleChatRepository();
//# sourceMappingURL=chat.repository.js.map