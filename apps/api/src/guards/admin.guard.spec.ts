import { UnauthorizedException, type ExecutionContext } from '@nestjs/common';
import { describe, expect, it } from '@jest/globals';
import { AdminGuard } from './admin.guard.js';

type RequestShape = {
  user?: {
    role?: string;
    roles?: string[];
    email?: string;
  };
};

const makeContext = (request: RequestShape): ExecutionContext =>
  ({
    switchToHttp: () => ({
      getRequest: () => request,
    }),
  }) as unknown as ExecutionContext;

describe('AdminGuard', () => {
  it('denies unauthenticated requests', async () => {
    const guard = new AdminGuard();

    await expect(guard.canActivate(makeContext({}))).rejects.toThrow(UnauthorizedException);
  });

  it('allows standard admin users', async () => {
    const guard = new AdminGuard();

    await expect(
      guard.canActivate(
        makeContext({
          user: { roles: ['ADMIN'] },
        })
      )
    ).resolves.toBe(true);
  });

  it('allows VA aliases that normalize to agency admin roles', async () => {
    const guard = new AdminGuard();

    await expect(
      guard.canActivate(
        makeContext({
          user: { role: 'va_admin' },
        })
      )
    ).resolves.toBe(true);
  });

  it('denies non-admin/non-agency roles', async () => {
    const guard = new AdminGuard();

    await expect(
      guard.canActivate(
        makeContext({
          user: { role: 'user' },
        })
      )
    ).rejects.toThrow(UnauthorizedException);
  });
});
