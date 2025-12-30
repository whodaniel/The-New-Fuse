import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DrizzleModule } from '@the-new-fuse/database';
import { Message } from '../entities/message.entity';
import { RedisService } from '../services/redis.service';
import { ChatController } from './chat.controller';
import { ChatService } from './chat.service';

@Module({
  imports: [DrizzleModule.forRootAsync(), TypeOrmModule.forFeature([Message])],
  controllers: [ChatController],
  providers: [ChatService, RedisService],
  exports: [ChatService],
})
export class ChatModule {}
