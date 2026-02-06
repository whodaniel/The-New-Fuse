"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.MCPWorkflowModule = void 0;
const common_1 = require("@nestjs/common");
const MCPAgentServer_tsx_1 = require("../mcp/MCPAgentServer.tsx");
const WorkflowMonitoringService_js_1 = require("../services/WorkflowMonitoringService.js");
const WorkflowMCPIntegrationService_js_1 = require("../services/WorkflowMCPIntegrationService.js");
const AnalyticsIntegrationService_js_1 = require("../services/AnalyticsIntegrationService.js");
const SchemaValidationService_js_1 = require("../services/SchemaValidationService.js");
const drizzle_service_js_1 = require("../drizzle/drizzle.service.js");
const metrics_service_js_1 = require("../metrics/metrics.service.js");
const redis_service_tsx_1 = require("../redis/redis.service.tsx");
const logger_service_js_1 = require("../common/logger.service.js");
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
exports.MCPWorkflowModule = MCPWorkflowModule;
exports.MCPWorkflowModule = MCPWorkflowModule = __decorate([
    (0, common_1.Module)({
        providers: [
            MCPAgentServer_tsx_1.MCPAgentServer,
            WorkflowMonitoringService_js_1.WorkflowMonitoringService,
            WorkflowMCPIntegrationService_js_1.WorkflowMCPIntegrationService,
            AnalyticsIntegrationService_js_1.AnalyticsIntegrationService,
            SchemaValidationService_js_1.SchemaValidationService,
            drizzle_service_js_1.DatabaseService,
            metrics_service_js_1.MetricsService,
            redis_service_tsx_1.RedisService,
            logger_service_js_1.Logger
        ],
        exports: [
            MCPAgentServer_tsx_1.MCPAgentServer,
            WorkflowMonitoringService_js_1.WorkflowMonitoringService,
            WorkflowMCPIntegrationService_js_1.WorkflowMCPIntegrationService,
            AnalyticsIntegrationService_js_1.AnalyticsIntegrationService,
            SchemaValidationService_js_1.SchemaValidationService
        ]
    }),
    __metadata("design:paramtypes", [WorkflowMCPIntegrationService_js_1.WorkflowMCPIntegrationService,
        AnalyticsIntegrationService_js_1.AnalyticsIntegrationService,
        SchemaValidationService_js_1.SchemaValidationService,
        logger_service_js_1.Logger])
], MCPWorkflowModule);
//# sourceMappingURL=MCPWorkflowModule.js.map