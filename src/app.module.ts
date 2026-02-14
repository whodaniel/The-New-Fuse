import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { EventEmitterModule } from "@nestjs/event-emitter";
import { TypeOrmModule } from "@nestjs/typeorm";
import { Logger } from './common/logger.service.js';
import { databaseConfig } from './config/database.config.js';
import { AgentDiscoveryController } from './controllers/agent-discovery.controller.tsx';
import { DatabaseModule } from './database/database.module.js';
import { MCPController } from './mcp/mcp.controller.tsx';
import { MCPModule } from './mcp/mcp.module.js';
import { MetricsService } from './metrics/metrics.service.js';
import { CopilotIntegrationModule } from './modules/CopilotIntegrationModule.js';
import { MCPWorkflowModule } from './modules/MCPWorkflowModule.tsx';
import { AgentDiscoveryModule } from './modules/agent-discovery.module.js';
import { MonitoringModule } from './monitoring/monitoring.module.js';
import { NotificationService } from './notifications/NotificationService.js';
import { RedisService } from './redis/redis.service.tsx';
import { AnalyticsIntegrationService } from './services/AnalyticsIntegrationService.js';
import { MCPEventService } from './services/MCPEventService.js';
import { MCPInitializationService } from './services/MCPInitializationService.js';
import { SchemaValidationService } from './services/SchemaValidationService.js';
import { WorkflowMCPIntegrationService } from './services/WorkflowMCPIntegrationService.js';
import { WorkflowMonitoringService } from './services/WorkflowMonitoringService.js';
import { TaskModule } from './task/task.module.js';

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
