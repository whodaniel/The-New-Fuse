import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Message } from '../entities/message.entity.js';
import { User } from '../entities/user.entity.js';

@Injectable()
export class ChatService {
  constructor(
    @InjectRepository(Message)
    private readonly messageRepository: Repository<Message>,
  ) {}

  async getChatHistory(userId: string, page: number = 1) {
    const limit = 50;
    const skip = (page - 1) * limit;

    const messages = await this.messageRepository.find({
      where: { userId },
      order: { createdAt: 'DESC' },
      take: limit,
      skip,
    });

    return messages;
  }

  async addMessage(userId: string, role: string, content: string) {
    const message = this.messageRepository.create({
      userId,
      role,
      content,
      createdAt: new Date(),
    });

    await this.messageRepository.save(message);
    return message;
  }

  async clearChatHistory(userId: string) {
    await this.messageRepository.delete({ userId });
    return { success: true };
  }
}