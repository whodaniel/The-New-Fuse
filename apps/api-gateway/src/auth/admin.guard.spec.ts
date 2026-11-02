import { ExecutionContext, ForbiddenException, UnauthorizedException } from '@nestjs/common';
import { AdminGuard } from './admin.guard';

const ctxFor = (user?: unknown) =>
  ({
    switchToHttp: () => ({ getRequest: () => ({ user }) }),
  }) as unknown as ExecutionContext;

describe('AdminGuard', () => {
  const guard = new AdminGuard();

  it('throws 401 when no user is attached to the request', () => {
    expect(() => guard.canActivate(ctxFor(undefined))).toThrow(UnauthorizedException);
  });

  it('throws 403 for a non-admin role', () => {
    expect(() => guard.canActivate(ctxFor({ roles: ['USER'] }))).toThrow(ForbiddenException);
    expect(() => guard.canActivate(ctxFor({ role: 'USER' }))).toThrow(ForbiddenException);
  });

  it('throws 403 when the user has no roles', () => {
    expect(() => guard.canActivate(ctxFor({ id: 'u1' }))).toThrow(ForbiddenException);
  });

  it('throws 403 for non-string role entries instead of crashing', () => {
    expect(() => guard.canActivate(ctxFor({ roles: [42, null, { x: 1 }] }))).toThrow(
      ForbiddenException
    );
  });

  it('allows ADMIN and SUPER_ADMIN via roles array or role string', () => {
    expect(guard.canActivate(ctxFor({ roles: ['ADMIN'] }))).toBe(true);
    expect(guard.canActivate(ctxFor({ roles: ['USER', 'SUPER_ADMIN'] }))).toBe(true);
    expect(guard.canActivate(ctxFor({ role: 'ADMIN' }))).toBe(true);
    expect(guard.canActivate(ctxFor({ role: 'admin' }))).toBe(true);
  });
});
