/**
 * Application Module
 * Organizes all application modules in a structured way
 */

import { Module, NestModule, MiddlewareConsumer } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { AgentModule } from './modules/agent.module.js';
import { WorkflowModule } from './modules/workflow.module.js';
import { ExportModule } from './modules/export.module.js';
import { PrismaService } from './services/prisma.service.js';
import { AppConfigService } from './services/app-config.service.js';
import { EventService } from './services/event.service.js';
import { HealthService } from './services/health.service.js';
import { HealthController } from './controllers/health.controller.js';
import { RequestLoggerMiddleware } from './middleware/request-logger.middleware.js';

@Module({
  imports: [
    // Load environment configuration
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env.local', '.env']
    }),
    
    // Event emitter for application-wide events
    EventEmitterModule.forRoot({
      // Set this to true to use wildcards
      wildcard: true,
      // Delimiter for nested events
      delimiter: '.',
      // Maximum number of listeners per event
      maxListeners: 20,
      // Show event name in memory leak message when more than maximum amount of listeners is added
      verboseMemoryLeak: true,
      // Disable throwing uncaughtException if an error event is emitted and no listeners are attached
      ignoreErrors: false,
    }),
    
    // JWT authentication
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        secret: configService.get<string>('JWT_SECRET', 'dev-secret-key'),
        signOptions: {
          expiresIn: configService.get<string>('JWT_EXPIRES_IN', '7d')
        }
      })
    }),
    
    // Feature modules
    AgentModule,
    WorkflowModule,
    ExportModule,
  ],
  controllers: [
    HealthController
  ],
  providers: [
    PrismaService,
    AppConfigService,
    EventService,
    HealthService
  ],
  exports: [
    PrismaService,
    AppConfigService,
    EventService,
    HealthService
  ]
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    // Apply request logger middleware to all routes
    consumer.apply(RequestLoggerMiddleware).forRoutes('*');
  }
}
