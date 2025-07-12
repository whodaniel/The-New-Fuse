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
            role: dbMessage.role,
            userId: dbMessage.userId,
            sessionId: dbMessage.sessionId,
            metadata: dbMessage.metadata ?? null,
            createdAt: dbMessage.createdAt,
            updatedAt: dbMessage.updatedAt,
        };
    }
    getMessageSelect() {
        return {
            id: true,
            content: true,
            role: true,
            userId: true,
            sessionId: true,
            metadata: true,
            createdAt: true,
            updatedAt: true,
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
        const message = await this.prisma.message.create({
            data,
            select: this.getMessageSelect()
        });
        return this.mapDatabaseMessageToChatMessage(message);
    }
    async update(id, data) {
        const message = await this.prisma.message.update({
            where: { id },
            data: {
                ...data,
                updatedAt: new Date()
            },
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
        const messages = await this.prisma.message.findMany({
            where: { userId },
            select: this.getMessageSelect(),
            orderBy: {
                createdAt: 'desc'
            }
        });
        return messages.map(message => this.mapDatabaseMessageToChatMessage(message));
    }
    async findBySessionId(sessionId) {
        const messages = await this.prisma.message.findMany({
            where: { sessionId },
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
        const messages = await this.prisma.message.findMany({
            select: this.getMessageSelect(),
            where: { userId },
            orderBy: {
                createdAt: 'desc'
            },
            take: limit
        });
        return messages.map(message => this.mapDatabaseMessageToChatMessage(message));
    }
    async searchMessages(userId, query) {
        const messages = await this.prisma.message.findMany({
            where: {
                userId,
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
        const whereClause = userId ? { userId } : {};
        const roleStats = await this.prisma.message.groupBy({
            by: ['role'],
            where: whereClause,
            _count: {
                id: true
            }
        });
        const totalMessages = await this.prisma.message.count({ where: whereClause });
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
            where: { sessionId },
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
            where: { sessionId }
        });
        return result.count;
    }
    async getMessagesByDateRange(from, to) {
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
