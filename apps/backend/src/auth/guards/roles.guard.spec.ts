import { Test, TestingModule } from '@nestjs/testing';
import { RolesGuard } from './roles.guard';
import { Reflector } from '@nestjs/core';
import { drizzleUserRepository } from '@the-new-fuse/database';
import { ExecutionContext } from '@nestjs/common';

jest.mock('@the-new-fuse/database', () => ({
  drizzleUserRepository: {
    findById: jest.fn(),
  },
}));

describe('RolesGuard', () => {
  let guard: RolesGuard;
  let reflector: Reflector;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RolesGuard,
        {
          provide: Reflector,
          useValue: {
            get: jest.fn(),
          },
        },
      ],
    }).compile();

    guard = module.get<RolesGuard>(RolesGuard);
    reflector = module.get<Reflector>(Reflector);
    
    (drizzleUserRepository.findById as jest.Mock).mockReset();
  });

  const createMockContext = (user: any) => {
    return {
      getHandler: jest.fn(),
      switchToHttp: jest.fn().mockReturnValue({
        getRequest: jest.fn().mockReturnValue({ user }),
      }),
    } as unknown as ExecutionContext;
  };

  it('should be defined', () => {
    expect(guard).toBeDefined();
  });

  it('should allow access if no roles are required', async () => {
    (reflector.get as jest.Mock).mockReturnValue(undefined);
    const context = createMockContext({ id: 'user1' });
    expect(await guard.canActivate(context)).toBe(true);
  });

  it('should allow SUPER_ADMIN to access admin route', async () => {
    (reflector.get as jest.Mock).mockReturnValue(['admin']);
    const context = createMockContext({ id: 'superadmin' });
    (drizzleUserRepository.findById as jest.Mock).mockResolvedValue({
      id: 'superadmin',
      role: 'SUPER_ADMIN',
    });

    expect(await guard.canActivate(context)).toBe(true);
  });

  it('should allow case-insensitive role match', async () => {
    (reflector.get as jest.Mock).mockReturnValue(['admin']);
    const context = createMockContext({ id: 'admin' });
    (drizzleUserRepository.findById as jest.Mock).mockResolvedValue({
      id: 'admin',
      role: 'ADMIN', // Uppercase in DB
    });

    // Decorator uses 'admin' (lowercase), DB has 'ADMIN'
    expect(await guard.canActivate(context)).toBe(true);
  });

  it('should deny if role does not match', async () => {
    (reflector.get as jest.Mock).mockReturnValue(['admin']);
    const context = createMockContext({ id: 'user' });
    (drizzleUserRepository.findById as jest.Mock).mockResolvedValue({
      id: 'user',
      role: 'USER',
    });

    expect(await guard.canActivate(context)).toBe(false);
  });

  it('should work with roles array in user object', async () => {
    (reflector.get as jest.Mock).mockReturnValue(['editor']);
    const context = createMockContext({ id: 'editor' });
    (drizzleUserRepository.findById as jest.Mock).mockResolvedValue({
      id: 'editor',
      role: 'USER',
      roles: ['USER', 'EDITOR'], // Uppercase in DB
    });

    expect(await guard.canActivate(context)).toBe(true);
  });
});
