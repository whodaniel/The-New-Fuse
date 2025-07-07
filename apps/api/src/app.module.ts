import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { ThrottlerModule } from '@nestjs/throttler';
import llmProviderConfig from './config/llm-provider.config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './modules/auth/auth.module';
import { AgentModule } from './modules/agent.module';
import { ChatModule } from './modules/chat/chat.module';
import { TaskModule } from './modules/task/task.module';
import { CacheService } from './cache/cache.service';
import { WebsocketGateway } from './websocket/websocket.gateway';
import { MonitoringService } from './services/monitoring.service';
import { MonitoringController } from './controllers/monitoring.controller';
import { EntityDiscoveryModule } from './modules/discovery/entity-discovery.module';
import { ClaudeDevAutomationModule } from './modules/ClaudeDevAutomationModule';
import { TNFMCPModule } from './mcp/TNFMCPModule';
import { A2ACoreModule, A2AController } from '@the-new-fuse/a2a-core';
import { DatabaseModule } from '@the-new-fuse/database';
import { WalletsModule } from './wallets/wallets.module';
import { TransactionsModule } from './transactions/transactions.module';
import { Web3authModule } from './web3auth/web3auth.module';
import { SmartAccountModule } from './smart-accounts/smart-account.module';
import { MonitoringModule } from './monitoring/monitoring.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [llmProviderConfig],
    }) as any,
    // Use Prisma instead of TypeORM
    DatabaseModule as any,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: (config: ConfigService) => ({
        secret: config.get<string>('JWT_SECRET'),
        signOptions: { expiresIn: '15m' },
      }),
      inject: [ConfigService],
    }) as any,
    ThrottlerModule.forRoot([{
      ttl: 60000, // 60 seconds in milliseconds
      limit: 10,
    }]) as any,
    AuthModule,
    AgentModule, // Add our new agent module
    ChatModule,
    TaskModule,
    EntityDiscoveryModule,
    ClaudeDevAutomationModule,
    TNFMCPModule, // Add The New Fuse MCP Module
    A2ACoreModule.forRoot(), // Add A2A Protocol Module
    WalletsModule, // Web3Auth Wallet Module
    TransactionsModule, // Blockchain Transaction Module
    Web3authModule, // Web3Auth Integration Module
    SmartAccountModule, // Smart Account (ERC-4337) Module
    MonitoringModule, // Wallet Platform Monitoring
  ],
  controllers: [AppController, MonitoringController, A2AController],
  providers: [AppService, CacheService, MonitoringService, WebsocketGateway],
})
export class AppModule {}
