import { Module } from '@nestjs/common';
import { DrizzleModule } from '@the-new-fuse/database';
import { AuthModule } from '../../auth/auth.module';
import { SystemMetricsController } from './system-metrics.controller';
import { SystemMetricsService } from './system-metrics.service';

@Module({
  imports: [DrizzleModule.forRootAsync(), AuthModule],
  controllers: [SystemMetricsController],
  providers: [SystemMetricsService],
  exports: [SystemMetricsService],
})
export class SystemMetricsModule {}
