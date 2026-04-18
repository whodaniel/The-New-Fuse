/**
 * API Gateway App Module
 * Consolidates all API modules into a unified gateway
 */

import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AuthModule } from './auth/auth.module.js';
import { AgentGatewayModule } from './gateway/agent-gateway.module.js';
import { AnalyticsGatewayModule } from './gateway/analytics-gateway.module.js';
import { ChatGatewayModule } from './gateway/chat-gateway.module.js';
import { IdeGatewayModule } from './gateway/ide-gateway.module.js';
import { MarketplaceGatewayModule } from './gateway/marketplace-gateway.module.js';
import { McpGatewayModule } from './gateway/mcp-gateway.module.js';
import { PokerGatewayModule } from './gateway/poker-gateway.module.js';
import { SgpGatewayModule } from './gateway/sgp-gateway.module.js';
import { SystemGatewayModule } from './gateway/system-gateway.module.js';
import { TerminalsGatewayModule } from './gateway/terminals-gateway.module.js';
import { WebhookGatewayModule } from './gateway/webhook-gateway.module.js';
import { WorkspaceGatewayModule } from './gateway/workspace-gateway.module.js';
import { ProxyModule } from './proxy/proxy.module.js';

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
    SgpGatewayModule,
    SystemGatewayModule,
    TerminalsGatewayModule,
  ],
})
export class AppModule {}
