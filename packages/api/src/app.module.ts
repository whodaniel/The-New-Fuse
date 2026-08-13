/**
 * Application Module
 * Organizes all application modules in a structured way
 */

import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { JwtModule } from '@nestjs/jwt';
import { LlmModule } from '@the-new-fuse/core';
import { DrizzleModule } from '@the-new-fuse/database';
import { AuthController } from './controllers/auth.controller.js';
import { HealthController } from './controllers/health.controller.js';
import { RequestLoggerMiddleware } from './middleware/request-logger.middleware.js';
import { AdminModule } from './modules/admin.module.js';
import { AgentModule } from './modules/agent.module.js';
import { AuthModule } from './modules/auth/auth.module.js';
import { ExportModule } from './modules/export.module.js';
import { UnifiedLedgerModule } from './modules/unified-ledger/unified-ledger.module.js';
import { WorkflowModule } from './modules/workflow.module.js';
import { AppConfigService } from './services/app-config.service.js';
import { DatabaseService } from './services/database.service.js';
import { EventService } from './services/event.service.js';
import { HealthService } from './services/health.service.js';
// import { DrizzleService } from './services/drizzle.service';

@Module({
  imports: [
    // Load environment configuration
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env.local', '.env'],
    }) as any,

    // Drizzle ORM database module
    DrizzleModule.forRootAsync(),

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
    }) as any,

    // JWT authentication
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        const secret = configService.get<string>('JWT_SECRET') || process.env.JWT_SECRET;
        if (!secret) {
          throw new Error('CRITICAL: JWT_SECRET must be configured');
        }
        return {
          secret,
          signOptions: {
            expiresIn: 604800, // 7 days in seconds
          },
        };
      },
    }),

    // Feature modules
    AgentModule,
    WorkflowModule,
    AdminModule,
    ExportModule,
    UnifiedLedgerModule,
    LlmModule,
    AuthModule,
  ],
  controllers: [HealthController, AuthController],
  providers: [DatabaseService, AppConfigService, EventService, HealthService],
  exports: [DatabaseService, AppConfigService, EventService, HealthService],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    // Apply request logger middleware to all routes
    consumer.apply(RequestLoggerMiddleware).forRoutes('*');
  }
}
