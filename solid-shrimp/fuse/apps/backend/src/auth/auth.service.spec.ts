import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { JwtService } from '@nestjs/jwt';
import { LoggingService } from '../services/logging.service';
import { EventBus } from '../events/event-bus.service';
import { IdentityService } from '../services/identity.service';
import { ConfigService } from '@nestjs/config';
import { UnauthorizedException } from '@nestjs/common';

// Mock firebase-admin
jest.mock('firebase-admin', () => {
  return {
    apps: [],
    credential: {
      cert: jest.fn(),
    },
    initializeApp: jest.fn(),
    auth: jest.fn().mockReturnValue({
      verifyIdToken: jest.fn(),
    }),
  };
});

// Mock drizzleUserRepository
jest.mock('@the-new-fuse/database', () => ({
  drizzleUserRepository: {
    findByEmail: jest.fn(),
    create: jest.fn(),
    findById: jest.fn(),
  },
}));

describe('AuthService', () => {
  let service: AuthService;
  let jwtService: JwtService;

  beforeEach(async () => {
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
              if (key === 'FIREBASE_CLIENT_EMAIL') return 'test@example.com';
              if (key === 'FIREBASE_PRIVATE_KEY') return 'test-key';
              return null;
            }),
          },
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    jwtService = module.get<JwtService>(JwtService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('validateFirebaseToken', () => {
    it('should validate token successfully', async () => {
      const admin = require('firebase-admin');

      // Mock apps property to simulate initialization
      // We need to redefine property because direct assignment to mocked object might not work if it's read-only
      // But in jest mock factory it's a plain object.
      // However, the service checks admin.apps.length

      // In the test setup, initializeFirebase is called in constructor.
      // And we mocked ConfigService to return values.
      // So initializeFirebase should have called initializeApp.
      // But admin.apps is mocked as [] initially.

      // We can manually set it for this test case
      Object.defineProperty(admin, 'apps', { get: () => ['app'] });

      const mockDecodedToken = { uid: 'test-uid', email: 'test@example.com' };
      admin.auth().verifyIdToken.mockResolvedValue(mockDecodedToken);

      const result = await service.validateFirebaseToken('valid-token');
      expect(result).toBe(mockDecodedToken);
      expect(admin.auth().verifyIdToken).toHaveBeenCalledWith('valid-token');
    });

    it('should throw UnauthorizedException if firebase not initialized', async () => {
      const admin = require('firebase-admin');
      Object.defineProperty(admin, 'apps', { get: () => [] });

      await expect(service.validateFirebaseToken('token')).rejects.toThrow(UnauthorizedException);
    });
  });
});
