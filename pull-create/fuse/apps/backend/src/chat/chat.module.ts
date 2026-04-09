import { Module } from '@nestjs/common';
import { DatabaseModule } from '@the-new-fuse/database';
import { RedisService } from '../services/redis.service';
import { ChatController } from './chat.controller';
import { ChatService } from './chat.service';

@Module({
  imports: [DatabaseModule],
  controllers: [ChatController],
  providers: [ChatService, RedisService],
  exports: [ChatService],
})
export class ChatModule {}
