import { Module } from '@nestjs/common';
import { AuthModule } from '../../auth/auth.module';
import { PrismaModule } from '../../prisma/prisma.module';
import { SystemMetricsController } from './system-metrics.controller';
import { SystemMetricsService } from './system-metrics.service';

@Module({
  imports: [PrismaModule, AuthModule],
  controllers: [SystemMetricsController],
  providers: [SystemMetricsService],
  exports: [SystemMetricsService],
})
export class SystemMetricsModule {}
