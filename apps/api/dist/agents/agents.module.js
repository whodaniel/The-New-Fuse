"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AgentsModule = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const database_1 = require("@the-new-fuse/database");
const self_improvement_controller_1 = require("../controllers/self-improvement.controller");
const agent_factory_1 = require("./agent.factory");
const agents_service_1 = require("./agents.service");
const analyzer_service_1 = require("./analyzer.service");
const architect_service_1 = require("./architect.service");
const coordinator_service_1 = require("./coordinator.service");
const implementer_service_1 = require("./implementer.service");
const reviewer_service_1 = require("./reviewer.service");
const logger = new common_1.Logger('UnifiedMonitoringService');
/**
 * Self-Improvement Agents Module
 *
 * This module contains a swarm of AI agents that work together to analyze,
 * suggest, and implement improvements to The New Fuse framework itself.
 *
 * Agent Hierarchy:
 * - Coordinator: Orchestrates the entire improvement workflow
 * - Analyzer: Scans codebase for issues and bottlenecks
 * - Architect: Reviews architecture and suggests improvements
 * - Implementer: Writes code improvements and tests
 * - Reviewer: Reviews code for quality and security
 */
let AgentsModule = class AgentsModule {
};
exports.AgentsModule = AgentsModule;
exports.AgentsModule = AgentsModule = __decorate([
    (0, common_1.Module)({
        imports: [config_1.ConfigModule],
        controllers: [self_improvement_controller_1.SelfImprovementController],
        providers: [
            database_1.DrizzleService,
            agents_service_1.AgentsService,
            agent_factory_1.AgentFactory,
            // Mock UnifiedMonitoringService - TODO: Replace with actual implementation
            {
                provide: 'UnifiedMonitoringService',
                useValue: {
                    recordMetric: (metric, value, tags) => {
                        logger.log(`Record Metric: ${metric}`, { value, tags });
                    },
                    captureError: (error, context) => {
                        logger.error(`Capture Error: ${error instanceof Error ? error.message : String(error)}`, context);
                    },
                },
            },
            analyzer_service_1.AnalyzerAgentService,
            architect_service_1.ArchitectAgentService,
            implementer_service_1.ImplementerAgentService,
            reviewer_service_1.ReviewerAgentService,
            coordinator_service_1.CoordinatorAgentService,
        ],
        exports: [
            database_1.DrizzleService,
            agents_service_1.AgentsService,
            agent_factory_1.AgentFactory,
            analyzer_service_1.AnalyzerAgentService,
            architect_service_1.ArchitectAgentService,
            implementer_service_1.ImplementerAgentService,
            reviewer_service_1.ReviewerAgentService,
            coordinator_service_1.CoordinatorAgentService,
        ],
    })
], AgentsModule);
//# sourceMappingURL=agents.module.js.map