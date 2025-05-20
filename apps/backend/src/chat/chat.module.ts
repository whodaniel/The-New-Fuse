import { Module } from '@nestjs/common';
import { ChatService } from './chat.service.js';
import { ChatController } from './chat.controller.js';
import { PrismaModule } from '../prisma/prisma.module.js';
import { RedisService } from '../services/redis.service.js';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Message } from '../entities/message.entity.js';

@Module({
  imports: [PrismaModule, TypeOrmModule.forFeature([Message])],
  controllers: [ChatController],
  providers: [ChatService, RedisService],
  exports: [ChatService]
})
export class ChatModule {}