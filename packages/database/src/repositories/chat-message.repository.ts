import { Injectable } from '@nestjs/common';
import { Message } from '../../generated/prisma';
import { PrismaService } from '../prisma.service';
import { Prisma } from '../../generated/prisma';

@Injectable()
export class ChatMessageRepository {
  constructor(private prisma: PrismaService) {}

  private mapDatabaseMessageToChatMessage(dbMessage: Message): Message {
    return {
      id: dbMessage.id,
      content: dbMessage.content,
      role: dbMessage.role,
      senderId: dbMessage.senderId,
      senderName: dbMessage.senderName,
      agentId: dbMessage.agentId,
      chatId: dbMessage.chatId,
      roomId: dbMessage.roomId,
      parentMessageId: dbMessage.parentMessageId,
      metadata: dbMessage.metadata ?? null,
      attachments: dbMessage.attachments,
      timestamp: dbMessage.timestamp,
      updatedAt: dbMessage.updatedAt,
      isEdited: dbMessage.isEdited,
      isDeleted: dbMessage.isDeleted,
      isEphemeral: dbMessage.isEphemeral,
      expiresAt: dbMessage.expiresAt,
      reactions: dbMessage.reactions,
    };
  }

  private getMessageSelect() {
    return {
      id: true,
      content: true,
      role: true,
      senderId: true,
      senderName: true,
      agentId: true,
      chatId: true,
      roomId: true,
      parentMessageId: true,
      metadata: true,
      attachments: true,
      timestamp: true,
      updatedAt: true,
      isEdited: true,
      isDeleted: true,
      isEphemeral: true,
      expiresAt: true,
      reactions: true,
    };
  }

  async findById(id: string): Promise<Message | null> {
    const message = await this.prisma.message.findUnique({
      where: { id },
      select: this.getMessageSelect()
    });

    if (!message) return null;
    return this.mapDatabaseMessageToChatMessage(message);
  }

  async findMany(filters?: Prisma.MessageWhereInput): Promise<Message[]> {
    const messages = await this.prisma.message.findMany({
      where: filters,
      select: this.getMessageSelect(),
      orderBy: {
        timestamp: 'desc'
      }
    });

    return messages.map(message => this.mapDatabaseMessageToChatMessage(message));
  }

  async create(
    data: Prisma.MessageCreateInput | Prisma.MessageUncheckedCreateInput
  ): Promise<Message> {
    const message = await this.prisma.message.create({
      data,
      select: this.getMessageSelect()
    });
    return this.mapDatabaseMessageToChatMessage(message);
  }

  async update(
    id: string,
    data: Prisma.MessageUpdateInput | Prisma.MessageUncheckedUpdateInput
  ): Promise<Message> {
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

  async delete(id: string): Promise<Message> {
    const message = await this.prisma.message.delete({
      where: { id },
      select: this.getMessageSelect()
    });

    return this.mapDatabaseMessageToChatMessage(message);
  }

  async findBySenderId(senderId: string): Promise<Message[]> {
    const messages = await this.prisma.message.findMany({
      where: { senderId },
      select: this.getMessageSelect(),
      orderBy: {
        timestamp: 'desc'
      }
    });
    return messages.map(message => this.mapDatabaseMessageToChatMessage(message));
  }

  async findByChatId(chatId: string): Promise<Message[]> {
    const messages = await this.prisma.message.findMany({
      where: { chatId },
      select: this.getMessageSelect(),
      orderBy: {
        timestamp: 'asc'
      }
    });

    return messages.map(message => this.mapDatabaseMessageToChatMessage(message));
  }

  async findByRole(role: string): Promise<Message[]> {
    const messages = await this.prisma.message.findMany({
      where: { role: role as any }, // Cast to any to handle MessageRole enum
      select: this.getMessageSelect(),
      orderBy: {
        timestamp: 'desc'
      }
    });

    return messages.map(message => this.mapDatabaseMessageToChatMessage(message));
  }

  async getRecentMessages(senderId: string, limit = 50): Promise<Message[]> {
    const messages = await this.prisma.message.findMany({
      select: this.getMessageSelect(),
      where: { senderId },
      orderBy: {
        timestamp: 'desc'
      },
      take: limit
    });

    return messages.map(message => this.mapDatabaseMessageToChatMessage(message));
  }

  async searchMessages(senderId: string, query: string): Promise<Message[]> {
    const messages = await this.prisma.message.findMany({
      where: {
        senderId,
        content: {
          contains: query,
          mode: 'insensitive'
        }
      },
      select: this.getMessageSelect(),
      orderBy: {
        timestamp: 'desc'
      }
    });

    return messages.map(message => this.mapDatabaseMessageToChatMessage(message));
  }

  async getMessageStats(senderId?: string): Promise<{ total: number; recent: number; byRole: Record<string, number> }> {
    const whereClause = senderId ? { senderId } : {};

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
        timestamp: {
          gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) // Last 7 days
        }
      }
    });

    return {
      total: totalMessages,
      recent: recentMessages,
      byRole: roleStats.reduce((acc: Record<string, number>, { role, _count }: { role: string, _count: { id: number } }) => {
        acc[role] = _count.id;
        return acc;
      }, {} as Record<string, number>)
    };
  }

  async getConversationMessages(chatId: string, limit = 100): Promise<Message[]> {
    const messages = await this.prisma.message.findMany({
      where: { chatId },
      orderBy: {
        timestamp: 'asc'
      },
      take: limit,
      select: this.getMessageSelect()
    });

    return messages.map(message => this.mapDatabaseMessageToChatMessage(message));
  }

  async deleteMessagesByChatId(chatId: string): Promise<number> {
    const result = await this.prisma.message.deleteMany({
      where: { chatId }
    });
    return result.count;
  }

  async getMessagesByDateRange(from: Date, to: Date): Promise<Message[]> {
    const messages = await this.prisma.message.findMany({
      where: {
        timestamp: {
          gte: from,
          lte: to
        }
      },
      select: this.getMessageSelect(),
      orderBy: {
        timestamp: 'asc'
      }
    });

    return messages.map(message => this.mapDatabaseMessageToChatMessage(message));
  }
}