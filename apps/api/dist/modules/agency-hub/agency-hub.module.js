"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AgencyHubModule = void 0;
const common_1 = require("@nestjs/common");
const event_emitter_1 = require("@nestjs/event-emitter");
const database_1 = require("@the-new-fuse/database");
// import { AgencyHubModule as CoreAgencyHubModule } from '../../types/core';
const unified_ledger_module_1 = require("../unified-ledger/unified-ledger.module");
// Import existing controllers to maintain compatibility
const a2a_auth_broker_controller_1 = require("./controllers/a2a-auth-broker.controller");
const a2a_broker_controller_1 = require("./controllers/a2a-broker.controller");
const agency_controller_1 = require("./controllers/agency.controller");
const analytics_controller_1 = require("./controllers/analytics.controller");
const email_custodian_controller_1 = require("./controllers/email-custodian.controller");
const service_request_controller_1 = require("./controllers/service-request.controller");
const swarm_controller_1 = require("./controllers/swarm.controller");
const metrics_service_1 = require("../../services/metrics.service");
// Services - The Three Pillars of TNF Agent
const a2a_auth_broker_service_1 = require("./services/a2a-auth-broker.service");
const a2a_message_broker_service_1 = require("./services/a2a-message-broker.service");
const agency_analytics_service_1 = require("./services/agency-analytics.service");
const agent_swarm_orchestration_service_1 = require("./services/agent-swarm-orchestration.service");
const email_custodian_service_1 = require("./services/email-custodian.service");
let AgencyHubModule = class AgencyHubModule {
};
exports.AgencyHubModule = AgencyHubModule;
exports.AgencyHubModule = AgencyHubModule = __decorate([
    (0, common_1.Module)({
        imports: [
            // Required dependencies - EventEmitterModule configured at root app.module level
            event_emitter_1.EventEmitterModule,
            database_1.DatabaseModule,
            unified_ledger_module_1.UnifiedLedgerModule,
        ],
        controllers: [
            // Keep existing controllers for backward compatibility
            // These will work alongside the core controllers
            agency_controller_1.AgencyController,
            swarm_controller_1.SwarmController,
            service_request_controller_1.ServiceRequestController,
            analytics_controller_1.AnalyticsController,
            // A2A Message Broker Controller - Third Pillar
            a2a_broker_controller_1.A2AMessageBrokerController,
            a2a_auth_broker_controller_1.A2AAuthBrokerController,
            email_custodian_controller_1.EmailCustodianController,
        ],
        providers: [
            metrics_service_1.MetricsService,
            agency_analytics_service_1.AgencyAnalyticsService,
            // Pillar 1: Orchestrator - Task management and swarm coordination
            agent_swarm_orchestration_service_1.AgentSwarmOrchestrationService,
            // Pillar 3: Message Broker - Inter-agent communication
            a2a_message_broker_service_1.A2AMessageBrokerService,
            a2a_auth_broker_service_1.A2AAuthBrokerService,
            email_custodian_service_1.EmailCustodianService,
            // Note: Pillar 2 (Heartbeat) is integrated into the Orchestrator via setInterval
        ],
        exports: [
            agent_swarm_orchestration_service_1.AgentSwarmOrchestrationService,
            a2a_message_broker_service_1.A2AMessageBrokerService,
            a2a_auth_broker_service_1.A2AAuthBrokerService,
            email_custodian_service_1.EmailCustodianService,
        ],
    })
], AgencyHubModule);
//# sourceMappingURL=agency-hub.module.js.map