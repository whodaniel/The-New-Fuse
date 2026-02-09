import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { UnifiedRedisService } from './UnifiedRedisService';
import { RedisConfig } from './RedisConfig';

describe('UnifiedRedisService', () => {
  let service: UnifiedRedisService;
  let module: TestingModule;

  const mockConfigService = {
    get: jest.fn((key: string, defaultValue?: any) => {
      const config = {
        'REDIS_HOST': 'localhost',
        'REDIS_PORT': 6379,
        'REDIS_PASSWORD': '',
        'REDIS_DB': 0,
        'REDIS_POOL_SIZE': 10,
        'REDIS_RETRY_ATTEMPTS': 3,
        'REDIS_RETRY_DELAY': 1000,
        'REDIS_CONNECT_TIMEOUT': 10000,
        'REDIS_LAZY_CONNECT': true,
      };
      return config[key] ?? defaultValue;
    }),
  };

  beforeEach(async () => {
    module = await Test.createTestingModule({
      providers: [
        UnifiedRedisService,
        RedisConfig,
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
        {
          provide: 'REDIS_CONFIG_OPTIONS',
          useValue: {},
        },
      ],
    }).compile();

    service = module.get<UnifiedRedisService>(UnifiedRedisService);
  });

  afterEach(async () => {
    await module.close();
  });

  describe('Service Creation', () => {
    it('should be defined', () => {
      expect(service).toBeDefined();
    });

    it('should have proper configuration access', () => {
      const redisConfig = module.get<RedisConfig>(RedisConfig);
      expect(redisConfig).toBeDefined();
      const config = redisConfig.getConfiguration();
      expect(config.host).toBe('localhost');
      expect(config.port).toBe(6379);
      expect(config.db).toBe(0);
      expect(config.poolSize).toBe(10);
    });
  });

  describe('Service Methods', () => {
    it('should have all required cache methods', () => {
      expect(typeof service.set).toBe('function');
      expect(typeof service.get).toBe('function');
      expect(typeof service.del).toBe('function');
      expect(typeof service.exists).toBe('function');
    });

    it('should have queue management methods', () => {
      expect(typeof service.enqueue).toBe('function');
      expect(typeof service.dequeue).toBe('function');
      expect(typeof service.llen).toBe('function'); // Queue length via list length
    });

    it('should have pub/sub methods', () => {
      expect(typeof service.publish).toBe('function');
      expect(typeof service.subscribe).toBe('function');
      expect(typeof service.unsubscribe).toBe('function');
      expect(typeof service.psubscribe).toBe('function'); // Pattern subscribe
    });

    it('should have search capabilities', () => {
      expect(typeof service.vectorSet).toBe('function');
      expect(typeof service.vectorSearch).toBe('function');
      expect(typeof service.vectorGet).toBe('function');
    });
  });

  describe('Health and Metrics', () => {
    it('should provide health check method', async () => {
      const health = await service.getHealth();
      expect(health).toHaveProperty('status');
      expect(['healthy', 'unhealthy', 'degraded']).toContain(health.status);
    });

    it('should provide metrics method', () => {
      expect(typeof service.getMetrics).toBe('function');
      const metrics = service.getMetrics();
      expect(typeof metrics).toBe('object');
    });

    it('should provide operation logs method', () => {
      expect(typeof service.getOperationLogs).toBe('function');
      const logs = service.getOperationLogs();
      expect(Array.isArray(logs)).toBe(true);
    });
  });
});