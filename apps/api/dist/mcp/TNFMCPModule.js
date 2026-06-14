"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.TNFMCPModule = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const jwt_1 = require("@nestjs/jwt");
const database_1 = require("@the-new-fuse/database");
const workflow_stubs_provider_1 = require("../providers/workflow-stubs.provider");
const agent_api_grants_service_1 = require("../services/agent-api-grants.service");
const agent_service_1 = require("../services/agent.service");
const chat_service_1 = require("../services/chat.service");
const ClaudeDevAutomationService_1 = require("../services/ClaudeDevAutomationService");
const workflow_service_1 = require("../services/workflow.service");
const websocket_gateway_1 = require("../websocket/websocket.gateway");
const TNFMCPController_1 = require("./TNFMCPController");
const TNFMCPService_1 = require("./TNFMCPService");
const cache_service_1 = require("../cache/cache.service");
let TNFMCPModule = class TNFMCPModule {
};
exports.TNFMCPModule = TNFMCPModule;
exports.TNFMCPModule = TNFMCPModule = __decorate([
    (0, common_1.Module)({
        // DatabaseModule provides DrizzleService (Drizzle-backed) for all services
        imports: [database_1.DatabaseModule, config_1.ConfigModule, jwt_1.JwtModule],
        providers: [
            cache_service_1.CacheService,
            TNFMCPService_1.TNFMCPService,
            agent_service_1.AgentService,
            chat_service_1.ChatService,
            workflow_service_1.WorkflowService,
            ClaudeDevAutomationService_1.ClaudeDevAutomationService,
            agent_api_grants_service_1.AgentApiGrantsService,
            websocket_gateway_1.WebsocketGateway,
            // Stub providers for WorkflowService dependencies (until real implementations are available)
            workflow_stubs_provider_1.WORKFLOW_ENGINE_PROVIDER,
            workflow_stubs_provider_1.WORKFLOW_EXECUTOR_PROVIDER,
        ],
        controllers: [TNFMCPController_1.TNFMCPController],
        exports: [TNFMCPService_1.TNFMCPService],
    })
], TNFMCPModule);
//# sourceMappingURL=TNFMCPModule.js.map