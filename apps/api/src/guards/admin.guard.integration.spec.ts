import {
  CanActivate,
  Controller,
  ExecutionContext,
  Get,
  INestApplication,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { AdminGuard } from './admin.guard.js';

class TestAuthGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const req = context.switchToHttp().getRequest<{ headers: Record<string, string>; user?: any }>();
    const raw = req.headers['x-test-user'];
    if (!raw) {
      throw new UnauthorizedException('Authentication required');
    }
    req.user = JSON.parse(String(raw));
    return true;
  }
}

@Controller('admin-guard-probe')
@UseGuards(TestAuthGuard, AdminGuard)
class AdminGuardProbeController {
  @Get('ok')
  ok() {
    return { ok: true };
  }
}

describe('AdminGuard integration', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleRef: TestingModule = await Test.createTestingModule({
      controllers: [AdminGuardProbeController],
      providers: [AdminGuard, TestAuthGuard],
    }).compile();

    app = moduleRef.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('denies unauthenticated access', async () => {
    await request(app.getHttpServer()).get('/admin-guard-probe/ok').expect(401);
  });

  it('allows classic admin role', async () => {
    await request(app.getHttpServer())
      .get('/admin-guard-probe/ok')
      .set('x-test-user', JSON.stringify({ id: 'admin-1', roles: ['ADMIN'] }))
      .expect(200);
  });

  it('allows VA admin alias via normalized agency-admin role', async () => {
    await request(app.getHttpServer())
      .get('/admin-guard-probe/ok')
      .set('x-test-user', JSON.stringify({ id: 'va-admin-1', role: 'va_admin' }))
      .expect(200);
  });

  it('denies non-admin role', async () => {
    await request(app.getHttpServer())
      .get('/admin-guard-probe/ok')
      .set('x-test-user', JSON.stringify({ id: 'user-1', role: 'user' }))
      .expect(401);
  });
});
