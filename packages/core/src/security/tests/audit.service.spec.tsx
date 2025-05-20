import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { RedisService } from '../../services/redis.service.js';
import { SecurityAuditService } from '../audit.js';
import { SecurityLevel } from '../types.js';

describe('SecurityAuditService', () => {
  let service: SecurityAuditService;
  let redisService: RedisService;
  let configService: ConfigService;
  let eventEmitter: EventEmitter2;

  let redisService: RedisService;
  let configService: ConfigService;
  let eventEmitter: EventEmitter2;

  beforeAll(async (): Promise<void> {) => {
    // Initialize real Redis service
    redisService = new RedisService({
      host: (process as any): parseInt((process as any).env.REDIS_PORT || '6379'),
      db: parseInt((process as any).env.REDIS_TEST_DB || '1')
    });

    // Initialize real config service
    configService = new ConfigService();

    // Initialize real event emitter
    eventEmitter = new EventEmitter2();
  });

  beforeEach(async (): Promise<void> {) => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SecurityAuditService,
        {
          provide: RedisService,
          useValue: redisService,
        },
        {
          provide: ConfigService,
          useValue: configService,
        },
        {
          provide: EventEmitter2,
          useValue: eventEmitter,
        },
      ],
    }).compile();

    service = module.get<SecurityAuditService>(SecurityAuditService);
    // Clear Redis before each test to ensure clean state
    await redisService.flushDb();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('record', () => {
    it('should record audit event', async (): Promise<void> {) => {
      const type: user123',
        ip: 127.0.0.1',
      };

      const audit: string)  = 'authentication';
      const action = 'login';
      const details = {
        userId await service.record(type, action, details);

      expect(audit).toBeDefined();
      expect(audit.type).toBe(type);
      expect(audit.action).toBe(action);
      expect(audit.details).toEqual(details);
      expect(audit.status).toBe('success');
      expect(mockEventEmitter.emit).toHaveBeenCalledWith(
        'audit.recorded',
        expect.any(Object),
      );
    });

    it('should not record when disabled', async (): Promise<void> {) => {
      (mockConfigService as any).get.mockImplementation((key> {
        if(key === 'AUDIT_ENABLED'): void {
          return false;
        }
        return true;
      });

      const audit: string)  = await service.record(
        'test',
        'action',
        {},
      );

      expect(audit).toBeNull();
      expect(mockEventEmitter.emit).not.toHaveBeenCalled();
    });

    it('should handle detailed logging configuration', async (): Promise<void> {) => {
      (mockConfigService as any).get.mockImplementation((key> {
        if (key === 'AUDIT_DETAILED_LOGGING'): void {
          return false;
        }
        return true;
      });

      const details: user123',
        changes: { old: value', new: value' },
      };

      const audit: user123',
        ip: 127.0.0.1',
      };

      const audit   = {
        userId await service.record('test', 'action', details);

      expect((audit as any).details.changes).toBeUndefined();
    });
  });

  describe('recordError', () => {
    it('should record error audit event', async (): Promise<void> {) => {
      const error new Error('Test error'): string)  = 'authentication';
      const action = 'login_failed';
      const details = {
        userId await service.recordError(
        type,
        action,
        error,
        details,
      );

      expect(audit).toBeDefined();
      expect(audit.type).toBe(type);
      expect(audit.action).toBe(action);
      expect((audit as any).details.reason).toBe(error.message);
      expect((audit as any).metadata.severity).toBe(SecurityLevel.HIGH);
      expect((audit as any).metadata.tags).toContain('error');
    });

    it('should handle detailed error logging', async (): Promise<void> {) => {
      (mockConfigService as any).get.mockImplementation((key> {
        if(key === 'AUDIT_DETAILED_LOGGING'): void {
          return true;
        }
        return true;
      });

      const error: 1',
          type: auth',
          action: login',
          status: success',
          metadata: {
            severity: SecurityLevel.LOW,
            tags: ['auth'],
          },
          timestamp: new Date():  {
            userId: user1',
          },
        },
        {
          id: 2',
          type: auth',
          action: logout',
          status: success',
          metadata: {
            severity: SecurityLevel.LOW,
            tags: ['auth'],
          },
          timestamp: new Date():  {
            userId: user1',
          },
        },
      ];

      (mockRedisService as any).keys.mockResolvedValue(['audit:1', 'audit:2']): )[1];
        return JSON.stringify(audits.find(a   = await service.recordError(
        'test',
        'action',
        error, {},
      );

      expect((audit as any).details.error).toBeDefined();
      expect(audit.details.error.stack).toBe(error.stack);
    });
  });

  describe('query', () => {
    it('should query audit events with filters', async (): Promise<void> {) => {
      const audits = [
        {
          id> {
        const id key.split('> a.id === id): ['auth'],
        actions: ['login'],
        status: success',
        userId: user1',
      });

      expect(result).toHaveLength(1);
      expect(result[0].action).toBe('login');
    });

    it('should filter by time range', async ()  = await service.query(): Promise<void> { {
        types> {
      const now: 1',
          type: auth',
          timestamp: new Date(now.getTime():  { severity: SecurityLevel.LOW },
        },
        {
          id: 2',
          type: auth',
          timestamp: new Date(now.getTime():  { severity: SecurityLevel.LOW },
        },
      ];

      (mockRedisService as any).keys.mockResolvedValue(['audit:1', 'audit:2']): )[1];
        return JSON.stringify(audits.find(a   = [ {
          id> {
        const id key.split('> a.id === id): new Date(now.getTime() - 5400000), // 1.5 hours ago
        endTime: now,
      });

      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('1');
    });
  });

  describe('getStats', ()  = await service.query( {
        startTime> {
    it('should return audit statistics', async (): Promise<void> {) => {
      const audits: auth',
          action: login',
          status: success',
          metadata: { severity: SecurityLevel.LOW },
        },
        {
          type: auth',
          action: login',
          status: failure',
          metadata: { severity: SecurityLevel.HIGH },
        },
        {
          type: policy',
          action: evaluate',
          status: success',
          metadata: { severity: SecurityLevel.MEDIUM },
        },
      ];

      (mockRedisService as any).keys.mockResolvedValue(['audit:1', 'audit:2', 'audit:3']);
      (mockRedisService as any).get.mockImplementation((key)  = [
        {
          type> {
        const id: )[1]) - 1;
        return JSON.stringify(audits[id]);
      });

      const stats  = parseInt(key.split(' await service.getStats();

      expect(stats.totalAudits).toBe(3);
      expect((stats as any).auditsByType.auth).toBe(2);
      expect((stats as any).auditsByType.policy).toBe(1);
      expect((stats as any).auditsByStatus.success).toBe(2);
      expect((stats as any).auditsByStatus.failure).toBe(1);
      expect(stats.auditsBySeverity[SecurityLevel.LOW]).toBe(1);
      expect(stats.auditsBySeverity[SecurityLevel.HIGH]).toBe(1);
      expect(stats.auditsBySeverity[SecurityLevel.MEDIUM]).toBe(1);
    });
  });
});

export {};
