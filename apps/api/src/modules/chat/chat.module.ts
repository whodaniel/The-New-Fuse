import { Module } from '@nestjs/common';
import { ChatController } from './chat.controller.js';
import { ChatService } from './chat.service.js';

@Module({
  controllers: [ChatController],
  providers: [ChatService],
  exports: [ChatService],
})
export class ChatModule {}
