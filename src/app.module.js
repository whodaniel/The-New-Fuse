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
exports.AppModule = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const database_module_js_1 = require("./database/database.module.js");
const task_module_js_1 = require("./task/task.module.js");
const typeorm_1 = require("@nestjs/typeorm");
const database_config_js_1 = require("./config/database.config.js");
const NotificationService_js_1 = require("./notifications/NotificationService.js");
const monitoring_module_js_1 = require("./monitoring/monitoring.module.js");
const event_emitter_1 = require("@nestjs/event-emitter");
const mcp_module_js_1 = require("./mcp/mcp.module.js");
const mcp_controller_tsx_1 = require("./mcp/mcp.controller.tsx");
const agent_discovery_module_js_1 = require("./modules/agent-discovery.module.js");
const agent_discovery_controller_tsx_1 = require("./controllers/agent-discovery.controller.tsx");
const MCPWorkflowModule_tsx_1 = require("./modules/MCPWorkflowModule.tsx");
const MCPInitializationService_js_1 = require("./services/MCPInitializationService.js");
const WorkflowMonitoringService_js_1 = require("./services/WorkflowMonitoringService.js");
const WorkflowMCPIntegrationService_js_1 = require("./services/WorkflowMCPIntegrationService.js");
const AnalyticsIntegrationService_js_1 = require("./services/AnalyticsIntegrationService.js");
const SchemaValidationService_js_1 = require("./services/SchemaValidationService.js");
const prisma_service_js_1 = require("./prisma/prisma.service.js");
const metrics_service_js_1 = require("./metrics/metrics.service.js");
const redis_service_tsx_1 = require("./redis/redis.service.tsx");
const logger_service_js_1 = require("./common/logger.service.js");
const MCPEventService_js_1 = require("./services/MCPEventService.js");
const CopilotIntegrationModule_js_1 = require("./modules/CopilotIntegrationModule.js");
let AppModule = class AppModule {
    mcpInit;
    mcpEvents;
    constructor(mcpInit, mcpEvents) {
        this.mcpInit = mcpInit;
        this.mcpEvents = mcpEvents;
    }
};
exports.AppModule = AppModule;
exports.AppModule = AppModule = __decorate([
    (0, common_1.Module)({
        imports: [
            config_1.ConfigModule.forRoot({
                isGlobal: true,
            }),
            event_emitter_1.EventEmitterModule.forRoot(),
            typeorm_1.TypeOrmModule.forRoot((0, database_config_js_1.databaseConfig)()),
            database_module_js_1.DatabaseModule,
            task_module_js_1.TaskModule,
            monitoring_module_js_1.MonitoringModule,
            mcp_module_js_1.MCPModule,
            agent_discovery_module_js_1.AgentDiscoveryModule,
            MCPWorkflowModule_tsx_1.MCPWorkflowModule,
            CopilotIntegrationModule_js_1.CopilotIntegrationModule
        ],
        controllers: [mcp_controller_tsx_1.MCPController, agent_discovery_controller_tsx_1.AgentDiscoveryController],
        providers: [
            NotificationService_js_1.NotificationService,
            MCPInitializationService_js_1.MCPInitializationService,
            WorkflowMonitoringService_js_1.WorkflowMonitoringService,
            WorkflowMCPIntegrationService_js_1.WorkflowMCPIntegrationService,
            AnalyticsIntegrationService_js_1.AnalyticsIntegrationService,
            SchemaValidationService_js_1.SchemaValidationService,
            prisma_service_js_1.PrismaService,
            metrics_service_js_1.MetricsService,
            redis_service_tsx_1.RedisService,
            logger_service_js_1.Logger,
            MCPEventService_js_1.MCPEventService
        ],
        exports: [MCPWorkflowModule_tsx_1.MCPWorkflowModule]
    }),
    __metadata("design:paramtypes", [MCPInitializationService_js_1.MCPInitializationService,
        MCPEventService_js_1.MCPEventService])
], AppModule);
//# sourceMappingURL=app.module.js.map