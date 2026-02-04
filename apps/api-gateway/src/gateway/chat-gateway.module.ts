/**
 * Chat Gateway Module
 * Consolidates chat and real-time communication endpoints
 */

import { Module } from '@nestjs/common';
import { ProxyModule } from '../proxy/proxy.module';
import { ChatGatewayController } from './chat-gateway.controller';

@Module({
  imports: [ProxyModule],
  controllers: [ChatGatewayController],
})
export class ChatGatewayModule {}
