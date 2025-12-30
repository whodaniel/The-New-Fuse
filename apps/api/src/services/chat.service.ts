import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { ChatRoom, Message, MessageRole, PrismaService } from '@the-new-fuse/database';

/**
 * ChatRoomService handles multi-user chat room operations.
 *
 * This service works with ChatRoom model for collaborative conversations
 * between multiple users and/or agents.
 *
 * Note: For 1:1 agent conversations, see modules/chat/chat.service.ts
 */
@Injectable()
export class ChatService {
  private readonly logger = new Logger(ChatService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Get all chat rooms with pagination
   */
  async getRooms(
    page: number = 1,
    limit: number = 50
  ): Promise<{ rooms: ChatRoom[]; total: number; page: number; limit: number }> {
    const skip = (page - 1) * limit;

    const [rooms, total] = await Promise.all([
      this.prisma.chatRoom.findMany({
        where: {
          isActive: true,
          deletedAt: null,
        },
        select: {
          id: true,
          name: true,
          description: true,
          isPrivate: true,
          lastMessageAt: true,
          isActive: true,
          ownerId: true,
          settings: true,
          metadata: true,
          createdAt: true,
          updatedAt: true,
          deletedAt: true,
        },
        take: limit,
        skip,
        orderBy: { lastMessageAt: 'desc' },
      }),
      this.prisma.chatRoom.count({
        where: {
          isActive: true,
          deletedAt: null,
        },
      }),
    ]);

    return { rooms: rooms as ChatRoom[], total, page, limit };
  }

  /**
   * Get a specific chat room by ID
   */
  async getRoom(roomId: string, includeMessages: boolean = false): Promise<ChatRoom> {
    const room = await this.prisma.chatRoom.findUnique({
      where: { id: roomId },
      include: includeMessages
        ? {
            messages: {
              take: 50,
              orderBy: { timestamp: 'desc' },
              include: {
                sender: true,
                agent: true,
              },
            },
          }
        : undefined,
    });

    if (!room) {
      throw new NotFoundException('Chat room not found');
    }

    return room;
  }

  /**
   * Get messages for a room with pagination
   */
  async getMessages(
    roomId: string,
    options: { limit: number; offset: number }
  ): Promise<Message[]> {
    // Verify room exists
    await this.getRoom(roomId);

    return this.prisma.message.findMany({
      where: { roomId },
      take: options.limit,
      skip: options.offset,
      orderBy: { timestamp: 'desc' },
      include: {
        sender: true,
        agent: true,
      },
    });
  }

  /**
   * Send a message to a chat room
   */
  async sendMessage(
    roomId: string,
    content: string,
    senderId: string,
    options?: {
      role?: MessageRole;
      agentId?: string;
      metadata?: Record<string, unknown>;
    }
  ): Promise<Message> {
    // Verify room exists
    const room = await this.getRoom(roomId);

    const message = await this.prisma.message.create({
      data: {
        content,
        role: options?.role || MessageRole.USER,
        roomId: room.id,
        senderId,
        agentId: options?.agentId,
        metadata: options?.metadata as any,
      },
      include: {
        sender: true,
        agent: true,
      },
    });

    // Update room's lastMessageAt
    await this.prisma.chatRoom.update({
      where: { id: roomId },
      data: { lastMessageAt: new Date() },
    });

    // TODO: Emit through WebSocket gateway when integrated
    // this.websocketGateway.emitMessage(roomId, message);

    return message;
  }

  /**
   * Create a new chat room
   */
  async createRoom(
    ownerId: string,
    name: string,
    options?: {
      description?: string;
      isPrivate?: boolean;
      settings?: Record<string, unknown>;
      metadata?: Record<string, unknown>;
    }
  ): Promise<ChatRoom> {
    return this.prisma.chatRoom.create({
      data: {
        name,
        ownerId,
        description: options?.description,
        isPrivate: options?.isPrivate || false,
        settings: options?.settings as any,
        metadata: options?.metadata as any,
      },
    });
  }

  /**
   * Get chat analytics
   */
  async getAnalytics(): Promise<{
    totalRooms: number;
    totalMessages: number;
    activeRooms: number;
    timestamp: Date;
  }> {
    const [totalRooms, totalMessages, activeRooms] = await Promise.all([
      this.prisma.chatRoom.count(),
      this.prisma.message.count(),
      this.prisma.chatRoom.count({
        where: {
          isActive: true,
          deletedAt: null,
        },
      }),
    ]);

    return {
      totalRooms,
      totalMessages,
      activeRooms,
      timestamp: new Date(),
    };
  }
}
