
import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { JwtService } from '@nestjs/jwt';
import { LoggingService } from '../services/logging.service';
import { EventBus } from '../events/event-bus.service';
import { IdentityService } from '../services/identity.service';
import { ConfigService } from '@nestjs/config';
import { UnauthorizedException } from '@nestjs/common';
import { drizzleUserRepository } from '@the-new-fuse/database';

// Mock dependencies
jest.mock('@the-new-fuse/database', () => ({
  drizzleUserRepository: {
    findByEmail: jest.fn(),
    findById: jest.fn(),
    findByWalletAddress: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
  },
}));

// Mock firebase-admin
const mockVerifyIdToken = jest.fn();
jest.mock('firebase-admin', () => ({
  apps: [{}], // Mock as initialized
  initializeApp: jest.fn(),
  credential: {
    cert: jest.fn(),
  },
  auth: () => ({
    verifyIdToken: mockVerifyIdToken,
  }),
}));

describe('AuthService Token Validation', () => {
  let service: AuthService;
  let jwtService: JwtService;

  beforeEach(async () => {
    // Reset mocks
    (drizzleUserRepository.findByEmail as jest.Mock).mockReset();
    (drizzleUserRepository.findById as jest.Mock).mockReset();
    mockVerifyIdToken.mockReset();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: JwtService,
          useValue: {
            // verify throws error to simulate invalid signature/unknown secret
            verify: jest.fn().mockImplementation(() => {
              throw new Error('invalid signature');
            }),
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
          useValue: {
            get: jest.fn().mockReturnValue('mock-value'), // Mock config for firebase init
          },
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    jwtService = module.get<JwtService>(JwtService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should throw UnauthorizedException when token signature is invalid', async () => {
    // Construct a forged token
    // Payload: {"email": "victim@example.com", "sub": "victim-id"}
    const payload = JSON.stringify({ email: 'victim@example.com', sub: 'victim-id' });
    const encodedPayload = Buffer.from(payload).toString('base64').replace(/=/g, '');
    const forgedToken = `header.${encodedPayload}.fakeSignature`;

    // Mock DB to return a user if queried by email (simulating existing user)
    (drizzleUserRepository.findByEmail as jest.Mock).mockResolvedValue({
      id: 'victim-id',
      email: 'victim@example.com',
      name: 'Victim User',
      role: 'user',
      isActive: true,
    });

    // Mock verifyIdToken to fail (since it's not a valid Firebase token either)
    mockVerifyIdToken.mockRejectedValue(new Error('Invalid firebase token'));

    // Attempt to call the method
    const call = service.resolveCurrentUserFromAuthHeader(`Bearer ${forgedToken}`);

    // Assert that it rejects with UnauthorizedException
    // This confirms that we are NOT falling back to insecure decoding
    await expect(call).rejects.toThrow(UnauthorizedException);
  });

  it('should successfully authenticate with a valid Firebase token', async () => {
    const validFirebaseToken = 'valid.firebase.token';
    const decodedToken = {
      email: 'firebase@example.com',
      name: 'Firebase User',
      uid: 'firebase-uid'
    };

    // Mock JWT verify to fail (it's not a local token)
    // (Already mocked in beforeEach)

    // Mock Firebase verification to succeed
    mockVerifyIdToken.mockResolvedValue(decodedToken);

    // Mock DB to return user
    (drizzleUserRepository.findByEmail as jest.Mock).mockResolvedValue({
      id: 'firebase-user-id',
      email: 'firebase@example.com',
      name: 'Firebase User',
      role: 'user',
      isActive: true,
    });

    const result = await service.resolveCurrentUserFromAuthHeader(`Bearer ${validFirebaseToken}`);

    expect(result).toBeDefined();
    expect(result.email).toBe('firebase@example.com');
    expect(mockVerifyIdToken).toHaveBeenCalledWith(validFirebaseToken);
  });
});
