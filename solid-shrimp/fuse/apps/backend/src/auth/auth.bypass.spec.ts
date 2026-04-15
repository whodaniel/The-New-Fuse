
import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { JwtService } from '@nestjs/jwt';
import { LoggingService } from '../services/logging.service';
import { EventBus } from '../events/event-bus.service';
import { IdentityService } from '../services/identity.service';
import { ConfigService } from '@nestjs/config';
import { UnauthorizedException } from '@nestjs/common';
import { drizzleUserRepository } from '@the-new-fuse/database';
import * as jwt from 'jsonwebtoken';
import { TokenBlacklistService } from './token-blacklist.service';

// Mock the database repository
jest.mock('@the-new-fuse/database', () => ({
  drizzleUserRepository: {
    findByEmail: jest.fn(),
    findById: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
  },
}));

// We need a mutable mock for verifyIdToken
const mockVerifyIdToken = jest.fn();

// Mock firebase-admin
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

// Mock viem
jest.mock('viem', () => ({
  verifyMessage: jest.fn(),
}));


describe('AuthService Vulnerability Check', () => {
  let service: AuthService;
  let jwtService: JwtService;

  beforeEach(async () => {
    jest.clearAllMocks();
    mockVerifyIdToken.mockReset();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: JwtService,
          useValue: {
            verify: jest.fn(),
            sign: jest.fn(),
          },
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
        {
          provide: TokenBlacklistService,
          useValue: { blacklistToken: jest.fn(), isBlacklisted: jest.fn() },
        }
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    jwtService = module.get<JwtService>(JwtService);
  });

  it('CRITICAL: should NOT allow login with forged token when signature verification fails', async () => {
    // 1. Create a FORGED token (signed with a different key)
    const victimEmail = 'admin@example.com';
    const forgedToken = jwt.sign({ email: victimEmail, sub: 'admin-id' }, 'ATTACKER_KEY');

    // 2. Mock JwtService.verify to THROW (simulating signature mismatch)
    (jwtService.verify as jest.Mock).mockImplementation(() => {
      throw new Error('invalid signature');
    });

    // 3. Mock Firebase verifyIdToken to THROW (simulating invalid firebase token too)
    mockVerifyIdToken.mockRejectedValue(new Error('Invalid firebase token'));

    // 4. Mock database to return the victim user if asked
    (drizzleUserRepository.findByEmail as jest.Mock).mockResolvedValue({
      id: 'admin-id',
      email: victimEmail,
      role: 'ADMIN',
      roles: ['ADMIN'],
    });

    // 5. Attempt to resolve user
    // EXPECTATION: This should THROW UnauthorizedException.
    // The previous implementation would have bypassed this.
    await expect(
        service.resolveCurrentUserFromAuthHeader(`Bearer ${forgedToken}`)
    ).rejects.toThrow(UnauthorizedException);
  });
});
