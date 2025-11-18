import { Injectable, Logger, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import {
  CreateChatRoomDto,
  UpdateChatRoomDto,
  AddParticipantDto,
  CreateMessageDto,
  UpdateMessageDto,
  ChatRoomResponseDto,
  MessageResponseDto,
  ParticipantResponseDto,
  SearchMessagesDto,
  ExportConversationDto,
  ChatRoomParticipantRole,
  MessageType,
} from './dto/chat-room.dto';

@Injectable()
export class ChatRoomsService {
  private readonly logger = new Logger(ChatRoomsService.name);

  constructor(private readonly prisma: PrismaService) {}

  // =================================================================
  // CHAT ROOM MANAGEMENT
  // =================================================================

  async createChatRoom(
    createDto: CreateChatRoomDto,
    ownerId: string,
  ): Promise<ChatRoomResponseDto> {
    try {
      const room = await this.prisma.$transaction(async (tx) => {
        // Create the chat room
        const chatRoom = await tx.chatRoom.create({
          data: {
            name: createDto.name,
            description: createDto.description,
            topic: createDto.topic,
            purpose: createDto.purpose,
            type: createDto.type,
            isPrivate: createDto.isPrivate ?? false,
            isEphemeral: createDto.isEphemeral ?? false,
            maxParticipants: createDto.maxParticipants ?? 50,
            settings: createDto.settings as any,
            metadata: createDto.metadata as any,
            ownerId,
            expiresAt: createDto.isEphemeral
              ? new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours default
              : null,
          },
        });

        // Add owner as admin participant
        await tx.chatRoomParticipant.create({
          data: {
            roomId: chatRoom.id,
            userId: ownerId,
            role: ChatRoomParticipantRole.ADMIN,
          },
        });

        // Add initial user participants
        if (createDto.participantUserIds?.length) {
          await Promise.all(
            createDto.participantUserIds.map((userId) =>
              tx.chatRoomParticipant.create({
                data: {
                  roomId: chatRoom.id,
                  userId,
                  role: ChatRoomParticipantRole.PARTICIPANT,
                },
              }).catch((error) => {
                this.logger.warn(`Failed to add user ${userId}: ${error.message}`);
              })
            )
          );
        }

        // Add initial agent participants
        if (createDto.participantAgentIds?.length) {
          await Promise.all(
            createDto.participantAgentIds.map((agentId) =>
              tx.chatRoomParticipant.create({
                data: {
                  roomId: chatRoom.id,
                  agentId,
                  role: ChatRoomParticipantRole.PARTICIPANT,
                },
              }).catch((error) => {
                this.logger.warn(`Failed to add agent ${agentId}: ${error.message}`);
              })
            )
          );
        }

        return chatRoom;
      });

      this.logger.log(`Created chat room: ${room.id} (${room.name})`);
      return this.formatChatRoomResponse(room);
    } catch (error) {
      this.logger.error(`Failed to create chat room: ${error.message}`);
      throw error;
    }
  }

  async getChatRoom(roomId: string, userId: string): Promise<ChatRoomResponseDto> {
    const room = await this.prisma.chatRoom.findUnique({
      where: { id: roomId, deletedAt: null },
      include: {
        _count: {
          select: {
            participants: true,
            messages: true,
          },
        },
      },
    });

    if (!room) {
      throw new NotFoundException(`Chat room ${roomId} not found`);
    }

    // Check if user has access
    await this.verifyAccess(roomId, userId);

    return this.formatChatRoomResponse(room);
  }

  async getUserChatRooms(userId: string): Promise<ChatRoomResponseDto[]> {
    const rooms = await this.prisma.chatRoom.findMany({
      where: {
        deletedAt: null,
        participants: {
          some: {
            userId,
            leftAt: null,
          },
        },
      },
      include: {
        _count: {
          select: {
            participants: true,
            messages: true,
          },
        },
      },
      orderBy: {
        lastMessageAt: 'desc',
      },
    });

    return rooms.map(this.formatChatRoomResponse);
  }

  async updateChatRoom(
    roomId: string,
    updateDto: UpdateChatRoomDto,
    userId: string,
  ): Promise<ChatRoomResponseDto> {
    await this.verifyAdminAccess(roomId, userId);

    const room = await this.prisma.chatRoom.update({
      where: { id: roomId },
      data: {
        ...updateDto,
        settings: updateDto.settings as any,
        metadata: updateDto.metadata as any,
      },
    });

    this.logger.log(`Updated chat room: ${roomId}`);
    return this.formatChatRoomResponse(room);
  }

  async deleteChatRoom(roomId: string, userId: string): Promise<void> {
    await this.verifyAdminAccess(roomId, userId);

    await this.prisma.chatRoom.update({
      where: { id: roomId },
      data: { deletedAt: new Date(), isActive: false },
    });

    this.logger.log(`Deleted chat room: ${roomId}`);
  }

  // =================================================================
  // PARTICIPANT MANAGEMENT
  // =================================================================

  async addParticipant(
    roomId: string,
    addDto: AddParticipantDto,
    requesterId: string,
  ): Promise<ParticipantResponseDto> {
    await this.verifyModeratorAccess(roomId, requesterId);

    const room = await this.prisma.chatRoom.findUnique({
      where: { id: roomId },
      include: {
        _count: {
          select: { participants: true },
        },
      },
    });

    if (!room) {
      throw new NotFoundException(`Chat room ${roomId} not found`);
    }

    if (room._count.participants >= room.maxParticipants) {
      throw new BadRequestException('Chat room is full');
    }

    const participant = await this.prisma.chatRoomParticipant.create({
      data: {
        roomId,
        userId: addDto.userId,
        agentId: addDto.agentId,
        role: addDto.role,
        permissions: addDto.permissions ?? [],
      },
    });

    this.logger.log(`Added participant to room ${roomId}: ${addDto.userId || addDto.agentId}`);
    return this.formatParticipantResponse(participant);
  }

  async removeParticipant(
    roomId: string,
    participantId: string,
    requesterId: string,
  ): Promise<void> {
    await this.verifyModeratorAccess(roomId, requesterId);

    await this.prisma.chatRoomParticipant.update({
      where: { id: participantId },
      data: { leftAt: new Date() },
    });

    this.logger.log(`Removed participant ${participantId} from room ${roomId}`);
  }

  async getParticipants(roomId: string, userId: string): Promise<ParticipantResponseDto[]> {
    await this.verifyAccess(roomId, userId);

    const participants = await this.prisma.chatRoomParticipant.findMany({
      where: {
        roomId,
        leftAt: null,
      },
      orderBy: {
        joinedAt: 'asc',
      },
    });

    return participants.map(this.formatParticipantResponse);
  }

  async updateParticipantRole(
    roomId: string,
    participantId: string,
    role: ChatRoomParticipantRole,
    requesterId: string,
  ): Promise<ParticipantResponseDto> {
    await this.verifyAdminAccess(roomId, requesterId);

    const participant = await this.prisma.chatRoomParticipant.update({
      where: { id: participantId },
      data: { role },
    });

    this.logger.log(`Updated participant role: ${participantId} -> ${role}`);
    return this.formatParticipantResponse(participant);
  }

  // =================================================================
  // MESSAGE MANAGEMENT
  // =================================================================

  async createMessage(
    roomId: string,
    createDto: CreateMessageDto,
    senderId: string,
    isAgent: boolean = false,
  ): Promise<MessageResponseDto> {
    await this.verifyAccess(roomId, senderId);

    const message = await this.prisma.$transaction(async (tx) => {
      // Create the message
      const msg = await tx.message.create({
        data: {
          content: createDto.content,
          type: createDto.type,
          role: isAgent ? 'AGENT' : 'USER',
          roomId,
          senderId: isAgent ? null : senderId,
          agentId: isAgent ? senderId : null,
          parentMessageId: createDto.parentMessageId,
          attachments: createDto.attachments ?? [],
          codeSnippet: createDto.codeSnippet as any,
          taskAssignment: createDto.taskAssignment as any,
          workflowTrigger: createDto.workflowTrigger as any,
          metadata: createDto.metadata as any,
        },
      });

      // Update room's last message timestamp
      await tx.chatRoom.update({
        where: { id: roomId },
        data: { lastMessageAt: new Date() },
      });

      return msg;
    });

    this.logger.log(`Created message in room ${roomId}: ${message.id}`);
    return this.formatMessageResponse(message);
  }

  async getMessages(
    roomId: string,
    userId: string,
    page: number = 1,
    limit: number = 50,
  ): Promise<{ messages: MessageResponseDto[]; total: number; page: number; totalPages: number }> {
    await this.verifyAccess(roomId, userId);

    const skip = (page - 1) * limit;

    const [messages, total] = await Promise.all([
      this.prisma.message.findMany({
        where: {
          roomId,
          isDeleted: false,
        },
        orderBy: {
          timestamp: 'desc',
        },
        skip,
        take: limit,
        include: {
          _count: {
            select: {
              readReceipts: true,
              messageReactions: true,
            },
          },
        },
      }),
      this.prisma.message.count({
        where: {
          roomId,
          isDeleted: false,
        },
      }),
    ]);

    return {
      messages: messages.map(this.formatMessageResponse),
      total,
      page,
      totalPages: Math.ceil(total / limit),
    };
  }

  async updateMessage(
    messageId: string,
    updateDto: UpdateMessageDto,
    userId: string,
  ): Promise<MessageResponseDto> {
    const message = await this.prisma.message.findUnique({
      where: { id: messageId },
    });

    if (!message) {
      throw new NotFoundException(`Message ${messageId} not found`);
    }

    if (message.senderId !== userId) {
      throw new ForbiddenException('You can only edit your own messages');
    }

    const updated = await this.prisma.message.update({
      where: { id: messageId },
      data: {
        content: updateDto.content,
        metadata: updateDto.metadata as any,
        isEdited: true,
      },
    });

    this.logger.log(`Updated message: ${messageId}`);
    return this.formatMessageResponse(updated);
  }

  async deleteMessage(messageId: string, userId: string): Promise<void> {
    const message = await this.prisma.message.findUnique({
      where: { id: messageId },
    });

    if (!message) {
      throw new NotFoundException(`Message ${messageId} not found`);
    }

    if (message.senderId !== userId) {
      throw new ForbiddenException('You can only delete your own messages');
    }

    await this.prisma.message.update({
      where: { id: messageId },
      data: { isDeleted: true, content: '[Deleted]' },
    });

    this.logger.log(`Deleted message: ${messageId}`);
  }

  async pinMessage(messageId: string, roomId: string, userId: string): Promise<MessageResponseDto> {
    await this.verifyModeratorAccess(roomId, userId);

    const message = await this.prisma.message.update({
      where: { id: messageId },
      data: { isPinned: true },
    });

    this.logger.log(`Pinned message: ${messageId}`);
    return this.formatMessageResponse(message);
  }

  // =================================================================
  // TYPING INDICATORS & READ RECEIPTS
  // =================================================================

  async setTypingIndicator(
    roomId: string,
    userId: string,
    isTyping: boolean,
  ): Promise<void> {
    await this.prisma.chatRoomParticipant.updateMany({
      where: {
        roomId,
        userId,
        leftAt: null,
      },
      data: {
        isTyping,
        lastTypingAt: isTyping ? new Date() : null,
      },
    });
  }

  async markAsRead(
    messageId: string,
    roomId: string,
    userId: string,
    isAgent: boolean = false,
  ): Promise<void> {
    await this.prisma.readReceipt.upsert({
      where: {
        messageId_userId: isAgent ? undefined : { messageId, userId },
        messageId_agentId: isAgent ? { messageId, agentId: userId } : undefined,
      },
      create: {
        messageId,
        roomId,
        userId: isAgent ? null : userId,
        agentId: isAgent ? userId : null,
      },
      update: {
        readAt: new Date(),
      },
    });

    // Update participant's last read timestamp
    await this.prisma.chatRoomParticipant.updateMany({
      where: {
        roomId,
        userId: isAgent ? null : userId,
        agentId: isAgent ? userId : null,
        leftAt: null,
      },
      data: {
        lastReadAt: new Date(),
      },
    });
  }

  // =================================================================
  // SEARCH & EXPORT
  // =================================================================

  async searchMessages(
    searchDto: SearchMessagesDto,
    userId: string,
  ): Promise<{ messages: MessageResponseDto[]; total: number }> {
    const page = searchDto.page ?? 1;
    const limit = searchDto.limit ?? 50;
    const skip = (page - 1) * limit;

    const where: any = {
      isDeleted: false,
      content: {
        contains: searchDto.query,
        mode: 'insensitive',
      },
    };

    if (searchDto.roomId) {
      where.roomId = searchDto.roomId;
      await this.verifyAccess(searchDto.roomId, userId);
    }

    if (searchDto.senderId) {
      where.senderId = searchDto.senderId;
    }

    if (searchDto.type) {
      where.type = searchDto.type;
    }

    if (searchDto.startDate || searchDto.endDate) {
      where.timestamp = {};
      if (searchDto.startDate) {
        where.timestamp.gte = new Date(searchDto.startDate);
      }
      if (searchDto.endDate) {
        where.timestamp.lte = new Date(searchDto.endDate);
      }
    }

    const [messages, total] = await Promise.all([
      this.prisma.message.findMany({
        where,
        orderBy: {
          timestamp: 'desc',
        },
        skip,
        take: limit,
      }),
      this.prisma.message.count({ where }),
    ]);

    return {
      messages: messages.map(this.formatMessageResponse),
      total,
    };
  }

  async exportConversation(
    exportDto: ExportConversationDto,
    userId: string,
  ): Promise<any> {
    await this.verifyAccess(exportDto.roomId, userId);

    const room = await this.prisma.chatRoom.findUnique({
      where: { id: exportDto.roomId },
      include: {
        messages: {
          where: { isDeleted: false },
          orderBy: { timestamp: 'asc' },
        },
        participants: true,
      },
    });

    if (!room) {
      throw new NotFoundException(`Chat room ${exportDto.roomId} not found`);
    }

    const format = exportDto.format ?? 'JSON';

    switch (format) {
      case 'JSON':
        return {
          room: {
            id: room.id,
            name: room.name,
            description: room.description,
            createdAt: room.createdAt,
          },
          messages: room.messages.map((msg) => ({
            id: msg.id,
            content: msg.content,
            type: msg.type,
            sender: msg.senderId || msg.agentId,
            timestamp: msg.timestamp,
            ...(exportDto.includeAttachments && { attachments: msg.attachments }),
            ...(exportDto.includeMetadata && { metadata: msg.metadata }),
          })),
          participants: room.participants.map((p) => ({
            id: p.userId || p.agentId,
            role: p.role,
            joinedAt: p.joinedAt,
          })),
        };

      case 'MARKDOWN':
        let markdown = `# ${room.name}\n\n`;
        markdown += room.description ? `${room.description}\n\n` : '';
        markdown += `## Messages\n\n`;
        room.messages.forEach((msg) => {
          markdown += `**${msg.senderName || msg.senderId || msg.agentId}** (${msg.timestamp.toISOString()})\n`;
          markdown += `${msg.content}\n\n`;
        });
        return markdown;

      default:
        throw new BadRequestException(`Unsupported export format: ${format}`);
    }
  }

  // =================================================================
  // AGENT-SPECIFIC FEATURES
  // =================================================================

  async summarizeConversation(roomId: string, userId: string): Promise<string> {
    await this.verifyAccess(roomId, userId);

    const messages = await this.prisma.message.findMany({
      where: {
        roomId,
        isDeleted: false,
      },
      orderBy: {
        timestamp: 'asc',
      },
      take: 100,
    });

    // In a real implementation, this would use an AI service to generate a summary
    const summary = `Conversation summary for room ${roomId}:\n` +
      `Total messages: ${messages.length}\n` +
      `Participants discussed: ${messages.map(m => m.content.substring(0, 50)).join(', ')}...`;

    // Store summary as system message
    await this.createMessage(
      roomId,
      {
        content: summary,
        type: MessageType.SUMMARY,
      },
      'system',
      true,
    );

    return summary;
  }

  async suggestNextActions(roomId: string, userId: string): Promise<string[]> {
    await this.verifyAccess(roomId, userId);

    // In a real implementation, this would use AI to analyze conversation and suggest actions
    const suggestions = [
      'Create a task for the discussed feature implementation',
      'Schedule a follow-up meeting',
      'Share code snippets for review',
      'Document the decisions made',
    ];

    return suggestions;
  }

  // =================================================================
  // HELPER METHODS
  // =================================================================

  private async verifyAccess(roomId: string, userId: string): Promise<void> {
    const participant = await this.prisma.chatRoomParticipant.findFirst({
      where: {
        roomId,
        OR: [{ userId }, { agentId: userId }],
        leftAt: null,
      },
    });

    if (!participant) {
      throw new ForbiddenException('You do not have access to this chat room');
    }
  }

  private async verifyModeratorAccess(roomId: string, userId: string): Promise<void> {
    const participant = await this.prisma.chatRoomParticipant.findFirst({
      where: {
        roomId,
        userId,
        leftAt: null,
        role: {
          in: [ChatRoomParticipantRole.ADMIN, ChatRoomParticipantRole.MODERATOR],
        },
      },
    });

    if (!participant) {
      throw new ForbiddenException('You do not have moderator access to this chat room');
    }
  }

  private async verifyAdminAccess(roomId: string, userId: string): Promise<void> {
    const participant = await this.prisma.chatRoomParticipant.findFirst({
      where: {
        roomId,
        userId,
        leftAt: null,
        role: ChatRoomParticipantRole.ADMIN,
      },
    });

    if (!participant) {
      throw new ForbiddenException('You do not have admin access to this chat room');
    }
  }

  private formatChatRoomResponse(room: any): ChatRoomResponseDto {
    return {
      id: room.id,
      name: room.name,
      description: room.description,
      topic: room.topic,
      purpose: room.purpose,
      type: room.type,
      isPrivate: room.isPrivate,
      isEphemeral: room.isEphemeral,
      ownerId: room.ownerId,
      settings: room.settings,
      metadata: room.metadata,
      createdAt: room.createdAt,
      updatedAt: room.updatedAt,
      lastMessageAt: room.lastMessageAt,
      isActive: room.isActive,
      expiresAt: room.expiresAt,
      maxParticipants: room.maxParticipants,
      participantCount: room._count?.participants,
      messageCount: room._count?.messages,
    };
  }

  private formatMessageResponse(message: any): MessageResponseDto {
    return {
      id: message.id,
      content: message.content,
      type: message.type,
      role: message.role,
      senderId: message.senderId,
      senderName: message.senderName,
      agentId: message.agentId,
      roomId: message.roomId,
      parentMessageId: message.parentMessageId,
      metadata: message.metadata,
      attachments: message.attachments,
      codeSnippet: message.codeSnippet,
      taskAssignment: message.taskAssignment,
      workflowTrigger: message.workflowTrigger,
      timestamp: message.timestamp,
      updatedAt: message.updatedAt,
      isEdited: message.isEdited,
      isDeleted: message.isDeleted,
      isPinned: message.isPinned,
      readCount: message._count?.readReceipts,
      reactionCount: message._count?.messageReactions,
    };
  }

  private formatParticipantResponse(participant: any): ParticipantResponseDto {
    return {
      id: participant.id,
      roomId: participant.roomId,
      userId: participant.userId,
      agentId: participant.agentId,
      role: participant.role,
      permissions: participant.permissions,
      isTyping: participant.isTyping,
      lastTypingAt: participant.lastTypingAt,
      lastReadAt: participant.lastReadAt,
      joinedAt: participant.joinedAt,
      leftAt: participant.leftAt,
      isMuted: participant.isMuted,
      notifications: participant.notifications,
    };
  }
}
