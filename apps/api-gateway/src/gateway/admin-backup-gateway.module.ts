import { Module } from '@nestjs/common';
import { AdminBackupGatewayController } from './admin-backup-gateway.controller';

@Module({
  controllers: [AdminBackupGatewayController],
})
export class AdminBackupGatewayModule {}
