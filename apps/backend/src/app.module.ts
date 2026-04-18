import {
  DynamicModule,
  ForwardReference,
  MiddlewareConsumer,
  Module,
  NestModule,
  RequestMethod,
  Type,
} from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { JwtModule } from '@nestjs/jwt';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { DrizzleModule } from '@the-new-fuse/database';
import type { StringValue } from 'ms';
import { ApiModule } from './api/api.module.js';
import { AppController } from './app.controller.js';
import { AppService } from './app.service.js';
import { AuthModule } from './auth/auth.module.js';
import { CacheController } from './cache/cache.controller.js';
import { CacheModule } from './cache/cache.module.js';
import { AppConfigModule } from './config/app-config.module.js';
import { EventBus } from './events/event-bus.service.js';
// import { JobsModule } from './jobs/jobs.module.js'; // Temporarily disabled - requires Redis
import { AgentExecutionsModule } from './modules/agent-executions/agent-executions.module.js';
import { AgentRegistryModule } from './modules/agent-registry/agent-registry.module.js';
import { FilesModule } from './modules/files/files.module.js';
import { MassModule } from './modules/mass/mass.module.js';
import { MCPModule } from './modules/mcp/mcp.module.js';
import { OrchestratorModule } from './modules/orchestrator/index.js';
import { UserBotsModule } from './modules/poker-bots/user-bots.module.js';
import { RelayModule } from './modules/relay/relay.module.js';
import { SelfImprovementModule } from './modules/self-improvement/self-improvement.module.js';
import { SharedStateModule } from './modules/shared-state/shared-state.module.js';
import { SystemMetricsModule } from './modules/system-metrics/system-metrics.module.js';
import { WorkflowTemplatesModule } from './modules/workflow-templates/workflow-templates.module.js';
import { PerformanceMetricsModule } from './monitoring/performance-metrics.module.js';
// DrizzleModule removed - migrated to DrizzleModule
import { RequestLoggerMiddleware } from './middleware/request-logger.middleware.js';
import { AdminModule } from './modules/admin/admin.module.js';
import { LoggingService } from './services/logging.service.js';
import { UsersModule } from './users/users.module.js';

type NestImport = Type<unknown> | DynamicModule | Promise<DynamicModule> | ForwardReference;

const optionalAGUIImports: NestImport[] = (() => {
  try {
    // AG-UI is an optional visualization layer. If Railway's runtime image prunes
    // the built workspace package, the backend should still boot without it.
    const agui = require('@the-new-fuse/ag-ui-core') as { AGUIModule?: NestImport };
    return agui.AGUIModule ? [agui.AGUIModule] : [];
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.warn(`[AppModule] AG-UI disabled: ${message}`);
    return [];
  }
})();

// Create a comprehensive module to support all frontend routing expectations
// TNF (The New Fuse) is the Master Agent that orchestrates all other agents

@Module({
  imports: [
    // SECURITY: AppConfigModule provides validated configuration with fail-fast validation
    // This ensures no hardcoded secrets or weak configurations exist
    AppConfigModule,

    // Rate Limiting - Protect against brute force and DDoS
    ThrottlerModule.forRoot([
      {
        name: 'short',
        ttl: 1000, // 1 second
        limit: 3, // 3 requests per second
      },
      {
        name: 'medium',
        ttl: 10000, // 10 seconds
        limit: 20, // 20 requests per 10 seconds
      },
      {
        name: 'long',
        ttl: 60000, // 1 minute
        limit: 100, // 100 requests per minute
      },
    ]),

    // Event Emitter for inter-service communication
    EventEmitterModule.forRoot({
      wildcard: true,
      delimiter: '.',
      maxListeners: 20,
      verboseMemoryLeak: true,
    }),

    // JWT Module with secure configuration
    // NOTE: Using ConfigService directly because JwtModule.registerAsync factory
    // runs before AppConfigService.onModuleInit() completes validation
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        const secret = configService.get<string>('JWT_SECRET');
        if (!secret) {
          throw new Error('JWT_SECRET must be defined in environment variables');
        }
        return {
          secret,
          signOptions: {
            expiresIn: (configService.get<string>('JWT_EXPIRES_IN') || '7d') as StringValue,
            issuer: configService.get<string>('JWT_ISSUER') || 'the-new-fuse',
          },
        };
      },
    }),
    // Database module - Drizzle ORM
    DrizzleModule.forRootAsync(),
    AuthModule,
    AdminModule,
    UsersModule,
    ApiModule,
    MassModule,
    // JobsModule, // Temporarily disabled - requires Redis/Bull which causes dependency injection errors on Railway
    AgentExecutionsModule,
    AgentRegistryModule,
    WorkflowTemplatesModule,
    FilesModule,
    SystemMetricsModule,
    PerformanceMetricsModule,
    CacheModule,
    MCPModule, // MCP Integration for agent communication
    OrchestratorModule, // TNF Orchestration - Heartbeat, Coordination, Handoffs
    RelayModule, // Relay Core - Agent-to-Agent communication relay
    SelfImprovementModule, // Autonomous improvement loop
    SharedStateModule, // Cloudflare SharedState Integration
    ...optionalAGUIImports, // AG-UI Protocol - optional real-time agent visualization pipeline
    UserBotsModule,
  ],
  controllers: [AppController, CacheController],
  providers: [
    AppService,
    EventBus,
    LoggingService,
    // Global rate limiting guard
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(RequestLoggerMiddleware).forRoutes({ path: '*', method: RequestMethod.ALL });
  }
}
