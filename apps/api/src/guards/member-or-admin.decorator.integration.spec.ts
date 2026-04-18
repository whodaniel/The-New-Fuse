import { Controller, INestApplication, Post, UnauthorizedException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';

import { PayPalService } from '../modules/billing/paypal.service.js';

jest.mock('@nestjs/passport', () => ({
  AuthGuard: () =>
    class MockJwtGuard {
      canActivate(context: any) {
        const req = context.switchToHttp().getRequest();
        const raw = req.headers['x-test-user'];
        if (!raw) {
          throw new UnauthorizedException('Authentication required');
        }
        req.user = JSON.parse(String(raw));
        return true;
      }
    },
}));

import { MemberOrAdmin, MemberOrAdminGuard } from './member-or-admin.guard.js';

@Controller('test-member-or-admin')
class TestMemberOrAdminController {
  @Post()
  @MemberOrAdmin()
  runProtectedAction() {
    return { ok: true };
  }
}

describe('MemberOrAdmin decorator integration', () => {
  let app: INestApplication;
  const getMembershipForUser = jest.fn(
    async (userId: string) =>
      ({
        found: true,
        active: userId !== 'inactive-user',
        tier: userId === 'inactive-user' ? 'STARTER' : 'PRO',
        userId,
      }) as const
  );

  beforeAll(async () => {
    const moduleRef: TestingModule = await Test.createTestingModule({
      controllers: [TestMemberOrAdminController],
      providers: [
        MemberOrAdminGuard,
        {
          provide: PayPalService,
          useValue: { getMembershipForUser },
        },
      ],
    }).compile();

    app = moduleRef.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(() => {
    getMembershipForUser.mockClear();
  });

  it('allows ADMIN user without membership lookup', async () => {
    await request(app.getHttpServer())
      .post('/test-member-or-admin')
      .set('x-test-user', JSON.stringify({ id: 'admin-user', roles: ['ADMIN'] }))
      .expect(201)
      .expect({ ok: true });

    expect(getMembershipForUser).not.toHaveBeenCalled();
  });

  it('allows active member user', async () => {
    await request(app.getHttpServer())
      .post('/test-member-or-admin')
      .set('x-test-user', JSON.stringify({ id: 'member-user', roles: ['USER'] }))
      .expect(201)
      .expect({ ok: true });

    expect(getMembershipForUser).toHaveBeenCalledWith('member-user');
  });
});
