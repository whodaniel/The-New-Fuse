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
exports.ChatService = exports.MessageRole = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
var MessageRole;
(function (MessageRole) {
    MessageRole["USER"] = "user";
    MessageRole["ASSISTANT"] = "assistant";
    // Add other roles if applicable
})(MessageRole || (exports.MessageRole = MessageRole = {}));
let ChatService = ChatService_1 = class ChatService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async addMessage(userId, role, content) {
        return this.prisma.chatMessage.create({
            data: {
                userId,
                role,
                content
            }
        });
    }
    async getMessages(userId, limit = 100) {
        return this.prisma.chatMessage.findMany({
            where: { userId },
            orderBy: { createdAt: 'desc' },
            take: limit
        });
    }
    async getMessagesBetweenAgents(fromAgentId, toAgentId, limit = 100) {
        // Note: The ChatMessage schema doesn't have fromAgentId/toAgentId fields
        // This is a placeholder implementation that needs schema updates
        return this.prisma.chatMessage.findMany({
            where: {
                // For now, just filter by user that might represent an agent
                userId: fromAgentId
            },
            orderBy: { createdAt: 'desc' },
            take: limit
        });
    }
    async getChatHistory(userId, page = 1, pageSize = 20) {
        const skip = (page - 1) * pageSize;
        const [messages, total] = await this.prisma.$transaction([
            this.prisma.chatMessage.findMany({
                where: { userId },
                orderBy: { createdAt: 'desc' },
                skip,
                take: pageSize,
            }),
            this.prisma.chatMessage.count({ where: { userId } }),
        ]);
        const hasMore = skip + messages.length < total;
        return { messages, total, hasMore, currentPage: page, pageSize };
    }
    async clearChatHistory(userId) {
        return this.prisma.chatMessage.deleteMany({
            where: { userId }
        });
    }
    // This method was in your chatService.d.ts, adding a placeholder here
    // async cleanupOldMessages(): Promise<Prisma.BatchPayload> {
    //   // Example: Delete messages older than 30 days
    //   const thirtyDaysAgo = new Date();
    //   thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    //   return this.prisma.message.deleteMany({
    //     where: { createdAt: { lt: thirtyDaysAgo } },
    //   });
    // }
    // Static methods for backward compatibility with existing route usage
    static async getChatHistory(userId, page = 1, pageSize = 20) {
        const prisma = new prisma_service_1.PrismaService();
        const service = new ChatService_1(prisma);
        return service.getChatHistory(userId, page, pageSize);
    }
    static async addMessage(userId, role, content) {
        const prisma = new prisma_service_1.PrismaService();
        const service = new ChatService_1(prisma);
        return service.addMessage(userId, role, content);
    }
    static async clearChatHistory(userId) {
        const prisma = new prisma_service_1.PrismaService();
        const service = new ChatService_1(prisma);
        return service.clearChatHistory(userId);
    }
};
exports.ChatService = ChatService;
exports.ChatService = ChatService = ChatService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], ChatService);
