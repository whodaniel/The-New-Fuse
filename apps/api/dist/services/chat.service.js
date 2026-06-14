"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var ChatService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.ChatService = void 0;
/**
 * ChatService - Migrated to Drizzle ORM
 * Handles multi-user chat room operations
 */
const common_1 = require("@nestjs/common");
const database_1 = require("@the-new-fuse/database");
// Message role enum
var MessageRole;
(function (MessageRole) {
    MessageRole["USER"] = "USER";
    MessageRole["ASSISTANT"] = "ASSISTANT";
    MessageRole["SYSTEM"] = "SYSTEM";
})(MessageRole || (MessageRole = {}));
/**
 * ChatRoomService handles multi-user chat room operations.
 *
 * This service works with ChatRoom model for collaborative conversations
 * between multiple users and/or agents.
 *
 * Note: For 1:1 agent conversations, see modules/chat/chat.service.ts
 */
let ChatService = ChatService_1 = class ChatService {
    constructor(db) {
        this.db = db;
        this.logger = new common_1.Logger(ChatService_1.name);
    }
    /**
     * Get all chat rooms with pagination
     */
    async getRooms(page = 1, limit = 50, userId) {
        const rooms = userId
            ? await this.db.chats.findJoinedRooms(userId)
            : await this.db.chats.findPublicActiveRooms();
        // Apply pagination manually
        const start = (page - 1) * limit;
        const paginatedRooms = rooms.slice(start, start + limit);
        return { rooms: paginatedRooms, total: rooms.length, page, limit };
    }
    /**
     * Get a specific chat room by ID
     */
    async getRoom(roomId, includeMessages = false) {
        const room = await this.db.chats.findRoomById(roomId);
        if (!room) {
            throw new common_1.NotFoundException('Chat room not found');
        }
        if (includeMessages) {
            const messages = await this.db.chats.findMessagesByRoomId(roomId, 50);
            return { ...room, messages };
        }
        return room;
    }
    /**
     * Get messages for a room with pagination
     */
    async getMessages(roomId, options) {
        // Verify room exists
        await this.getRoom(roomId);
        return this.db.chats.findMessagesByRoomId(roomId, options.limit, options.offset);
    }
    /**
     * Send a message to a chat room
     */
    async sendMessage(roomId, content, senderId, options) {
        // Verify room exists
        const room = await this.getRoom(roomId);
        const message = await this.db.chats.createMessage({
            content,
            role: options?.role || MessageRole.USER,
            roomId: room.id,
            senderId,
            agentId: options?.agentId,
            metadata: options?.metadata,
        });
        // Update room's lastMessageAt
        await this.db.chats.updateRoomLastMessage(roomId);
        return message;
    }
    /**
     * Create a new chat room
     */
    async createRoom(ownerId, name, options) {
        return this.db.chats.createRoom({
            name,
            ownerId,
            description: options?.description,
            isPrivate: options?.isPrivate || false,
            settings: options?.settings,
            metadata: options?.metadata,
        });
    }
    /**
     * Get chat analytics
     */
    async getAnalytics() {
        // Get active rooms to count
        const activeRooms = await this.db.chats.findPublicActiveRooms();
        return {
            totalRooms: activeRooms.length,
            totalMessages: 0, // Would need to implement a count method
            activeRooms: activeRooms.length,
            timestamp: new Date(),
        };
    }
};
exports.ChatService = ChatService;
exports.ChatService = ChatService = ChatService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [database_1.DatabaseService])
], ChatService);
//# sourceMappingURL=chat.service.js.map