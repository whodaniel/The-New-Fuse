var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
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
import { PrismaService } from './prisma/prisma.service.js';
import { MetricsService } from './metrics/metrics.service.js';
import { RedisService } from './redis/redis.service.tsx';
import { Logger } from './common/logger.service.js';
import { MCPEventService } from './services/MCPEventService.js';
import { CopilotIntegrationModule } from './modules/CopilotIntegrationModule.js';
let AppModule = class AppModule {
    mcpInit;
    mcpEvents;
    constructor(mcpInit, mcpEvents) {
        this.mcpInit = mcpInit;
        this.mcpEvents = mcpEvents;
    }
};
AppModule = __decorate([
    Module({
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
            PrismaService,
            MetricsService,
            RedisService,
            Logger,
            MCPEventService
        ],
        exports: [MCPWorkflowModule]
    }),
    __metadata("design:paramtypes", [MCPInitializationService,
        MCPEventService])
], AppModule);
export { AppModule };
