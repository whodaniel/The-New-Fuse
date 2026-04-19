import { Module } from '@nestjs/common';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { DatabaseModule } from '@the-new-fuse/database';
// import { AgencyHubModule as CoreAgencyHubModule } from '../../types/core';
import { UnifiedLedgerModule } from '../unified-ledger/unified-ledger.module';

// Import existing controllers to maintain compatibility
import { A2AAuthBrokerController } from './controllers/a2a-auth-broker.controller';
import { A2AMessageBrokerController } from './controllers/a2a-broker.controller';
import { AgencyController } from './controllers/agency.controller';
import { AnalyticsController } from './controllers/analytics.controller';
import { EmailCustodianController } from './controllers/email-custodian.controller';
import { ServiceRequestController } from './controllers/service-request.controller';
import { SwarmController } from './controllers/swarm.controller';

// Services - The Three Pillars of TNF Agent
import { A2AAuthBrokerService } from './services/a2a-auth-broker.service';
import { A2AMessageBrokerService } from './services/a2a-message-broker.service';
import { AgentSwarmOrchestrationService } from './services/agent-swarm-orchestration.service';
import { EmailCustodianService } from './services/email-custodian.service';

@Module({
  imports: [
    // Required dependencies - EventEmitterModule configured at root app.module level
    EventEmitterModule,
    DatabaseModule,
    UnifiedLedgerModule,
  ],
  controllers: [
    // Keep existing controllers for backward compatibility
    // These will work alongside the core controllers
    AgencyController,
    SwarmController,
    ServiceRequestController,
    AnalyticsController,
    // A2A Message Broker Controller - Third Pillar
    A2AMessageBrokerController,
    A2AAuthBrokerController,
    EmailCustodianController,
  ],
  providers: [
    // Pillar 1: Orchestrator - Task management and swarm coordination
    AgentSwarmOrchestrationService,
    // Pillar 3: Message Broker - Inter-agent communication
    A2AMessageBrokerService,
    A2AAuthBrokerService,
    EmailCustodianService,
    // Note: Pillar 2 (Heartbeat) is integrated into the Orchestrator via setInterval
  ],
  exports: [
    AgentSwarmOrchestrationService,
    A2AMessageBrokerService,
    A2AAuthBrokerService,
    EmailCustodianService,
  ],
})
export class AgencyHubModule {}
