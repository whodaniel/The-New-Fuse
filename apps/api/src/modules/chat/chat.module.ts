import { Module } from '@nestjs/common';
// @ts-ignore
// @ts-ignore
import { DatabaseService } from '@the-new-fuse/database';
import { ChatController } from './chat.controller.js';
import { ChatService } from './chat.service.js';
import { AgentsModule } from '../../agents/agents.module.js';

@Module({
  imports: [AgentsModule],
  controllers: [ChatController],
  providers: [ChatService, DatabaseService],
  exports: [ChatService],
})
export class ChatModule {}
