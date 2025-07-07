import { Module } from '@nestjs/common';
import { ChatService } from './chat.service';
import { ChatController } from './chat.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { RedisService } from '../services/redis.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Message } from '../entities/message.entity';

@Module({
  imports: [PrismaModule, TypeOrmModule.forFeature([Message])],
  controllers: [ChatController],
  providers: [ChatService, RedisService],
  exports: [ChatService]
})
export class ChatModule {}