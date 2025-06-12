import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtModule } from '@nestjs/jwt';
import { ThrottlerModule } from '@nestjs/throttler';
import llmProviderConfig from './config/llm-provider.config.js';
import { DataSourceOptions } from 'typeorm';
import { AppController } from './app.controller.js';
import { AppService } from './app.service.js';
import { AuthModule } from './modules/auth/auth.module.js';
import { ChatModule } from './modules/chat/chat.module.js';
import { TaskModule } from './modules/task/task.module.js';
import { CacheService } from './cache/cache.service.js';
import { WebsocketGateway } from './websocket/websocket.gateway.js';
import { MonitoringService } from './services/monitoring.service.js';
import { DataSource } from 'typeorm';
import { MonitoringController } from './controllers/monitoring.controller.js';
import { EntityDiscoveryModule } from './modules/discovery/entity-discovery.module.js';
import { ClaudeDevAutomationModule } from './modules/ClaudeDevAutomationModule.js';
import { TNFMCPModule } from './mcp/TNFMCPModule.js';
import { A2ACoreModule, A2AController } from '@the-new-fuse/a2a-core';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [llmProviderConfig],
    }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (config: ConfigService) => ({
        type: 'postgres',
        url: config.get<string>('DATABASE_URL'),
        entities: [__dirname + '/entities/*.entity{.ts,.js}'],
        synchronize: true,
      } as DataSourceOptions),
      inject: [ConfigService],
    }),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: (config: ConfigService) => ({
        secret: config.get<string>('JWT_SECRET'),
        signOptions: { expiresIn: '15m' },
      }),
      inject: [ConfigService],
    }),
    ThrottlerModule.forRoot([{
      ttl: 60000, // 60 seconds in milliseconds
      limit: 10,
    }]),
    AuthModule,
    ChatModule,
    TaskModule,
    EntityDiscoveryModule,
    ClaudeDevAutomationModule,
    TNFMCPModule, // Add The New Fuse MCP Module
    A2ACoreModule.forRoot(), // Add A2A Protocol Module
  ],
  controllers: [AppController, MonitoringController, A2AController],
  providers: [AppService, CacheService, MonitoringService, WebsocketGateway],
})
export class AppModule {}
