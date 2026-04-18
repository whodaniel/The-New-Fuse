import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
// @ts-ignore
// @ts-ignore
// @ts-ignore
import { DatabaseModule } from '@the-new-fuse/database';
import { SecurityLoggingService } from '../security/security-logging.service.js';
import { MonitoringController } from './monitoring.controller.js';
import { WalletMonitoringService } from './wallet-monitoring.service.js';

@Module({
  imports: [JwtModule, DatabaseModule],
  controllers: [MonitoringController],
  providers: [WalletMonitoringService, SecurityLoggingService],
  exports: [WalletMonitoringService],
})
export class MonitoringModule {}
