import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  INestApplication,
  UnauthorizedException,
} from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';

import { MemberOrAdminGuard } from '../../guards/member-or-admin.guard.js';
import { PayPalService } from '../billing/paypal.service.js';
import { MarketplaceController } from './marketplace.controller.js';
import { MarketplaceService } from './marketplace.service.js';

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

describe('Marketplace member policy integration', () => {
  let app: INestApplication;

  const submitExperience = jest.fn(async (input: any) => ({
    id: 'exp-test',
    ...input,
  }));
  const submitCatalogItem = jest.fn(async (input: any) => ({
    id: 'cat-test',
    ...input,
  }));
  const getMembershipForUser = jest.fn(
    async (userId: string) =>
      ({
        found: true,
        active: userId !== 'starter-user',
        tier: userId === 'starter-user' ? 'STARTER' : 'PRO',
        userId,
      }) as const
  );

  beforeAll(async () => {
    const moduleRef: TestingModule = await Test.createTestingModule({
      controllers: [MarketplaceController],
      providers: [
        MemberOrAdminGuard,
        {
          provide: MarketplaceService,
          useValue: {
            submitExperience,
            submitCatalogItem,
          },
        },
        {
          provide: PayPalService,
          useValue: { getMembershipForUser },
        },
      ],
    }).compile();

    app = moduleRef.createNestApplication();
    // Keep status-code assertions deterministic in this lightweight test module.
    @Catch()
    class TestHttpExceptionFilter implements ExceptionFilter {
      catch(exception: unknown, host: ArgumentsHost) {
        const response = host.switchToHttp().getResponse();
        if (exception instanceof HttpException) {
          return response.status(exception.getStatus()).json(exception.getResponse());
        }
        return response.status(500).json({ message: 'Internal Server Error' });
      }
    }
    app.useGlobalFilters(new TestHttpExceptionFilter());
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(() => {
    submitExperience.mockClear();
    submitCatalogItem.mockClear();
    getMembershipForUser.mockClear();
  });

  it('allows active member to submit experience and sets createdBy from principal email', async () => {
    await request(app.getHttpServer())
      .post('/marketplace/experiences/submit')
      .set(
        'x-test-user',
        JSON.stringify({ id: 'member-user', email: 'member@example.com', roles: ['USER'] })
      )
      .send({
        name: 'Community Builder',
        description: 'Member-submitted experience',
        category: 'community',
      })
      .expect(201);

    expect(getMembershipForUser).toHaveBeenCalledWith('member-user');
    expect(submitExperience).toHaveBeenCalledWith(
      expect.objectContaining({
        createdBy: 'member@example.com',
      })
    );
  });

  it('allows admin to submit catalog item without membership lookup', async () => {
    await request(app.getHttpServer())
      .post('/marketplace/catalog/submit')
      .set('x-test-user', JSON.stringify({ id: 'admin-user', roles: ['ADMIN'] }))
      .send({
        kind: 'skill',
        name: 'Admin Skill',
        description: 'Admin-submitted skill',
        category: 'development',
      })
      .expect(201);

    expect(getMembershipForUser).not.toHaveBeenCalled();
    expect(submitCatalogItem).toHaveBeenCalledWith(
      expect.objectContaining({
        createdBy: 'admin-user',
      })
    );
  });

  it('denies inactive member submission', async () => {
    await request(app.getHttpServer())
      .post('/marketplace/experiences/submit')
      .set(
        'x-test-user',
        JSON.stringify({ id: 'starter-user', email: 'starter@example.com', roles: ['USER'] })
      )
      .send({
        name: 'Starter Experience',
        description: 'Should not pass policy',
        category: 'community',
      })
      .expect(403);

    expect(getMembershipForUser).toHaveBeenCalledWith('starter-user');
    expect(submitExperience).not.toHaveBeenCalled();
  });

  it('denies unauthenticated submission', async () => {
    await request(app.getHttpServer())
      .post('/marketplace/catalog/submit')
      .send({
        kind: 'skill',
        name: 'No Auth Skill',
        description: 'Should not pass policy',
        category: 'development',
      })
      .expect(401);

    expect(getMembershipForUser).not.toHaveBeenCalled();
    expect(submitCatalogItem).not.toHaveBeenCalled();
  });
});
