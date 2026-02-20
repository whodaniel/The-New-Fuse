
import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { JwtService } from '@nestjs/jwt';
import { LoggingService } from '../services/logging.service';
import { EventBus } from '../events/event-bus.service';
import { IdentityService } from '../services/identity.service';
import { ConfigService } from '@nestjs/config';
import { UnauthorizedException } from '@nestjs/common';
import { verifyMessage } from 'viem';
import { drizzleUserRepository } from '@the-new-fuse/database';

// We need to mock the module that exports drizzleUserRepository
jest.mock('@the-new-fuse/database', () => ({
  drizzleUserRepository: {
    findByWalletAddress: jest.fn(),
    findByEmail: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
  },
}));

jest.mock('viem', () => ({
  verifyMessage: jest.fn(),
  // verifyMessage is named export, we mock it.
  // Address and Hex are types so they don't need mocking but strict ESM might complain if not exported.
  // However, types are erased at runtime so it should be fine.
}));

// Mock firebase-admin
const mockVerifyIdToken = jest.fn();
jest.mock('firebase-admin', () => ({
  apps: [],
  initializeApp: jest.fn(),
  credential: {
    applicationDefault: jest.fn(),
  },
  auth: () => ({
    verifyIdToken: mockVerifyIdToken,
  }),
}));

describe('AuthService Security', () => {
  let service: AuthService;
  let mockVerifyMessage: jest.Mock;

  beforeEach(async () => {
    mockVerifyIdToken.mockReset();
    // Reset verifyMessage mock
    mockVerifyMessage = verifyMessage as unknown as jest.Mock;
    mockVerifyMessage.mockClear();

    // Reset drizzle mock
    (drizzleUserRepository.findByWalletAddress as jest.Mock).mockReset();
    (drizzleUserRepository.findByEmail as jest.Mock).mockReset();
    (drizzleUserRepository.create as jest.Mock).mockReset();
    (drizzleUserRepository.update as jest.Mock).mockReset();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: JwtService,
          useValue: { sign: jest.fn() },
        },
        {
          provide: LoggingService,
          useValue: { log: jest.fn(), error: jest.fn(), warn: jest.fn() },
        },
        {
          provide: EventBus,
          useValue: { publish: jest.fn() },
        },
        {
          provide: IdentityService,
          useValue: { mintMachineID: jest.fn() },
        },
        {
          provide: ConfigService,
          useValue: { get: jest.fn() },
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should throw UnauthorizedException if signature verification fails (returns false)', async () => {
    mockVerifyMessage.mockResolvedValue(false);

    await expect(
      service.findOrCreateUnstoppableDomainsUser(
        'domain.crypto',
        '0x123',
        'message',
        'bad_signature'
      )
    ).rejects.toThrow(UnauthorizedException);

    expect(mockVerifyMessage).toHaveBeenCalledWith({
      address: '0x123',
      message: 'message',
      signature: 'bad_signature',
    });
  });

  it('should throw UnauthorizedException if signature verification throws error', async () => {
    mockVerifyMessage.mockRejectedValue(new Error('Some error'));

    await expect(
      service.findOrCreateUnstoppableDomainsUser(
        'domain.crypto',
        '0x123',
        'message',
        'bad_signature'
      )
    ).rejects.toThrow(UnauthorizedException);
  });

  it('should proceed if signature is valid', async () => {
    mockVerifyMessage.mockResolvedValue(true);

    // Mock user repository to return a user so we don't hit create logic
    (drizzleUserRepository.findByWalletAddress as jest.Mock).mockResolvedValue({
      id: 'user1',
      name: 'domain.crypto',
      email: 'domain.crypto@unstoppabledomains.com',
      hashedPassword: '',
      walletAddress: '0x123',
    });

    const result = await service.findOrCreateUnstoppableDomainsUser(
      'domain.crypto',
      '0x123',
      'message',
      'good_signature'
    );

    expect(result).toBeDefined();
    expect(result.id).toBe('user1');
    expect(mockVerifyMessage).toHaveBeenCalledWith({
      address: '0x123',
      message: 'message',
      signature: 'good_signature',
    });
  });

  describe('validateFirebaseToken', () => {
    it('should throw UnauthorizedException if token is invalid', async () => {
      mockVerifyIdToken.mockRejectedValue(new Error('Invalid token'));

      await expect(service.validateFirebaseToken('bad_token')).rejects.toThrow(
        UnauthorizedException
      );
    });

    it('should create new user if not exists', async () => {
      mockVerifyIdToken.mockResolvedValue({
        uid: 'firebase_uid',
        email: 'new@example.com',
        email_verified: true,
      });

      (drizzleUserRepository.findByEmail as jest.Mock).mockResolvedValue(null);
      (drizzleUserRepository.create as jest.Mock).mockResolvedValue({
        id: 'new_user_id',
        email: 'new@example.com',
        role: 'USER',
        roles: ['USER'],
        isActive: true,
      });

      const result = await service.validateFirebaseToken('good_token');

      expect(result.id).toBe('new_user_id');
      expect(drizzleUserRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          email: 'new@example.com',
          emailVerified: true,
        })
      );
    });

    it('should return existing user', async () => {
      mockVerifyIdToken.mockResolvedValue({
        uid: 'firebase_uid',
        email: 'existing@example.com',
      });

      (drizzleUserRepository.findByEmail as jest.Mock).mockResolvedValue({
        id: 'existing_user_id',
        email: 'existing@example.com',
        role: 'ADMIN',
        roles: ['ADMIN'],
        isActive: true,
      });

      const result = await service.validateFirebaseToken('good_token');

      expect(result.id).toBe('existing_user_id');
      expect(result.role).toBe('ADMIN');
      expect(drizzleUserRepository.create).not.toHaveBeenCalled();
    });
  });
});
