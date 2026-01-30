import { Module } from '@nestjs/common';
import { AgentModule } from '../modules/agent/agent.module';
import { SystemMetricsModule } from '../modules/system-metrics/system-metrics.module';
import { MetricsAggregatorService } from './metrics-aggregator.service';
import { MetricsController } from './metrics.controller';

@Module({
  imports: [AgentModule, SystemMetricsModule],
  controllers: [MetricsController],
  providers: [MetricsAggregatorService],
  exports: [MetricsAggregatorService],
})
export class MetricsModule {}
