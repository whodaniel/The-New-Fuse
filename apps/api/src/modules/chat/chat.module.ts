import { Module } from '@nestjs/common';
import { DatabaseService } from '@the-new-fuse/database';
import { AgentsModule } from '../../agents/agents.module';
import { ChatController } from './chat.controller';
import { ChatService } from './chat.service';

@Module({
  imports: [AgentsModule],
  controllers: [ChatController],
  providers: [ChatService, DatabaseService],
  exports: [ChatService],
})
export class ChatModule {}
