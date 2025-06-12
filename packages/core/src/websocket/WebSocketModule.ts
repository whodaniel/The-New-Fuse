import { Module } from '@nestjs/common';
import { WebSocketService } from './WebSocketService.tsx';
import { ConfigModule } from '@nestjs/config';

@Module({
  imports: [ConfigModule],
  providers: [WebSocketService],
  exports: [WebSocketService],
})
export class WebSocketModule {}