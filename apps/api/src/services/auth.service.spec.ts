import { describe, expect, it, jest } from '@jest/globals';

import { AuthService } from './auth.service';

describe('AuthService', () => {
  const createService = () => {
    const db = {
      users: {},
      client: {
        execute: jest.fn(),
      },
    } as any;
    const jwtService = {
      signAsync: jest.fn().mockResolvedValue('signed-token'),
    } as any;
    const configService = {
      get: jest.fn((key: string) => {
        if (key === 'JWT_REFRESH_SECRET') return 'refresh-secret';
        if (key === 'JWT_SECRET') return 'access-secret';
        return undefined;
      }),
    } as any;

    const service = new AuthService(db, jwtService, configService);
    return { service, jwtService };
  };

  it('emits normalized admin claims and handoff permissions', async () => {
    const { service, jwtService } = createService();

    await (service as any).generateTokens({
      id: 'u-admin',
      email: 'admin@tnf.ai',
      username: 'admin',
      name: 'Admin',
      role: 'ADMIN',
      roles: ['ADMIN'],
      emailVerified: true,
      isActive: true,
    });

    const payload = jwtService.signAsync.mock.calls[0][0];
    expect(payload.roles).toEqual(expect.arrayContaining(['ADMIN', 'admin']));
    expect(payload.permissions).toEqual(
      expect.arrayContaining([
        'admin:access',
        'handoff:publish',
        'handoff:read:any',
        'handoff:ack:any',
      ])
    );
    expect(payload.permissions).not.toContain('system:access');
  });

  it('expands super admin into admin/system claims', async () => {
    const { service, jwtService } = createService();

    await (service as any).generateTokens({
      id: 'u-root',
      email: 'root@tnf.ai',
      username: 'root',
      name: 'Root',
      role: 'SUPER_ADMIN',
      roles: ['SUPER_ADMIN'],
      emailVerified: true,
      isActive: true,
    });

    const payload = jwtService.signAsync.mock.calls[0][0];
    expect(payload.roles).toEqual(
      expect.arrayContaining(['SUPER_ADMIN', 'super_admin', 'admin', 'system'])
    );
    expect(payload.permissions).toEqual(
      expect.arrayContaining([
        'system:access',
        'admin:access',
        'handoff:publish',
        'handoff:read:any',
        'handoff:ack:any',
      ])
    );
  });

  it('elevates configured master super admin email to SUPER_ADMIN claims', async () => {
    const { service, jwtService } = createService();

    await (service as any).generateTokens({
      id: 'u-master',
      email: 'owner@example.com',
      username: 'bizsynth',
      name: 'Master',
      role: 'USER',
      roles: ['USER'],
      emailVerified: true,
      isActive: true,
    });

    const payload = jwtService.signAsync.mock.calls[0][0];
    expect(payload.roles).toEqual(
      expect.arrayContaining(['SUPER_ADMIN', 'super_admin', 'admin', 'system'])
    );
    expect(payload.permissions).toEqual(expect.arrayContaining(['system:access', 'admin:access']));
  });

  it('preserves explicit user permissions while avoiding admin grants for regular users', async () => {
    const { service, jwtService } = createService();

    await (service as any).generateTokens({
      id: 'u-agent',
      email: 'agent@tnf.ai',
      username: 'agent',
      name: 'Agent',
      role: 'USER',
      roles: ['USER'],
      permissions: ['handoff:publish'],
      emailVerified: true,
      isActive: true,
    });

    const payload = jwtService.signAsync.mock.calls[0][0];
    expect(payload.roles).toEqual(expect.arrayContaining(['USER', 'user']));
    expect(payload.permissions).toContain('handoff:publish');
    expect(payload.permissions).not.toContain('admin:access');
    expect(payload.permissions).not.toContain('system:access');
  });

  it('rejects registration when invite-only is enabled and invite code is missing', async () => {
    const db = {
      users: {
        findByEmail: jest.fn(),
        findByUsername: jest.fn(),
        create: jest.fn(),
      },
    } as any;
    const jwtService = {
      signAsync: jest.fn().mockResolvedValue('signed-token'),
    } as any;
    const configService = {
      get: jest.fn((key: string) => {
        if (key === 'AUTH_INVITE_ONLY') return 'true';
        if (key === 'AUTH_INVITE_CODES') return 'launch-1,launch-2';
        if (key === 'JWT_REFRESH_SECRET') return 'refresh-secret';
        return 'access-secret';
      }),
    } as any;
    const service = new AuthService(db, jwtService, configService);

    await expect(
      service.register({
        email: 'new@tnf.ai',
        password: 'StrongPass123!',
      } as any)
    ).rejects.toThrow('Valid invitation code is required');
    expect(db.users.findByEmail).not.toHaveBeenCalled();
  });

  it('accepts a DB-backed invite code when invite-only is enabled', async () => {
    const db = {
      users: {},
      client: {
        execute: jest.fn().mockResolvedValue([
          {
            id: 'inv-1',
            code: 'TNF-CORE-AB12CD',
            status: 'ACTIVE',
            used_count: 0,
            max_uses: 1,
            expires_at: null,
            federation_id: 'FED-42',
          },
        ]),
      },
    } as any;
    const jwtService = { signAsync: jest.fn().mockResolvedValue('signed-token') } as any;
    const configService = {
      get: jest.fn((key: string) => {
        if (key === 'AUTH_INVITE_ONLY') return 'true';
        return 'access-secret';
      }),
    } as any;
    const service = new AuthService(db, jwtService, configService);

    const validated = await (service as any).verifyInviteCodeIfEnabled('TNF-CORE-AB12CD');
    expect(validated).toMatchObject({
      code: 'TNF-CORE-AB12CD',
      source: 'db',
      inviteId: 'inv-1',
      federationId: 'FED-42',
    });
  });
});
