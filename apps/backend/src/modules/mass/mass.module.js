"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.MassModule = void 0;
const common_1 = require("@nestjs/common");
const prisma_module_1 = require("../lib/prisma/prisma.module");
const mass_controller_1 = require("./mass.controller");
const mass_orchestration_service_1 = require("./mass-orchestration.service");
const prompt_optimizer_service_1 = require("./prompt-optimizer.service");
const topology_optimizer_service_1 = require("./topology-optimizer.service");
const workflow_prompt_optimizer_service_1 = require("./workflow-prompt-optimizer.service");
const aggregate_service_1 = require("./building-blocks/aggregate.service");
const reflect_service_1 = require("./building-blocks/reflect.service");
const debate_service_1 = require("./building-blocks/debate.service");
const custom_agent_service_1 = require("./building-blocks/custom-agent.service");
const tool_use_service_1 = require("./building-blocks/tool-use.service");
let MassModule = class MassModule {
};
exports.MassModule = MassModule;
exports.MassModule = MassModule = __decorate([
    (0, common_1.Module)({
        imports: [prisma_module_1.PrismaModule],
        controllers: [mass_controller_1.MassController],
        providers: [
            mass_orchestration_service_1.MassOrchestrationService,
            prompt_optimizer_service_1.PromptOptimizerService,
            topology_optimizer_service_1.TopologyOptimizerService,
            workflow_prompt_optimizer_service_1.WorkflowPromptOptimizerService,
            aggregate_service_1.AggregateService,
            reflect_service_1.ReflectService,
            debate_service_1.DebateService,
            custom_agent_service_1.CustomAgentService,
            tool_use_service_1.ToolUseService
        ],
        exports: [
            mass_orchestration_service_1.MassOrchestrationService,
            prompt_optimizer_service_1.PromptOptimizerService,
            topology_optimizer_service_1.TopologyOptimizerService,
            workflow_prompt_optimizer_service_1.WorkflowPromptOptimizerService,
            aggregate_service_1.AggregateService,
            reflect_service_1.ReflectService,
            debate_service_1.DebateService,
            custom_agent_service_1.CustomAgentService,
            tool_use_service_1.ToolUseService
        ]
    })
], MassModule);
