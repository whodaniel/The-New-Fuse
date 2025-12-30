import { Module } from '@nestjs/common';
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
import { AppConfigService } from './config/app-config.service';
import { EventBus } from './events/event-bus.service';
import { JobsModule } from './jobs/jobs.module';
import { AgentExecutionsModule } from './modules/agent-executions/agent-executions.module';
import { FilesModule } from './modules/files/files.module';
import { MassModule } from './modules/mass/mass.module';
import { MCPModule } from './modules/mcp/mcp.module';
import { OrchestratorModule } from './modules/orchestrator';
import { RelayModule } from './modules/relay/relay.module';
import { SelfImprovementModule } from './modules/self-improvement/self-improvement.module';
import { SystemMetricsModule } from './modules/system-metrics/system-metrics.module';
import { WorkflowTemplatesModule } from './modules/workflow-templates/workflow-templates.module';
// PrismaModule removed - migrated to DrizzleModule
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

    // JWT Module with secure configuration from AppConfigService
    JwtModule.registerAsync({
      imports: [AppConfigModule],
      inject: [AppConfigService],
      useFactory: (appConfig: AppConfigService) => ({
        secret: appConfig.jwtSecret,
        signOptions: {
          expiresIn: appConfig.jwtExpiresIn,
          issuer: appConfig.jwtIssuer,
        },
      }),
    }),
    // Database module - Drizzle ORM
    DrizzleModule.forRootAsync(),
    AuthModule,
    UsersModule,
    ApiModule,
    MassModule,
    JobsModule,
    AgentExecutionsModule,
    WorkflowTemplatesModule,
    FilesModule,
    SystemMetricsModule,
    CacheModule,
    MCPModule, // MCP Integration for agent communication
    OrchestratorModule, // TNF Orchestration - Heartbeat, Coordination, Handoffs
    RelayModule, // Relay Core - Agent-to-Agent communication relay
    SelfImprovementModule, // Autonomous improvement loop
    AGUIModule, // AG-UI Protocol - Real-time agent visualization pipeline
  ],
  controllers: [AppController, CacheController],
  providers: [AppService, EventBus, LoggingService],
})
export class AppModule {}
