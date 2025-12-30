import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { ScheduleModule } from '@nestjs/schedule';
import { DatabaseModule } from '@the-new-fuse/database';
import { SecurityLoggingService } from '../security/security-logging.service';
import { MonitoringController } from './monitoring.controller';
import { WalletMonitoringService } from './wallet-monitoring.service';

@Module({
  imports: [ScheduleModule.forRoot(), JwtModule, DatabaseModule],
  controllers: [MonitoringController],
  providers: [WalletMonitoringService, SecurityLoggingService],
  exports: [WalletMonitoringService],
})
export class MonitoringModule {}
