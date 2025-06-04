import { Injectable } from '@nestjs/common';

@Injectable()
export class ChatService {
  async findAll() {
    return [];
  }

  async findOne(id: string) {
    return { id, messages: [] };
  }

  async create(createChatDto: any) {
    return { id: Date.now().toString(), ...createChatDto };
  }
}
