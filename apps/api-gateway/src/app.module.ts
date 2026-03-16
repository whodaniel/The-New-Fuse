/**
 * API Gateway App Module
 * Consolidates all API modules into a unified gateway
 */

import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AuthModule } from './auth/auth.module';
import { AgentGatewayModule } from './gateway/agent-gateway.module';
import { AnalyticsGatewayModule } from './gateway/analytics-gateway.module';
import { ChatGatewayModule } from './gateway/chat-gateway.module';
import { IdeGatewayModule } from './gateway/ide-gateway.module';
import { MarketplaceGatewayModule } from './gateway/marketplace-gateway.module';
import { McpGatewayModule } from './gateway/mcp-gateway.module';
import { PokerGatewayModule } from './gateway/poker-gateway.module';
import { WebhookGatewayModule } from './gateway/webhook-gateway.module';
import { ProxyModule } from './proxy/proxy.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env.local', '.env'],
    }),

    // Authentication module
    AuthModule,

    // Service proxy module for routing requests
    ProxyModule,

    // Gateway modules for each service area
    AgentGatewayModule,
    AnalyticsGatewayModule,
    WebhookGatewayModule,
    ChatGatewayModule,
    McpGatewayModule,
    MarketplaceGatewayModule,
    IdeGatewayModule,
    PokerGatewayModule,
  ],
})
export class AppModule {}
