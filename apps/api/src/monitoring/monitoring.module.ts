import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { WalletMonitoringService } from './wallet-monitoring.service';
import { MonitoringController } from './monitoring.controller';
import { PrismaService } from '@the-new-fuse/database';

@Module({
  imports: [ScheduleModule.forRoot()],
  controllers: [MonitoringController],
  providers: [WalletMonitoringService, PrismaService],
  exports: [WalletMonitoringService]
})
export class MonitoringModule {}