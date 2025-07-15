var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
import { Module } from '@nestjs/common';
import { MCPAgentServer } from '../mcp/MCPAgentServer.tsx';
import { WorkflowMonitoringService } from '../services/WorkflowMonitoringService.js';
import { WorkflowMCPIntegrationService } from '../services/WorkflowMCPIntegrationService.js';
import { AnalyticsIntegrationService } from '../services/AnalyticsIntegrationService.js';
import { SchemaValidationService } from '../services/SchemaValidationService.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { MetricsService } from '../metrics/metrics.service.js';
import { RedisService } from '../redis/redis.service.tsx';
import { Logger } from '../common/logger.service.js';
let MCPWorkflowModule = class MCPWorkflowModule {
    workflowMCPIntegration;
    analytics;
    schemaValidation;
    logger;
    constructor(workflowMCPIntegration, analytics, schemaValidation, logger) {
        this.workflowMCPIntegration = workflowMCPIntegration;
        this.analytics = analytics;
        this.schemaValidation = schemaValidation;
        this.logger = logger;
        this.initializeModule();
    }
    async initializeModule() {
        try {
            // Initialize MCP integration
            const tools = await this.workflowMCPIntegration.getAvailableMCPTools();
            this.logger.info(`Loaded ${tools.length} MCP tools`);
            // Initialize analytics
            await this.analytics.trackToolUsage('module_initialization');
            // Set up workflow validation hooks
            this.setupValidationHooks();
            this.logger.info('MCP Workflow Module initialized successfully');
        }
        catch (error) {
            this.logger.error('Failed to initialize MCP Workflow Module:', error);
            throw error;
        }
    }
    setupValidationHooks() {
        // Add hooks for workflow validation before execution
        this.workflowMCPIntegration.onBeforeWorkflowExecution(async (workflow) => {
            const validation = await this.schemaValidation.validateWorkflow(workflow);
            if (!validation.valid) {
                throw new Error(`Invalid workflow: ${validation.errors.join(', ')}`);
            }
        });
        // Add hooks for analytics after workflow completion
        this.workflowMCPIntegration.onWorkflowComplete(async (workflowId) => {
            await this.analytics.trackWorkflowPerformance(workflowId);
        });
    }
};
MCPWorkflowModule = __decorate([
    Module({
        providers: [
            MCPAgentServer,
            WorkflowMonitoringService,
            WorkflowMCPIntegrationService,
            AnalyticsIntegrationService,
            SchemaValidationService,
            PrismaService,
            MetricsService,
            RedisService,
            Logger
        ],
        exports: [
            MCPAgentServer,
            WorkflowMonitoringService,
            WorkflowMCPIntegrationService,
            AnalyticsIntegrationService,
            SchemaValidationService
        ]
    }),
    __metadata("design:paramtypes", [WorkflowMCPIntegrationService,
        AnalyticsIntegrationService,
        SchemaValidationService,
        Logger])
], MCPWorkflowModule);
export { MCPWorkflowModule };
