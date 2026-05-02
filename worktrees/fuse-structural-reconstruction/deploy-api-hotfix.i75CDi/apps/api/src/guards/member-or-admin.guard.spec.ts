import { ExecutionContext, ForbiddenException, UnauthorizedException } from '@nestjs/common';

import { PayPalService } from '../modules/billing/paypal.service';
import { MemberOrAdminGuard } from './member-or-admin.guard';

type RequestShape = {
  user?: {
    id?: string;
    sub?: string;
    email?: string;
    role?: string;
    roles?: string[];
    permissions?: string[];
  };
};

describe('MemberOrAdminGuard', () => {
  const makeContext = (request: RequestShape): ExecutionContext =>
    ({
      switchToHttp: () => ({
        getRequest: () => request,
      }),
    }) as unknown as ExecutionContext;

  it('allows admin users without membership lookup', async () => {
    const payPalService = {
      getMembershipForUser: jest.fn(),
    } as unknown as PayPalService;
    const guard = new MemberOrAdminGuard(payPalService);

    const allowed = await guard.canActivate(
      makeContext({
        user: { id: 'u-admin', roles: ['ADMIN'] },
      })
    );

    expect(allowed).toBe(true);
    expect(payPalService.getMembershipForUser).not.toHaveBeenCalled();
  });

  it('allows non-admin users with active membership', async () => {
    const payPalService = {
      getMembershipForUser: jest.fn().mockResolvedValue({
        found: true,
        active: true,
        tier: 'PRO',
        userId: 'u-member',
      }),
    } as unknown as PayPalService;
    const guard = new MemberOrAdminGuard(payPalService);

    const allowed = await guard.canActivate(
      makeContext({
        user: { id: 'u-member', roles: ['USER'] },
      })
    );

    expect(allowed).toBe(true);
    expect(payPalService.getMembershipForUser).toHaveBeenCalledWith('u-member');
  });

  it('denies non-admin users without active membership', async () => {
    const payPalService = {
      getMembershipForUser: jest.fn().mockResolvedValue({
        found: true,
        active: false,
        tier: 'STARTER',
        userId: 'u-starter',
      }),
    } as unknown as PayPalService;
    const guard = new MemberOrAdminGuard(payPalService);

    await expect(
      guard.canActivate(
        makeContext({
          user: { id: 'u-starter', roles: ['USER'] },
        })
      )
    ).rejects.toThrow(ForbiddenException);
    expect(payPalService.getMembershipForUser).toHaveBeenCalledWith('u-starter');
  });

  it('denies requests with no authenticated user id', async () => {
    const payPalService = {
      getMembershipForUser: jest.fn(),
    } as unknown as PayPalService;
    const guard = new MemberOrAdminGuard(payPalService);

    await expect(guard.canActivate(makeContext({ user: {} }))).rejects.toThrow(
      UnauthorizedException
    );
    expect(payPalService.getMembershipForUser).not.toHaveBeenCalled();
  });

  it('supports jwt sub claim when id is not present', async () => {
    const payPalService = {
      getMembershipForUser: jest.fn().mockResolvedValue({
        found: true,
        active: true,
        tier: 'PRO',
        userId: 'u-sub',
      }),
    } as unknown as PayPalService;
    const guard = new MemberOrAdminGuard(payPalService);

    const allowed = await guard.canActivate(
      makeContext({
        user: { sub: 'u-sub', roles: ['USER'] },
      })
    );

    expect(allowed).toBe(true);
    expect(payPalService.getMembershipForUser).toHaveBeenCalledWith('u-sub');
  });
});
