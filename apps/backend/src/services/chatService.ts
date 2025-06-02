import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
// Use ChatMessage from the Prisma schema
import { ChatMessage, Prisma } from '@prisma/client';

export enum MessageRole {
  USER = "user",
  ASSISTANT = "assistant",
  // Add other roles if applicable
}

@Injectable()
export class ChatService {
  constructor(private readonly prisma: PrismaService) {}
  async addMessage(userId: string, role: MessageRole, content: string): Promise<ChatMessage> {
    return this.prisma.chatMessage.create({
      data: {
        userId,
        role,
        content
      }
    });
  }
  
  async getMessages(userId: string, limit = 100): Promise<ChatMessage[]> {
    return this.prisma.chatMessage.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: limit
    });
  }
  
  async getMessagesBetweenAgents(fromAgentId: string, toAgentId: string, limit = 100): Promise<ChatMessage[]> {
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
  
  async getChatHistory(
    userId: string, 
    page = 1, 
    pageSize = 20
  ): Promise<{ messages: ChatMessage[]; total: number; hasMore: boolean; currentPage: number; pageSize: number }> {
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
  
  async clearChatHistory(userId: string): Promise<Prisma.BatchPayload> {
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
}
