import { Module, Global } from '@nestjs/common';
import { PerformanceMetricsService } from './performance-metrics.service';
import { PerformanceMetricsController } from './performance-metrics.controller';

@Global()
@Module({
  providers: [PerformanceMetricsService],
  controllers: [PerformanceMetricsController],
  exports: [PerformanceMetricsService],
})
export class PerformanceMetricsModule {}
