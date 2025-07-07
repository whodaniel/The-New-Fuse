import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { WebSocketService } from './WebSocketService';
import { WebSocketManager } from './WebSocketManager';

@Module({
  imports: [ConfigModule],
  providers: [
    WebSocketService,
    WebSocketManager
  ],
  exports: [
    WebSocketService,
    WebSocketManager
  ]
})
export class WebSocketModule {}