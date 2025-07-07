var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
let ChatMessageRepository = class ChatMessageRepository {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    mapDatabaseMessageToChatMessage(dbMessage) {
        return {
            id: dbMessage.id,
            content: dbMessage.content,
            role: dbMessage.role, // MessageRole to string
            userId: 'unknown', // Not available in current schema
            sessionId: dbMessage.chatId, // Map chatId to sessionId
            metadata: dbMessage.metadata || {},
            createdAt: dbMessage.createdAt,
            updatedAt: dbMessage.createdAt // Use createdAt since updatedAt doesn't exist
        };
    }
    getMessageSelect() {
        return {
            id: true,
            content: true,
            role: true,
            chatId: true,
            createdAt: true
        };
    }
    async findById(id) {
        const message = await this.prisma.message.findUnique({
            where: { id },
            select: this.getMessageSelect()
        });
        if (!message)
            return null;
        return this.mapDatabaseMessageToChatMessage(message);
    }
    async findMany(filters) {
        const messages = await this.prisma.message.findMany({
            where: filters,
            select: this.getMessageSelect(),
            orderBy: {
                createdAt: 'desc'
            }
        });
        return messages.map(message => this.mapDatabaseMessageToChatMessage(message));
    }
    async create(data) {
        // Map ChatMessage interface to database Message fields
        const dbData = {
            content: data.content,
            role: data.role,
            chatId: data.sessionId || data.chatId // Map sessionId to chatId
        };
        const message = await this.prisma.message.create({
            data: dbData,
            select: this.getMessageSelect()
        });
        return this.mapDatabaseMessageToChatMessage(message);
    }
    async update(id, data) {
        const dbData = {};
        if (data.content !== undefined)
            dbData.content = data.content;
        if (data.role !== undefined)
            dbData.role = data.role;
        if (data.sessionId !== undefined)
            dbData.chatId = data.sessionId;
        const message = await this.prisma.message.update({
            where: { id },
            data: dbData,
            select: this.getMessageSelect()
        });
        return this.mapDatabaseMessageToChatMessage(message);
    }
    async delete(id) {
        const message = await this.prisma.message.delete({
            where: { id },
            select: this.getMessageSelect()
        });
        return this.mapDatabaseMessageToChatMessage(message);
    }
    async findByUserId(userId) {
        // Since userId doesn't exist in the current schema, return empty array
        return [];
    }
    async findBySessionId(sessionId) {
        const messages = await this.prisma.message.findMany({
            where: { chatId: sessionId },
            select: this.getMessageSelect(),
            orderBy: {
                createdAt: 'asc'
            }
        });
        return messages.map(message => this.mapDatabaseMessageToChatMessage(message));
    }
    async findByRole(role) {
        const messages = await this.prisma.message.findMany({
            where: { role: role }, // Cast to any to handle MessageRole enum
            select: this.getMessageSelect(),
            orderBy: {
                createdAt: 'desc'
            }
        });
        return messages.map(message => this.mapDatabaseMessageToChatMessage(message));
    }
    async getRecentMessages(userId, limit = 50) {
        // Since userId doesn't exist in the current schema, get recent messages regardless of user
        const messages = await this.prisma.message.findMany({
            select: this.getMessageSelect(),
            orderBy: {
                createdAt: 'desc'
            },
            take: limit
        });
        return messages.map(message => this.mapDatabaseMessageToChatMessage(message));
    }
    async searchMessages(userId, query) {
        // Since userId doesn't exist in the current schema, search all messages
        const messages = await this.prisma.message.findMany({
            where: {
                content: {
                    contains: query,
                    mode: 'insensitive'
                }
            },
            select: this.getMessageSelect(),
            orderBy: {
                createdAt: 'desc'
            }
        });
        return messages.map(message => this.mapDatabaseMessageToChatMessage(message));
    }
    async getMessageStats(userId) {
        // Since userId doesn't exist in the current schema, get stats for all messages
        const roleStats = await this.prisma.message.groupBy({
            by: ['role'],
            _count: {
                id: true
            }
        });
        const totalMessages = await this.prisma.message.count();
        const recentMessages = await this.prisma.message.count({
            where: {
                createdAt: {
                    gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) // Last 7 days
                }
            }
        });
        return {
            total: totalMessages,
            recent: recentMessages,
            byRole: roleStats.reduce((acc, { role, _count }) => {
                acc[role] = _count.id;
                return acc;
            }, {})
        };
    }
    async getConversationMessages(sessionId, limit = 100) {
        const messages = await this.prisma.message.findMany({
            where: { chatId: sessionId },
            orderBy: {
                createdAt: 'asc'
            },
            take: limit,
            select: this.getMessageSelect()
        });
        return messages.map(message => this.mapDatabaseMessageToChatMessage(message));
    }
    async deleteMessagesBySessionId(sessionId) {
        const result = await this.prisma.message.deleteMany({
            where: { chatId: sessionId }
        });
        return result.count;
    }
    async getMessagesByDateRange(from, to) {
        // Since userId doesn't exist in the current schema, get messages by date range for all users
        const messages = await this.prisma.message.findMany({
            where: {
                createdAt: {
                    gte: from,
                    lte: to
                }
            },
            select: this.getMessageSelect(),
            orderBy: {
                createdAt: 'asc'
            }
        });
        return messages.map(message => this.mapDatabaseMessageToChatMessage(message));
    }
};
ChatMessageRepository = __decorate([
    Injectable(),
    __metadata("design:paramtypes", [PrismaService])
], ChatMessageRepository);
export { ChatMessageRepository };
