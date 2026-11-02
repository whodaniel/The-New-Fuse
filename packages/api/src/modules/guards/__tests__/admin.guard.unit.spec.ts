import { describe, expect, it, jest } from '@jest/globals';
import { ForbiddenException, UnauthorizedException, type ExecutionContext } from '@nestjs/common';
import { GUARDS_METADATA } from '@nestjs/common/constants.js';
import { AdminAuditLogsController } from '../../../controllers/admin/admin-audit-logs.controller.js';
import { AdminConfigController } from '../../../controllers/admin/admin-config.controller.js';
import { AdminMetricsController } from '../../../controllers/admin/admin-metrics.controller.js';
import { AdminSettingsController } from '../../../controllers/admin/admin-settings.controller.js';
import { AdminGuard } from '../admin.guard.js';
import { JwtAuthGuard } from '../jwt-auth.guard.js';

// The controllers pull in ESM-only workspace packages through their services;
// only decorator metadata is inspected here, so stub those modules out.
jest.mock('@the-new-fuse/database', () => ({
  DRIZZLE_CLIENT: 'DRIZZLE_CLIENT',
  drizzleSchema: {},
  eq: jest.fn(),
}));

type RequestShape = {
  user?: {
    role?: unknown;
    roles?: unknown;
  };
};

const makeContext = (request: RequestShape): ExecutionContext =>
  ({
    switchToHttp: () => ({
      getRequest: () => request,
    }),
  }) as unknown as ExecutionContext;

describe('AdminGuard', () => {
  const guard = new AdminGuard();

  it('denies unauthenticated requests with UnauthorizedException', () => {
    expect(() => guard.canActivate(makeContext({}))).toThrow(UnauthorizedException);
  });

  it('denies an empty roles array', () => {
    expect(() => guard.canActivate(makeContext({ user: { roles: [] } }))).toThrow(
      ForbiddenException
    );
  });

  it('denies a user with no role at all', () => {
    expect(() => guard.canActivate(makeContext({ user: {} }))).toThrow(ForbiddenException);
  });

  it('denies non-admin roles', () => {
    expect(() => guard.canActivate(makeContext({ user: { roles: ['USER'] } }))).toThrow(
      ForbiddenException
    );
  });

  it('allows a lowercase single role "admin"', () => {
    expect(guard.canActivate(makeContext({ user: { role: 'admin' } }))).toBe(true);
  });

  it('allows roles: ["ADMIN"]', () => {
    expect(guard.canActivate(makeContext({ user: { roles: ['ADMIN'] } }))).toBe(true);
  });

  it('allows role: "SUPER_ADMIN"', () => {
    expect(guard.canActivate(makeContext({ user: { role: 'SUPER_ADMIN' } }))).toBe(true);
  });

  it.each([true, 1, { toUpperCase: () => 'ADMIN' }])(
    'denies a non-string role (%p) with ForbiddenException, not a TypeError',
    (role) => {
      expect(() => guard.canActivate(makeContext({ user: { role } }))).toThrow(ForbiddenException);
      expect(() => guard.canActivate(makeContext({ user: { roles: [role] } }))).toThrow(
        ForbiddenException
      );
    }
  );

  // Fails closed: the JWT strategy maps non-array roles to [], so a bare string
  // in `roles` is never an admin grant.
  it('denies roles given as a string rather than an array', () => {
    expect(() => guard.canActivate(makeContext({ user: { roles: 'ADMIN' } }))).toThrow(
      ForbiddenException
    );
  });
});

describe('admin controllers carry JwtAuthGuard and AdminGuard', () => {
  it.each([
    ['AdminConfigController', AdminConfigController],
    ['AdminAuditLogsController', AdminAuditLogsController],
    ['AdminMetricsController', AdminMetricsController],
    ['AdminSettingsController', AdminSettingsController],
  ])('%s', (_name, controller) => {
    const guards = Reflect.getMetadata(GUARDS_METADATA, controller as object) as unknown[];
    expect(guards).toEqual(expect.arrayContaining([JwtAuthGuard, AdminGuard]));
  });
});
