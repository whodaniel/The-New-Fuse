import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { ScheduleModule } from '@nestjs/schedule';
import { PrismaService } from '@the-new-fuse/database';
import { SecurityLoggingService } from '../security/security-logging.service';
import { MonitoringController } from './monitoring.controller';
import { WalletMonitoringService } from './wallet-monitoring.service';

@Module({
  imports: [ScheduleModule.forRoot(), JwtModule],
  controllers: [MonitoringController],
  providers: [WalletMonitoringService, PrismaService, SecurityLoggingService],
  exports: [WalletMonitoringService],
})
export class MonitoringModule {}
