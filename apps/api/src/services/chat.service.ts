/**
 * ChatService - Migrated to Drizzle ORM
 * Handles multi-user chat room operations
 */
import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { DatabaseService } from '@the-new-fuse/database';

// Message role enum
enum MessageRole {
  USER = 'USER',
  ASSISTANT = 'ASSISTANT',
  SYSTEM = 'SYSTEM',
}

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

  constructor(private readonly db: DatabaseService) {}

  /**
   * Get all chat rooms with pagination
   */
  async getRooms(
    page: number = 1,
    limit: number = 50
  ): Promise<{ rooms: any[]; total: number; page: number; limit: number }> {
    const rooms = await this.db.chats.findActiveRooms();

    // Apply pagination manually
    const start = (page - 1) * limit;
    const paginatedRooms = rooms.slice(start, start + limit);

    return { rooms: paginatedRooms, total: rooms.length, page, limit };
  }

  /**
   * Get a specific chat room by ID
   */
  async getRoom(roomId: string, includeMessages: boolean = false): Promise<any> {
    const room = await this.db.chats.findRoomById(roomId);

    if (!room) {
      throw new NotFoundException('Chat room not found');
    }

    if (includeMessages) {
      const messages = await this.db.chats.findMessagesByRoomId(roomId, 50);
      return { ...room, messages };
    }

    return room;
  }

  /**
   * Get messages for a room with pagination
   */
  async getMessages(roomId: string, options: { limit: number; offset: number }): Promise<any[]> {
    // Verify room exists
    await this.getRoom(roomId);

    return this.db.chats.findMessagesByRoomId(roomId, options.limit, options.offset);
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
  ): Promise<any> {
    // Verify room exists
    const room = await this.getRoom(roomId);

    const message = await this.db.chats.createMessage({
      content,
      role: options?.role || MessageRole.USER,
      roomId: room.id,
      senderId,
      agentId: options?.agentId,
      metadata: options?.metadata as any,
    });

    // Update room's lastMessageAt
    await this.db.chats.updateRoomLastMessage(roomId);

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
  ): Promise<any> {
    return this.db.chats.createRoom({
      name,
      ownerId,
      description: options?.description,
      isPrivate: options?.isPrivate || false,
      settings: options?.settings as any,
      metadata: options?.metadata as any,
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
    // Get active rooms to count
    const activeRooms = await this.db.chats.findActiveRooms();

    return {
      totalRooms: activeRooms.length,
      totalMessages: 0, // Would need to implement a count method
      activeRooms: activeRooms.length,
      timestamp: new Date(),
    };
  }
}
