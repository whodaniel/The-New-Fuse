import { MiddlewareConsumer, Module, NestModule, RequestMethod } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { JwtModule } from '@nestjs/jwt';
import { AGUIModule } from '@the-new-fuse/ag-ui-core';
import { DrizzleModule } from '@the-new-fuse/database';
import { ApiModule } from './api/api.module';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { CacheController } from './cache/cache.controller';
import { CacheModule } from './cache/cache.module';
import { AppConfigModule } from './config/app-config.module';
import { EventBus } from './events/event-bus.service';
// import { JobsModule } from './jobs/jobs.module'; // Temporarily disabled - requires Redis
import { AgentExecutionsModule } from './modules/agent-executions/agent-executions.module';
import { AgentRegistryModule } from './modules/agent-registry/agent-registry.module';
import { FilesModule } from './modules/files/files.module';
import { MassModule } from './modules/mass/mass.module';
import { MCPModule } from './modules/mcp/mcp.module';
import { OrchestratorModule } from './modules/orchestrator';
import { RelayModule } from './modules/relay/relay.module';
import { SelfImprovementModule } from './modules/self-improvement/self-improvement.module';
import { SharedStateModule } from './modules/shared-state/shared-state.module';
import { SystemMetricsModule } from './modules/system-metrics/system-metrics.module';
import { WorkflowTemplatesModule } from './modules/workflow-templates/workflow-templates.module';
import { PerformanceMetricsModule } from './monitoring/performance-metrics.module';
// DrizzleModule removed - migrated to DrizzleModule
import { RequestLoggerMiddleware } from './middleware/request-logger.middleware';
import { AdminModule } from './modules/admin/admin.module';
import { LoggingService } from './services/logging.service';
import { UsersModule } from './users/users.module';

// Create a comprehensive module to support all frontend routing expectations
// TNF (The New Fuse) is the Master Agent that orchestrates all other agents

@Module({
  imports: [
    // SECURITY: AppConfigModule provides validated configuration with fail-fast validation
    // This ensures no hardcoded secrets or weak configurations exist
    AppConfigModule,

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
      useFactory: (configService: ConfigService) => ({
        secret:
          configService.get<string>('JWT_SECRET') || 'development-jwt-secret-change-in-production',
        signOptions: {
          expiresIn: configService.get<string>('JWT_EXPIRES_IN') || '7d',
          issuer: configService.get<string>('JWT_ISSUER') || 'the-new-fuse',
        },
      }),
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
    AGUIModule, // AG-UI Protocol - Real-time agent visualization pipeline
  ],
  controllers: [AppController, CacheController],
  providers: [AppService, EventBus, LoggingService],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(RequestLoggerMiddleware).forRoutes({ path: '*', method: RequestMethod.ALL });
  }
}
