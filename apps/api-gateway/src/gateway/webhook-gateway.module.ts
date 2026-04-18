/**
 * Webhook Gateway Module
 * Consolidates webhook and SSE endpoints
 */

import { Module } from '@nestjs/common';
import { ProxyModule } from '../proxy/proxy.module.js';
import { WebhookGatewayController } from './webhook-gateway.controller.js';

@Module({
  imports: [ProxyModule],
  controllers: [WebhookGatewayController],
})
export class WebhookGatewayModule {}