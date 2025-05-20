import { Module } from '@nestjs/common';
import { WebSocketService } from './WebSocketService.js';
import { ConfigModule } from '@nestjs/config';

@Module({
  imports: [ConfigModule],
  providers: [WebSocketService],
  exports: [WebSocketService],
})
export class WebSocketModule {}