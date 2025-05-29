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
import { AgencyHubModule } from './modules/agency-hub/agency-hub.module.js';

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
    EntityDiscoveryModule, // Add entity discovery module
    AgencyHubModule, // Add Agency Hub module
  ],
  controllers: [AppController, MonitoringController],
  providers: [AppService, CacheService, MonitoringService, WebsocketGateway],
})
export class AppModule {}
