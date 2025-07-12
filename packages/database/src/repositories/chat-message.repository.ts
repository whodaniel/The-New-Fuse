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
      userId: dbMessage.userId,
      sessionId: dbMessage.sessionId,
      metadata: dbMessage.metadata ?? null,
      createdAt: dbMessage.createdAt,
      updatedAt: dbMessage.updatedAt,
    };
  }

  private getMessageSelect() {
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
        createdAt: 'desc'
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

  async findByUserId(userId: string): Promise<Message[]> {
    const messages = await this.prisma.message.findMany({
      where: { userId },
      select: this.getMessageSelect(),
      orderBy: {
        createdAt: 'desc'
      }
    });
    return messages.map(message => this.mapDatabaseMessageToChatMessage(message));
  }

  async findBySessionId(sessionId: string): Promise<Message[]> {
    const messages = await this.prisma.message.findMany({
      where: { sessionId },
      select: this.getMessageSelect(),
      orderBy: {
        createdAt: 'asc'
      }
    });

    return messages.map(message => this.mapDatabaseMessageToChatMessage(message));
  }

  async findByRole(role: string): Promise<Message[]> {
    const messages = await this.prisma.message.findMany({
      where: { role: role as any }, // Cast to any to handle MessageRole enum
      select: this.getMessageSelect(),
      orderBy: {
        createdAt: 'desc'
      }
    });

    return messages.map(message => this.mapDatabaseMessageToChatMessage(message));
  }

  async getRecentMessages(userId: string, limit = 50): Promise<Message[]> {
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

  async searchMessages(userId: string, query: string): Promise<Message[]> {
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

  async getMessageStats(userId?: string): Promise<{ total: number; recent: number; byRole: Record<string, number> }> {
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
      byRole: roleStats.reduce((acc: Record<string, number>, { role, _count }: { role: string, _count: { id: number } }) => {
        acc[role] = _count.id;
        return acc;
      }, {} as Record<string, number>)
    };
  }

  async getConversationMessages(sessionId: string, limit = 100): Promise<Message[]> {
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

  async deleteMessagesBySessionId(sessionId: string): Promise<number> {
    const result = await this.prisma.message.deleteMany({
      where: { sessionId }
    });
    return result.count;
  }

  async getMessagesByDateRange(from: Date, to: Date): Promise<Message[]> {
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