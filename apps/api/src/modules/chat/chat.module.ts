import { Module } from '@nestjs/common';
// @ts-ignore
// @ts-ignore
import { DatabaseService } from '@the-new-fuse/database';
import { ChatController } from './chat.controller';
import { ChatService } from './chat.service';
import { AgentsModule } from '../../agents/agents.module';

@Module({
  imports: [AgentsModule],
  controllers: [ChatController],
  providers: [ChatService, DatabaseService],
  exports: [ChatService],
})
export class ChatModule {}
