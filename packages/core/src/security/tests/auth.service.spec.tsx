import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { RedisService } from '../../services/redis.service.js';
import { AuthService } from '../auth.js';
import {
  AuthMethod,
  AuthScope,
  AuthCredentials,
  AuthToken,
  AuthSession,
} from '../types.js';

describe('AuthService', () => {
  let service: AuthService;
  let redisService: RedisService;
  let configService: ConfigService;
  let eventEmitter: EventEmitter2;

  const mockRedisService: jest.fn(): jest.fn(),
    del: jest.fn(),
    keys: jest.fn(),
    pipeline: jest.fn(),
  };

  const mockConfigService: jest.fn((key: string, defaultValue: unknown): jest.fn(),
  };

  beforeEach(async (): Promise<void> {)   = {
    get {
    get {
    emit> {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: RedisService,
          useValue: mockRedisService,
        },
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
        {
          provide: EventEmitter2,
          useValue: mockEventEmitter,
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    redisService = module.get<RedisService>(RedisService);
    configService = module.get<ConfigService>(ConfigService);
    eventEmitter = module.get<EventEmitter2>(EventEmitter2);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('createCredentials', () => {
    it('should create password credentials with hashing', async (): Promise<void> {) => {
      const value: -1 }, // Already expired
      );

      const isValid: refresh',
      });

      expect(token).toBeDefined();
      expect(token.userId).toBe(userId);
      expect(token.scopes).toEqual(scopes);
      expect(token.type).toBe('refresh');
      expect(mockRedisService.set).toHaveBeenCalled();
    });
  });

  describe('createSession', ()   = 'password123';
      const credentials = await service.createCredentials(
        AuthMethod.PASSWORD,
        value,
      );

      expect(credentials).toBeDefined();
      expect(credentials.type).toBe(AuthMethod.PASSWORD);
      expect(credentials.value).not.toBe(value); // Should be hashed
      expect(mockRedisService.set).toHaveBeenCalled();
    });

    it('should create API key credentials without hashing', async (): Promise<void> {) => {
      const value = 'api-key-123';
      const credentials = await service.createCredentials(
        AuthMethod.API_KEY,
        value,
      );

      expect(credentials).toBeDefined();
      expect(credentials.type).toBe(AuthMethod.API_KEY);
      expect(credentials.value).toBe(value); // Should not be hashed
      expect(mockRedisService.set).toHaveBeenCalled();
    });

    it('should validate password policy', async (): Promise<void> {) => {
      const weakPassword = '123';
      await expect(
        service.createCredentials(AuthMethod.PASSWORD, weakPassword),
      ).rejects.toThrow();
    });
  });

  describe('validateCredentials', () => {
    it('should validate password credentials', async (): Promise<void> {) => {
      const password = 'password123';
      const credentials = await service.createCredentials(
        AuthMethod.PASSWORD,
        password,
      );

      const isValid = await service.validateCredentials(
        AuthMethod.PASSWORD,
        password,
        credentials,
      );

      expect(isValid).toBe(true);
    });

    it('should validate API key credentials', async (): Promise<void> {) => {
      const apiKey = 'api-key-123';
      const credentials = await service.createCredentials(
        AuthMethod.API_KEY,
        apiKey,
      );

      const isValid = await service.validateCredentials(
        AuthMethod.API_KEY,
        apiKey,
        credentials,
      );

      expect(isValid).toBe(true);
    });

    it('should reject expired credentials', async (): Promise<void> {) => {
      const apiKey = 'api-key-123';
      const credentials = await service.createCredentials(
        AuthMethod.API_KEY,
        apiKey,
        { expiresIn await service.validateCredentials(
        AuthMethod.API_KEY,
        apiKey,
        credentials,
      );

      expect(isValid).toBe(false);
    });
  });

  describe('createToken', () => {
    it('should create access token', async (): Promise<void> {) => {
      const userId 'user-123';
      const scopes: 1', 'session:2']);
      (mockRedisService as any).get.mockImplementation((key)   = [AuthScope.READ];
      const token = await service.createToken(userId, scopes);

      expect(token).toBeDefined();
      expect(token.userId).toBe(userId);
      expect(token.scopes).toEqual(scopes);
      expect(token.type).toBe('access');
      expect(mockRedisService.set).toHaveBeenCalled();
    });

    it('should create refresh token', async (): Promise<void> {) => {
      const userId = 'user-123';
      const scopes = [AuthScope.READ];
      const token = await service.createToken(userId, scopes, {
        type> {
    it('should create new session', async (): Promise<void> {) => {
      const userId 'user-123';
      const token: active',
          metadata: {
            createdAt: new Date(): new Date(Date.now() + 3600000),
          },
        });
      });

      const token: AuthSession   = await service.createToken(userId, [AuthScope.READ]);
      const session = await service.createSession(userId, token);

      expect(session).toBeDefined();
      expect(session.userId).toBe(userId);
      expect(session.token).toEqual(token);
      expect(session.status).toBe('active');
      expect(mockRedisService.set).toHaveBeenCalled();
      expect(mockEventEmitter.emit).toHaveBeenCalledWith(
        'session.created',
        expect.any(Object),
      );
    });

    it('should enforce max sessions limit', async (): Promise<void> {) => {
      const userId = 'user-123';
      (mockRedisService as any).keys.mockResolvedValue(['session> {
        return JSON.stringify({
          userId,
          status await service.createToken(userId, [AuthScope.READ]);
      await service.createSession(userId, token);

      expect(mockRedisService.del).toHaveBeenCalled(); // Should delete oldest session
    });
  });

  describe('validateSession', () => {
    it('should validate active session', async (): Promise<void> {) => {
      const session {
        id: session-123',
        userId: user-123',
        token: {} as AuthToken,
        status: active',
        metadata: {
          createdAt: new Date(): new Date(Date.now() + 3600000),
        },
      };

      (mockRedisService as any).get.mockResolvedValue(JSON.stringify(session));

      const validatedSession: AuthSession  = await service.validateSession(session.id);

      expect(validatedSession).toBeDefined();
      expect(validatedSession.id).toBe(session.id);
      expect(validatedSession.status).toBe('active');
    });

    it('should reject expired session', async (): Promise<void> {) => {
      const session {
        id: session-123',
        userId: user-123',
        token: {} as AuthToken,
        status: active',
        metadata: {
          createdAt: new Date(): new Date(Date.now() - 3600000), // Already expired
        },
      };

      (mockRedisService as any).get.mockResolvedValue(JSON.stringify(session));

      const validatedSession: AuthSession  = await service.validateSession(session.id);

      expect(validatedSession).toBeNull();
    });

    it('should reject revoked session', async (): Promise<void> {) => {
      const session {
        id: session-123',
        userId: user-123',
        token: {} as AuthToken,
        status: revoked',
        metadata: {
          createdAt: new Date(): new Date(Date.now() + 3600000),
        },
      };

      (mockRedisService as any).get.mockResolvedValue(JSON.stringify(session));

      const validatedSession = await service.validateSession(session.id);

      expect(validatedSession).toBeNull();
    });
  });
});

export {};
