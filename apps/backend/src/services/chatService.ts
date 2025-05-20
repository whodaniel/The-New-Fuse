import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
// Assuming 'Message' is your Prisma model for chat messages and Prisma types are available
import { Message, Prisma } from '@prisma/client'; // Adjust if your client path/exports are different

export enum MessageRole {
  USER = "user",
  ASSISTANT = "assistant",
  // Add other roles if applicable
}

@Injectable()
export class ChatService {
  constructor(private readonly prisma: PrismaService) {}
  async addMessage(userId: string, role: MessageRole, content: string): Promise<Message> {
    return this.prisma.message.create({
      data: {
        userId,
        role,
        content
      }
    });
  }
  
  async getMessages(userId: string, limit = 100): Promise<Message[]> {
    return this.prisma.message.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: limit
    });
  }
  
  async getMessagesBetweenAgents(fromAgentId: string, toAgentId: string, limit = 100): Promise<Message[]> {
    return this.prisma.message.findMany({
      where: {
        fromAgentId,
        toAgentId
      },
      orderBy: { createdAt: 'desc' },
      take: limit
    });
  }
  
  async getChatHistory(
    userId: string, 
    page = 1, 
    pageSize = 20
  ): Promise<{ messages: Message[]; total: number; hasMore: boolean; currentPage: number; pageSize: number }> {
    const skip = (page - 1) * pageSize;
    const [messages, total] = await this.prisma.$transaction([
      this.prisma.message.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        skip,
        take: pageSize,
      }),
      this.prisma.message.count({ where: { userId } }),
    ]);
    const hasMore = skip + messages.length < total;
    return { messages, total, hasMore, currentPage: page, pageSize };
  }
  
  async clearChatHistory(userId: string): Promise<Prisma.BatchPayload> {
    return this.prisma.message.deleteMany({
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
