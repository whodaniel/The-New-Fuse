import { Module } from '@nestjs/common';
import { DrizzleModule } from '@the-new-fuse/database';
import { AuthModule } from '../../auth/auth.module.js';
import { SystemMetricsController } from './system-metrics.controller.js';
import { SystemMetricsService } from './system-metrics.service.js';

@Module({
  imports: [DrizzleModule.forRootAsync(), AuthModule],
  controllers: [SystemMetricsController],
  providers: [SystemMetricsService],
  exports: [SystemMetricsService],
})
export class SystemMetricsModule {}
