import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtModule } from '@nestjs/jwt';
import { ThrottlerModule } from '@nestjs/throttler';
import llmProviderConfig from './config/llm-provider.config';
import { DataSourceOptions } from 'typeorm';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './modules/auth/auth.module';
import { ChatModule } from './modules/chat/chat.module';
import { TaskModule } from './modules/task/task.module';
import { CacheService } from './cache/cache.service';
import { WebsocketGateway } from './websocket/websocket.gateway';
import { MonitoringService } from './services/monitoring.service';
import { DataSource } from 'typeorm';
import { MonitoringController } from './controllers/monitoring.controller';
import { EntityDiscoveryModule } from './modules/discovery/entity-discovery.module';
import { ClaudeDevAutomationModule } from './modules/ClaudeDevAutomationModule';
import { TNFMCPModule } from './mcp/TNFMCPModule';

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
    ThrottlerModule.forRoot({
      ttl: 60,
      limit: 10,
    }),
    AuthModule,
    ChatModule,
    TaskModule,
    EntityDiscoveryModule,
    ClaudeDevAutomationModule,
    TNFMCPModule, // Add The New Fuse MCP Module
  ],
  controllers: [AppController, MonitoringController],
  providers: [AppService, CacheService, MonitoringService, WebsocketGateway],
})
export class AppModule {}
