import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  INestApplication,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { AuthService } from '../services/auth.service.js';
import { OnboardingController } from './onboarding.controller.js';

describe('OnboardingController integration', () => {
  let app: INestApplication;
  let authService: { validateInviteCode: jest.Mock };
  let configService: { get: jest.Mock };

  beforeEach(async () => {
    authService = {
      validateInviteCode: jest.fn(),
    };
    configService = {
      get: jest.fn((key: string) => {
        if (key === 'AUTH_INVITE_ONLY') return 'true';
        if (key === 'AUTH_ONBOARDING_TOKENS') return 'TOKEN123,TOKEN456';
        return '';
      }),
    };

    const moduleRef: TestingModule = await Test.createTestingModule({
      controllers: [OnboardingController],
      providers: [
        { provide: AuthService, useValue: authService },
        { provide: ConfigService, useValue: configService },
      ],
    }).compile();

    app = moduleRef.createNestApplication();
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

  afterEach(async () => {
    await app.close();
  });

  it('returns 403 when invite-only and no invite/token is provided', async () => {
    const response = await request(app.getHttpServer()).post('/onboarding/start').send({});

    expect(response.status).toBe(403);
  });

  it('allows start when invite code validates', async () => {
    authService.validateInviteCode.mockResolvedValue({ code: 'ABC', source: 'env' });

    const response = await request(app.getHttpServer())
      .post('/onboarding/start')
      .set('user-agent', 'Mozilla/5.0')
      .send({ inviteCode: 'ABC' });

    expect(response.status).toBe(201);
    expect(response.body.success).toBe(true);
    expect(response.body.access.inviteValidated).toBe(true);
    expect(response.body.userType).toBe('human');
  });

  it('allows start when onboarding token validates', async () => {
    const response = await request(app.getHttpServer())
      .post('/onboarding/start')
      .set('user-agent', 'goose/1.0')
      .send({ onboardingToken: 'TOKEN123' });

    expect(response.status).toBe(201);
    expect(response.body.success).toBe(true);
    expect(response.body.access.tokenValidated).toBe(true);
    expect(response.body.userType).toBe('ai_agent');
  });
});
