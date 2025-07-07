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
const TNFMCPService_1 = require("./TNFMCPService");
const TNFMCPController_1 = require("./TNFMCPController");
const agent_service_1 = require("../services/agent.service");
const chat_service_1 = require("../services/chat.service");
const workflow_service_1 = require("../services/workflow.service");
const monitoring_service_1 = require("../services/monitoring.service");
const ClaudeDevAutomationService_1 = require("../services/ClaudeDevAutomationService");
let TNFMCPModule = class TNFMCPModule {
};
exports.TNFMCPModule = TNFMCPModule;
exports.TNFMCPModule = TNFMCPModule = __decorate([
    (0, common_1.Module)({
        providers: [
            TNFMCPService_1.TNFMCPService,
            agent_service_1.AgentService,
            chat_service_1.ChatService,
            workflow_service_1.WorkflowService,
            monitoring_service_1.MonitoringService,
            ClaudeDevAutomationService_1.ClaudeDevAutomationService,
        ],
        controllers: [TNFMCPController_1.TNFMCPController],
        exports: [TNFMCPService_1.TNFMCPService],
    })
], TNFMCPModule);
