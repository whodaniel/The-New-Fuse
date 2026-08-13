import { Module } from '@nestjs/common';
import { OrchestratorModule } from '../modules/orchestrator';
import { SystemMetricsModule } from '../modules/system-metrics/system-metrics.module';
import { AgentController } from './agent.controller';
import { AnalyticsController } from './analytics.controller';
import { NexusObservabilityController } from './nexus-observability.controller';
import { SystemController } from './system.controller';
import { TnfRegistryService } from './tnf-registry.service';

@Module({
  imports: [OrchestratorModule, SystemMetricsModule],
  controllers: [
    AgentController,
    SystemController,
    NexusObservabilityController,
    AnalyticsController,
  ],
  providers: [TnfRegistryService],
})
export class ApiModule {}
