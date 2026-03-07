import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { JwtService } from '@nestjs/jwt';
import { LoggingService } from '../services/logging.service';
import { EventBus } from '../events/event-bus.service';
import { IdentityService } from '../services/identity.service';
import { ConfigService } from '@nestjs/config';
import { UnauthorizedException } from '@nestjs/common';
import { drizzleUserRepository } from '@the-new-fuse/database';
import * as admin from 'firebase-admin';

// Mock drizzleUserRepository
jest.mock('@the-new-fuse/database', () => ({
  drizzleUserRepository: {
    findByEmail: jest.fn(),
    findById: jest.fn(),
    create: jest.fn(),
    findByWalletAddress: jest.fn(),
    update: jest.fn(),
  },
}));

// Mock firebase-admin
const mockVerifyIdToken = jest.fn();
const mockAuth = jest.fn(() => ({
  verifyIdToken: mockVerifyIdToken,
}));

jest.mock('firebase-admin', () => {
  return {
    apps: [],
    initializeApp: jest.fn(() => ({
      auth: mockAuth,
    })),
    app: jest.fn(() => ({
      auth: mockAuth,
    })),
    credential: {
      cert: jest.fn(),
      applicationDefault: jest.fn(),
    },
    auth: mockAuth,
  };
});

describe('AuthService Reliability', () => {
  let service: AuthService;
  let jwtService: JwtService;

  const mockUser = {
    id: 'user-123',
    email: 'test@example.com',
    name: 'Test User',
    role: 'USER',
    roles: ['USER'],
    isActive: true,
    hashedPassword: 'hashed-password',
  };

  const mockAdminUser = {
    id: 'admin-123',
    email: 'admin@example.com',
    name: 'Admin User',
    role: 'SUPER_ADMIN',
    roles: ['SUPER_ADMIN'],
    isActive: true,
    hashedPassword: 'hashed-password',
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: JwtService,
          useValue: {
            sign: jest.fn(),
            verify: jest.fn(),
          },
        },
        {
          provide: LoggingService,
          useValue: {
            log: jest.fn(),
            error: jest.fn(),
            warn: jest.fn(),
          },
        },
        {
          provide: EventBus,
          useValue: {
            publish: jest.fn(),
          },
        },
        {
          provide: IdentityService,
          useValue: {
            mintMachineID: jest.fn(),
          },
        },
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn((key) => {
              if (key === 'FIREBASE_PROJECT_ID') return 'test-project';
              return null;
            }),
          },
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    jwtService = module.get<JwtService>(JwtService);

    // Reset mocks
    mockVerifyIdToken.mockReset();
    (drizzleUserRepository.findByEmail as jest.Mock).mockReset();
    (drizzleUserRepository.findById as jest.Mock).mockReset();
    (drizzleUserRepository.create as jest.Mock).mockReset();

    // Ensure firebase is "initialized" for the test
    Object.defineProperty(admin, 'apps', { get: () => ['app'] });
  });

  describe('validateFirebaseToken', () => {
    it('should validate a valid Firebase token and return existing user', async () => {
      const token = 'valid-firebase-token';
      const decodedToken = {
        uid: 'firebase-uid-123',
        email: 'test@example.com',
        name: 'Test User',
      };

      mockVerifyIdToken.mockResolvedValue(decodedToken);
      (drizzleUserRepository.findByEmail as jest.Mock).mockResolvedValue(mockUser);

      const result = await service.validateFirebaseToken(token);

      expect(mockVerifyIdToken).toHaveBeenCalledWith(token);
      expect(drizzleUserRepository.findByEmail).toHaveBeenCalledWith('test@example.com');
      expect(result.email).toEqual(mockUser.email);
    });

    it('should create a new user if not found (JIT provisioning)', async () => {
      const token = 'new-user-token';
      const decodedToken = {
        uid: 'firebase-uid-456',
        email: 'new@example.com',
        name: 'New User',
      };

      mockVerifyIdToken.mockResolvedValue(decodedToken);
      (drizzleUserRepository.findByEmail as jest.Mock).mockResolvedValue(null);
      (drizzleUserRepository.create as jest.Mock).mockResolvedValue({
        ...mockUser,
        id: 'new-user-id',
        email: 'new@example.com',
        name: 'New User',
      });

      const result = await service.validateFirebaseToken(token);

      expect(drizzleUserRepository.create).toHaveBeenCalledWith(expect.objectContaining({
        email: 'new@example.com',
        name: 'New User',
      }));
      expect(result.email).toBe('new@example.com');
    });

    it('should throw UnauthorizedException for invalid token', async () => {
      const token = 'invalid-token';
      mockVerifyIdToken.mockRejectedValue(new Error('Invalid token'));

      await expect(service.validateFirebaseToken(token)).rejects.toThrow(UnauthorizedException);
    });

    it('should throw UnauthorizedException if email is missing in token', async () => {
       const token = 'no-email-token';
       mockVerifyIdToken.mockResolvedValue({ uid: '123' }); // No email

       await expect(service.validateFirebaseToken(token)).rejects.toThrow(UnauthorizedException);
    });
  });

  describe('resolveCurrentUserFromAuthHeader', () => {
    it('should resolve user from valid internal JWT', async () => {
      const token = 'valid-jwt';
      const decoded = { sub: mockUser.id, email: mockUser.email, role: mockUser.role };

      (jwtService.verify as jest.Mock).mockReturnValue(decoded);
      (drizzleUserRepository.findByEmail as jest.Mock).mockResolvedValue(mockUser);

      const result = await service.resolveCurrentUserFromAuthHeader(`Bearer ${token}`);

      expect(jwtService.verify).toHaveBeenCalledWith(token);
      expect(result.id).toBe(mockUser.id);
      expect(result.role).toBe(mockUser.role);
    });

    it('should fall back to Firebase validation if internal JWT verification fails', async () => {
      const token = 'firebase-token';

      (jwtService.verify as jest.Mock).mockImplementation(() => {
        throw new Error('Invalid JWT');
      });

      // Mock Firebase validation success
      const decodedToken = {
        uid: 'firebase-uid-123',
        email: 'test@example.com',
      };
      mockVerifyIdToken.mockResolvedValue(decodedToken);
      (drizzleUserRepository.findByEmail as jest.Mock).mockResolvedValue(mockUser);

      const result = await service.resolveCurrentUserFromAuthHeader(`Bearer ${token}`);

      expect(mockVerifyIdToken).toHaveBeenCalledWith(token);
      expect(result.id).toBe(mockUser.id);
    });

    it('should preserve admin role session continuity', async () => {
      const token = 'admin-token';

      // Simulate internal JWT failure (e.g. expired or different signer)
      (jwtService.verify as jest.Mock).mockImplementation(() => {
        throw new Error('Invalid JWT');
      });

      // Valid Firebase token
      mockVerifyIdToken.mockResolvedValue({
        uid: 'admin-uid',
        email: 'admin@example.com',
      });

      // DB returns admin user
      (drizzleUserRepository.findByEmail as jest.Mock).mockResolvedValue(mockAdminUser);

      const result = await service.resolveCurrentUserFromAuthHeader(`Bearer ${token}`);

      expect(result.role).toBe('SUPER_ADMIN');
      expect(result.roles).toContain('SUPER_ADMIN');
    });

    it('should throw UnauthorizedException if both internal and Firebase validation fail', async () => {
       const token = 'bad-token';

       (jwtService.verify as jest.Mock).mockImplementation(() => { throw new Error('Bad JWT'); });
       mockVerifyIdToken.mockRejectedValue(new Error('Bad Firebase Token'));

       await expect(service.resolveCurrentUserFromAuthHeader(`Bearer ${token}`)).rejects.toThrow(UnauthorizedException);
    });
  });
});
