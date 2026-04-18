import { Module } from '@nestjs/common';
import { OrchestratorModule } from '../modules/orchestrator/index.js';
import { SystemMetricsModule } from '../modules/system-metrics/system-metrics.module.js';
import { AgentController } from './agent.controller.js';
import { NexusObservabilityController } from './nexus-observability.controller.js';
import { SystemController } from './system.controller.js';
import { TnfRegistryService } from './tnf-registry.service.js';

@Module({
  imports: [OrchestratorModule, SystemMetricsModule],
  controllers: [AgentController, SystemController, NexusObservabilityController],
  providers: [TnfRegistryService],
})
export class ApiModule {}
