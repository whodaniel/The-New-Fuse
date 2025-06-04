import { PrismaService } from '../prisma/prisma.service.js';
import { ChatMessage, Prisma } from '@prisma/client';
export declare enum MessageRole {
    USER = "user",
    ASSISTANT = "assistant"
}
export declare class ChatService {
    private readonly prisma;
    constructor(prisma: PrismaService);
    addMessage(userId: string, role: MessageRole, content: string): Promise<ChatMessage>;
    getMessages(userId: string, limit?: number): Promise<ChatMessage[]>;
    getMessagesBetweenAgents(fromAgentId: string, toAgentId: string, limit?: number): Promise<ChatMessage[]>;
    getChatHistory(userId: string, page?: number, pageSize?: number): Promise<{
        messages: ChatMessage[];
        total: number;
        hasMore: boolean;
        currentPage: number;
        pageSize: number;
    }>;
    clearChatHistory(userId: string): Promise<Prisma.BatchPayload>;
}
