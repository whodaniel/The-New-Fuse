import { Module } from '@nestjs/common';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { DatabaseModule } from '@the-new-fuse/database';
// import { AgencyHubModule as CoreAgencyHubModule } from '../../types/core';

// Import existing controllers to maintain compatibility
import { A2AMessageBrokerController } from './controllers/a2a-broker.controller';
import { AgencyController } from './controllers/agency.controller';
import { AnalyticsController } from './controllers/analytics.controller';
import { ServiceRequestController } from './controllers/service-request.controller';
import { SwarmController } from './controllers/swarm.controller';

// Services - The Three Pillars of TNF Agent
import { A2AMessageBrokerService } from './services/a2a-message-broker.service';
import { AgentSwarmOrchestrationService } from './services/agent-swarm-orchestration.service';

@Module({
  imports: [
    // Required dependencies - EventEmitterModule configured at root app.module level
    EventEmitterModule,
    DatabaseModule,
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
  ],
  providers: [
    // Pillar 1: Orchestrator - Task management and swarm coordination
    AgentSwarmOrchestrationService,
    // Pillar 3: Message Broker - Inter-agent communication
    A2AMessageBrokerService,
    // Note: Pillar 2 (Heartbeat) is integrated into the Orchestrator via setInterval
  ],
  exports: [AgentSwarmOrchestrationService, A2AMessageBrokerService],
})
export class AgencyHubModule {}
