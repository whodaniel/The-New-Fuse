import { Module } from '@nestjs/common';
import { ChatRoomsController } from './chat-rooms.controller';
import { ChatRoomsGateway } from './chat-rooms.gateway';
import { ChatRoomsService } from './chat-rooms.service';

@Module({
  controllers: [ChatRoomsController],
  providers: [ChatRoomsService, ChatRoomsGateway],
  exports: [ChatRoomsService, ChatRoomsGateway],
})
export class ChatRoomsModule {}
