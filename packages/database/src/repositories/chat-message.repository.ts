import { Injectable } from '@nestjs/common';
import { ChatMessage } from '../types';
import { PrismaService } from '../prisma.service';

@Injectable()
export class ChatMessageRepository {
  constructor(private prisma: PrismaService) {}

  private mapDatabaseMessageToChatMessage(dbMessage: any): ChatMessage {
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

  private getMessageSelect() {
    return {
      id: true,
      content: true,
      role: true,
      chatId: true,
      createdAt: true
    };
  }

  async findById(id: string): Promise<ChatMessage | null> {
    const message = await this.prisma.message.findUnique({
      where: { id },
      select: this.getMessageSelect()
    });

    if (!message) return null;
    return this.mapDatabaseMessageToChatMessage(message);
  }

  async findMany(filters?: any): Promise<ChatMessage[]> {
    const messages = await this.prisma.message.findMany({
      where: filters,
      select: this.getMessageSelect(),
      orderBy: {
        createdAt: 'desc'
      }
    });

    return messages.map(message => this.mapDatabaseMessageToChatMessage(message));
  }

  async create(data: any): Promise<ChatMessage> {
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

  async update(id: string, data: any): Promise<ChatMessage> {
    const dbData: any = {};

    if (data.content !== undefined) dbData.content = data.content;
    if (data.role !== undefined) dbData.role = data.role;
    if (data.sessionId !== undefined) dbData.chatId = data.sessionId;

    const message = await this.prisma.message.update({
      where: { id },
      data: dbData,
      select: this.getMessageSelect()
    });

    return this.mapDatabaseMessageToChatMessage(message);
  }

  async delete(id: string): Promise<ChatMessage> {
    const message = await this.prisma.message.delete({
      where: { id },
      select: this.getMessageSelect()
    });

    return this.mapDatabaseMessageToChatMessage(message);
  }

  async findByUserId(userId: string): Promise<ChatMessage[]> {
    // Since userId doesn't exist in the current schema, return empty array
    return [];
  }

  async findBySessionId(sessionId: string): Promise<ChatMessage[]> {
    const messages = await this.prisma.message.findMany({
      where: { chatId: sessionId },
      select: this.getMessageSelect(),
      orderBy: {
        createdAt: 'asc'
      }
    });

    return messages.map(message => this.mapDatabaseMessageToChatMessage(message));
  }

  async findByRole(role: string): Promise<ChatMessage[]> {
    const messages = await this.prisma.message.findMany({
      where: { role: role as any }, // Cast to any to handle MessageRole enum
      select: this.getMessageSelect(),
      orderBy: {
        createdAt: 'desc'
      }
    });

    return messages.map(message => this.mapDatabaseMessageToChatMessage(message));
  }

  async getRecentMessages(userId: string, limit = 50): Promise<ChatMessage[]> {
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

  async searchMessages(userId: string, query: string): Promise<ChatMessage[]> {
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

  async getMessageStats(userId?: string): Promise<any> {
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
      byRole: roleStats.reduce((acc: Record<string, number>, { role, _count }: { role: any, _count: any }) => {
        acc[role] = _count.id;
        return acc;
      }, {} as Record<string, number>)
    };
  }

  async getConversationMessages(sessionId: string, limit = 100): Promise<ChatMessage[]> {
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

  async deleteMessagesBySessionId(sessionId: string): Promise<number> {
    const result = await this.prisma.message.deleteMany({
      where: { chatId: sessionId }
    });
    return result.count;
  }

  async getMessagesByDateRange(from: Date, to: Date): Promise<ChatMessage[]> {
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
}