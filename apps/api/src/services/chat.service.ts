import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ChatRoom } from '../entities/chat-room.entity';
import { Message } from '../entities/message.entity';
import { CreateMessageDto } from '../dtos/message.dto';
import { WebSocketGateway } from '../gateways/websocket.gateway';

@Injectable()
export class ChatService {
  constructor(
    @InjectRepository(ChatRoom)
    private readonly chatRoomRepository: Repository<ChatRoom>,
    @InjectRepository(Message)
    private readonly messageRepository: Repository<Message>,
    private readonly websocketGateway: WebSocketGateway,
  ) {}

  async getRooms(
    page: number = 1,
    limit: number = 50
  ): Promise<{ rooms: ChatRoom[]; total: number; page: number; limit: number }> {
    const skip = (page - 1) * limit;

    const [rooms, total] = await Promise.all([
      this.chatRoomRepository.find({
        select: ['id', 'name', 'description', 'type', 'isPrivate', 'lastMessageAt', 'isActive'],
        take: limit,
        skip,
        order: { lastMessageAt: 'DESC' },
      }),
      this.chatRoomRepository.count(),
    ]);

    return { rooms, total, page, limit };
  }

  async getRoom(roomId: string, includeMessages: boolean = false): Promise<ChatRoom> {
    const options: any = {
      where: { id: roomId },
    };

    // Only load messages if explicitly requested
    if (includeMessages) {
      options.relations = ['messages'];
      options.order = { messages: { timestamp: 'DESC' } };
      options.take = { messages: 50 }; // Limit to recent 50 messages
    }

    const room = await this.chatRoomRepository.findOne(options);

    if (!room) {
      throw new NotFoundException('Chat room not found');
    }

    return room;
  }

  async getMessages(
    roomId: string,
    options: { limit: number; offset: number },
  ): Promise<Message[]> {
    const room = await this.getRoom(roomId);
    return this.messageRepository.find({
      where: { room: { id: room.id } },
      take: options.limit,
      skip: options.offset,
      order: { timestamp: 'DESC' },
    });
  }

  async sendMessage(
    roomId: string,
    createMessageDto: CreateMessageDto,
  ): Promise<Message> {
    const room = await this.getRoom(roomId);
    const message = this.messageRepository.create({
      ...createMessageDto,
      room,
    });

    await this.messageRepository.save(message);

    // Notify connected clients through WebSocket
    this.websocketGateway.emitMessage(roomId, message);

    return message;
  }

  async getAnalytics(): Promise<any> {
    const [totalRooms, totalMessages] = await Promise.all([
      this.chatRoomRepository.count(),
      this.messageRepository.count(),
    ]);

    return {
      totalRooms,
      totalMessages,
      timestamp: new Date(),
    };
  }
}
