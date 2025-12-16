import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { JwtModule } from '@nestjs/jwt';
import { ApiModule } from './api/api.module';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { CacheController } from './cache/cache.controller';
import { CacheModule } from './cache/cache.module';
import { EventBus } from './events/event-bus.service';
import { JobsModule } from './jobs/jobs.module';
import { AgentExecutionsModule } from './modules/agent-executions/agent-executions.module';
import { FilesModule } from './modules/files/files.module';
import { MassModule } from './modules/mass/mass.module';
import { MCPModule } from './modules/mcp/mcp.module';
import { OrchestratorController, OrchestratorModule } from './modules/orchestrator';
import { RelayModule } from './modules/relay/relay.module';
import { SystemMetricsModule } from './modules/system-metrics/system-metrics.module';
import { WorkflowTemplatesModule } from './modules/workflow-templates/workflow-templates.module';
import { PrismaModule } from './prisma/prisma.module';
import { LoggingService } from './services/logging.service';
import { UsersModule } from './users/users.module';

// Create a comprehensive module to support all frontend routing expectations
// TNF (The New Fuse) is the Master Agent that orchestrates all other agents

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    // Event Emitter for inter-service communication
    EventEmitterModule.forRoot({
      wildcard: true,
      delimiter: '.',
      maxListeners: 20,
      verboseMemoryLeak: true,
    }),
    JwtModule.register({
      secret: process.env.JWT_SECRET || 'your-secret-key',
      signOptions: { expiresIn: '7d' },
    }),
    PrismaModule,
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
  ],
  controllers: [AppController, CacheController, OrchestratorController],
  providers: [AppService, EventBus, LoggingService],
})
export class AppModule {}
