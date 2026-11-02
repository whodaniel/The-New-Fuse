import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { AdminGuard } from '../auth/admin.guard';
import { GatewayAuthGuard } from '../auth/gateway-auth.guard';
import { AdminBackupGatewayController } from './admin-backup-gateway.controller';

@Module({
  // GatewayAuthGuard verifies tokens with an explicit secret, so JwtModule needs no options.
  imports: [JwtModule.register({})],
  controllers: [AdminBackupGatewayController],
  providers: [GatewayAuthGuard, AdminGuard],
})
export class AdminBackupGatewayModule {}
