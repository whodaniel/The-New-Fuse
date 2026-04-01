import { ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { Test, TestingModule } from '@nestjs/testing';
// @ts-ignore
// @ts-ignore
import { DatabaseService } from '@the-new-fuse/database';
import { hash } from 'bcrypt';
import jwt from 'jsonwebtoken';

import { AuthGuard } from '../../guards/auth.guard';
import { AuthService } from '../../services/auth.service';
import { AuthController } from '../auth.controller';

describe('AuthController Login Claims (integration)', () => {
  let controller: AuthController;
  const dbMock = {
    users: {
      findByEmail: jest.fn(),
      findById: jest.fn(),
      findByUsername: jest.fn(),
      create: jest.fn(),
    },
  };

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [JwtModule.register({ secret: 'test-jwt-secret' })],
      controllers: [AuthController],
      providers: [
        AuthService,
        {
          provide: DatabaseService,
          useValue: dbMock,
        },
        {
          provide: ConfigService,
          useValue: {
            get: (key: string) => {
              if (key === 'JWT_SECRET') return 'test-jwt-secret';
              if (key === 'JWT_REFRESH_SECRET') return 'test-refresh-secret';
              return undefined;
            },
          },
        },
        {
          provide: AuthGuard,
          useValue: { canActivate: () => true },
        },
      ],
    }).compile();

    controller = moduleFixture.get(AuthController);
  });

  it('issues /auth/login handler JWT with normalized role and permission claims', async () => {
    const hashedPassword = await hash('StrongPass123!', 10);
    dbMock.users.findByEmail.mockResolvedValueOnce({
      id: 'user-1',
      email: 'admin@example.com',
      username: 'admin_user',
      name: 'Admin User',
      role: 'ADMIN',
      roles: ['ADMIN'],
      hashedPassword,
      emailVerified: true,
      isActive: true,
    });

    const response = await controller.login({
      email: 'admin@example.com',
      password: 'StrongPass123!',
    });

    const accessToken = response?.accessToken;
    expect(typeof accessToken).toBe('string');

    const payload = jwt.verify(accessToken, 'test-jwt-secret') as any;
    expect(payload.sub).toBe('user-1');
    expect(payload.roles).toEqual(expect.arrayContaining(['ADMIN', 'admin']));
    expect(payload.permissions).toEqual(
      expect.arrayContaining([
        'admin:access',
        'handoff:publish',
        'handoff:read:any',
        'handoff:ack:any',
      ])
    );
  });
});
