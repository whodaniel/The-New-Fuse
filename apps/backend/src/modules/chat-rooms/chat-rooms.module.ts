import { Module } from '@nestjs/common';
import { ChatRoomsController } from './chat-rooms.controller';
import { ChatRoomsService } from './chat-rooms.service';
import { ChatRoomsGateway } from './chat-rooms.gateway';
import { PrismaService } from '../../prisma/prisma.service';

@Module({
  controllers: [ChatRoomsController],
  providers: [ChatRoomsService, ChatRoomsGateway, PrismaService],
  exports: [ChatRoomsService, ChatRoomsGateway],
})
export class ChatRoomsModule {}
