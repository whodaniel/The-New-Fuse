import 'reflect-metadata';
import { AdminGuard } from '../auth/admin.guard';
import { GatewayAuthGuard } from '../auth/gateway-auth.guard';
import { AdminBackupGatewayController } from './admin-backup-gateway.controller';

describe('AdminBackupGatewayController', () => {
  it('attaches the auth guard and the admin guard, in that order', () => {
    const guards = Reflect.getMetadata('__guards__', AdminBackupGatewayController);
    expect(guards).toEqual([GatewayAuthGuard, AdminGuard]);
  });
});
