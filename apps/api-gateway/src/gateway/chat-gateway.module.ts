/**
 * Chat Gateway Module
 * Consolidates chat and real-time communication endpoints
 */

import { Module } from '@nestjs/common';
import { ProxyModule } from '../proxy/proxy.module.js';
import { ChatGatewayController } from './chat-gateway.controller.js';

@Module({
  imports: [ProxyModule],
  controllers: [ChatGatewayController],
})
export class ChatGatewayModule {}