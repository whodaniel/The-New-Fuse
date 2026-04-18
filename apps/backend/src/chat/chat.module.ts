import { Module } from '@nestjs/common';
import { DatabaseModule } from '@the-new-fuse/database';
import { RedisService } from '../services/redis.service.js';
import { ChatController } from './chat.controller.js';
import { ChatService } from './chat.service.js';

@Module({
  imports: [DatabaseModule],
  controllers: [ChatController],
  providers: [ChatService, RedisService],
  exports: [ChatService],
})
export class ChatModule {}
