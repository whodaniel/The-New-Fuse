import { Injectable } from '@nestjs/common';
import { DatabaseService } from '@the-new-fuse/database';

@Injectable()
export class ChatService {
  constructor(private readonly db: DatabaseService) {}

  async getChatHistory(userId: string, page: number = 1) {
    const limit = 50;
    // Drizzle repository usually handles pagination or returns all
    // Let's use findChatMessagesByUserId which exists in DrizzleChatRepository
    const messages = await this.db.chats.findChatMessagesByUserId(userId, limit);
    return messages;
  }

  async addMessage(userId: string, role: string, content: string) {
    const message = await this.db.chats.createChatMessage({
      userId,
      role: role as any,
      content,
    });

    return message;
  }

  async clearChatHistory(userId: string) {
    // Note: DrizzleChatRepository might need a deleteChatMessagesByUserId
    // For now we'll use the raw client if needed, or check if it exists
    // The current repository only has deleteExpiredChatMessages

    // Fallback to manual delete if not in repo
    await (this.db as any).client
      .delete(require('@the-new-fuse/database').drizzleSchema.chatMessages)
      .where(
        require('drizzle-orm').eq(
          require('@the-new-fuse/database').drizzleSchema.chatMessages.userId,
          userId
        )
      );

    return { success: true };
  }
}
