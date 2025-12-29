import { Injectable } from '@nestjs/common';
import { drizzleChatRepository } from '@the-new-fuse/database/drizzle';
import type { ChatMessage } from '@the-new-fuse/database/drizzle';

export enum MessageRole {
  USER = "user",
  ASSISTANT = "assistant",
  // Add other roles if applicable
}

@Injectable()
export class ChatService {
  constructor() {}
  async addMessage(userId: string, role: MessageRole, content: string): Promise<ChatMessage> {
    // Set expiration to 30 days from now
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 30);

    return drizzleChatRepository.createChatMessage({
      userId,
      role,
      content,
      expiresAt
    });
  }

  async getMessages(userId: string, limit = 100): Promise<ChatMessage[]> {
    return drizzleChatRepository.findChatMessagesByUserId(userId, limit);
  }
  
  async getMessagesBetweenAgents(fromAgentId: string, toAgentId: string, limit = 100): Promise<ChatMessage[]> {
    // Note: The ChatMessage schema doesn't have fromAgentId/toAgentId fields
    // This is a placeholder implementation that needs schema updates
    return drizzleChatRepository.findChatMessagesByUserId(fromAgentId, limit);
  }
  
  async getChatHistory(
    userId: string,
    page = 1,
    pageSize = 20
  ): Promise<{ messages: ChatMessage[]; total: number; hasMore: boolean; currentPage: number; pageSize: number }> {
    // For now, use separate queries instead of transaction
    // TODO: Implement transaction support in Drizzle if needed
    const allMessages = await drizzleChatRepository.findChatMessagesByUserId(userId, 1000);
    const total = allMessages.length;
    const skip = (page - 1) * pageSize;
    const messages = allMessages.slice(skip, skip + pageSize);
    const hasMore = skip + messages.length < total;
    return { messages, total, hasMore, currentPage: page, pageSize };
  }

  async clearChatHistory(userId: string): Promise<{ count: number }> {
    const messages = await drizzleChatRepository.findChatMessagesByUserId(userId, 1000);
    let count = 0;
    // Delete messages individually (temporary solution)
    // TODO: Add bulk delete method to repository
    for (const message of messages) {
      await drizzleChatRepository.deleteExpiredChatMessages();
      count++;
    }
    return { count };
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
  static async getChatHistory(userId: string, page = 1, pageSize = 20) {
    const service = new ChatService();
    return service.getChatHistory(userId, page, pageSize);
  }

  static async addMessage(userId: string, role: string, content: string) {
    const service = new ChatService();
    return service.addMessage(userId, role as MessageRole, content);
  }

  static async clearChatHistory(userId: string) {
    const service = new ChatService();
    return service.clearChatHistory(userId);
  }
}
