import { describe, expect, it, jest } from '@jest/globals';
import { type ExecutionContext } from '@nestjs/common';
import { type Reflector } from '@nestjs/core';
import { RolesGuard } from './roles.guard';

type RequestShape = {
  user?: {
    email?: string;
    role?: string;
    roles?: string[];
    permissions?: string[];
  };
};

const makeContext = (request: RequestShape): ExecutionContext =>
  ({
    switchToHttp: () => ({
      getRequest: () => request,
    }),
    getHandler: () => ({}),
    getClass: () => class TestController {},
  }) as unknown as ExecutionContext;

const makeReflector = (roles: Array<string | undefined> | undefined): Reflector =>
  ({
    getAllAndOverride: jest.fn().mockReturnValue(roles),
  }) as unknown as Reflector;

describe('RolesGuard', () => {
  it('allows access when no role metadata is present', () => {
    const guard = new RolesGuard(makeReflector(undefined));

    expect(guard.canActivate(makeContext({ user: { role: 'user' } }))).toBe(true);
  });

  it('denies access when role metadata exists but principal is missing', () => {
    const guard = new RolesGuard(makeReflector(['agency_admin']));

    expect(guard.canActivate(makeContext({}))).toBe(false);
  });

  it('matches normalized required roles against normalized principal roles', () => {
    const guard = new RolesGuard(makeReflector(['AGENCY_ADMIN']));

    expect(guard.canActivate(makeContext({ user: { role: 'va_admin' } }))).toBe(true);
  });

  it('accepts VA alias in required roles for canonical principal roles', () => {
    const guard = new RolesGuard(makeReflector(['va_operator']));

    expect(guard.canActivate(makeContext({ user: { role: 'agent_operator' } }))).toBe(true);
  });

  it('bypasses route role checks for master super admin email', () => {
    const guard = new RolesGuard(makeReflector(['agency_owner']));

    expect(
      guard.canActivate(
        makeContext({
          user: { email: 'owner@example.com', role: 'user' },
        })
      )
    ).toBe(true);
  });

  it('denies access when no required role matches', () => {
    const guard = new RolesGuard(makeReflector(['agency_owner']));

    expect(guard.canActivate(makeContext({ user: { role: 'user' } }))).toBe(false);
  });
});
