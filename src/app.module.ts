import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { DatabaseModule } from './database/database.module.js';
import { TaskModule } from './task/task.module.js';
import { TypeOrmModule } from "@nestjs/typeorm";
import { databaseConfig } from './config/database.config.js';
import { NotificationService } from './notifications/NotificationService.js';
import { MonitoringModule } from './monitoring/monitoring.module.js';
import { EventEmitterModule } from "@nestjs/event-emitter";
import { MCPModule } from './mcp/mcp.module.js';
import { MCPController } from './mcp/mcp.controller.tsx';
import { AgentDiscoveryModule } from './modules/agent-discovery.module.js';
import { AgentDiscoveryController } from './controllers/agent-discovery.controller.tsx';
import { MCPWorkflowModule } from './modules/MCPWorkflowModule.tsx';
import { MCPInitializationService } from './services/MCPInitializationService.js';
import { WorkflowMonitoringService } from './services/WorkflowMonitoringService.js';
import { WorkflowMCPIntegrationService } from './services/WorkflowMCPIntegrationService.js';
import { AnalyticsIntegrationService } from './services/AnalyticsIntegrationService.js';
import { SchemaValidationService } from './services/SchemaValidationService.js';
import { DatabaseService } from './drizzle/drizzle.service.js';
import { MetricsService } from './metrics/metrics.service.js';
import { RedisService } from './redis/redis.service.tsx';
import { Logger } from './common/logger.service.js';
import { MCPEventService } from './services/MCPEventService.js';
import { CopilotIntegrationModule } from './modules/CopilotIntegrationModule.js';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    EventEmitterModule.forRoot(),
    TypeOrmModule.forRoot(databaseConfig()),
    DatabaseModule,
    TaskModule,
    MonitoringModule,
    MCPModule,
    AgentDiscoveryModule,
    MCPWorkflowModule,
    CopilotIntegrationModule
  ],
  controllers: [MCPController, AgentDiscoveryController],
  providers: [
    NotificationService,
    MCPInitializationService,
    WorkflowMonitoringService,
    WorkflowMCPIntegrationService,
    AnalyticsIntegrationService,
    SchemaValidationService,
    DatabaseService,
    MetricsService,
    RedisService,
    Logger,
    MCPEventService
  ],
  exports: [MCPWorkflowModule]
})
export class AppModule {
  constructor(
    private readonly mcpInit: MCPInitializationService,
    private readonly mcpEvents: MCPEventService
  ) {}
}
