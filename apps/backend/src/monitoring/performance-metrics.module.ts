import { Global, Module } from '@nestjs/common';
import { PerformanceMetricsController } from './performance-metrics.controller';
import { PerformanceMetricsService } from './performance-metrics.service';

@Global()
@Module({
  providers: [PerformanceMetricsService],
  controllers: [PerformanceMetricsController],
  exports: [PerformanceMetricsService],
})
export class PerformanceMetricsModule {}
