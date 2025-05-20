import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ChatRoom } from '../entities/chat-room.entity.js';
import { Message } from '../entities/message.entity.js';
import { CreateMessageDto } from '../dtos/message.dto.js';
import { WebSocketGateway } from '../gateways/websocket.gateway.js';

@Injectable()
export class ChatService {
  constructor(
    @InjectRepository(ChatRoom)
    private readonly chatRoomRepository: Repository<ChatRoom>,
    @InjectRepository(Message)
    private readonly messageRepository: Repository<Message>,
    private readonly websocketGateway: WebSocketGateway,
  ) {}

  async getRooms(): Promise<ChatRoom[]> {
    return this.chatRoomRepository.find();
  }

  async getRoom(roomId: string): Promise<ChatRoom> {
    const room = await this.chatRoomRepository.findOne({
      where: { id: roomId },
      relations: ['messages'],
    });

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
