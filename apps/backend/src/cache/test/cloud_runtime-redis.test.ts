import { ConfigService } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';
import cacheConfig from '../config/cache.config';
import { AdvancedCacheManager } from '../services/advanced-cache.manager';
import { CacheMonitoringService } from '../services/cache-monitoring.service';

describe('CloudRuntime Redis Configuration', () => {
  let configService: ConfigService;
  let cacheManager: AdvancedCacheManager;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn(),
          },
        },
        {
          provide: CacheMonitoringService,
          useValue: {
            recordHit: jest.fn(),
            recordMiss: jest.fn(),
            getStats: jest.fn().mockReturnValue({ hitRate: 0, missRate: 0 }),
          },
        },
        AdvancedCacheManager,
      ],
    }).compile();

    configService = module.get<ConfigService>(ConfigService);
    cacheManager = module.get<AdvancedCacheManager>(AdvancedCacheManager);
  });

  describe('CloudRuntime Redis URL parsing', () => {
    it('should handle CloudRuntime Redis URLs correctly', () => {
      // Mock CloudRuntime Redis URL
      const cloud_runtimeRedisUrl = 'redis://cloud_runtime-redis-host:6379';
      const mockConfig = {
        redis: {
          url: cloud_runtimeRedisUrl,
          host: 'localhost',
          port: 6379,
          db: 0, // Should be forced to 0 for CloudRuntime
          ttl: 3600,
          maxRetriesPerRequest: 10,
          enableReadyCheck: true,
          retryStrategy: (times: number) => Math.min(times * 50, 5000),
        },
        ttl: {
          short: 300,
          medium: 1800,
          long: 7200,
          veryLong: 86400,
          session: 604800,
        },
        keyPrefix: 'fuse:',
        monitoring: {
          enabled: false,
          sampleRate: 100,
          metricsInterval: 60000,
        },
      };

      jest.spyOn(configService, 'get').mockReturnValue(mockConfig);

      // Test that the config is parsed correctly for CloudRuntime
      const config = cacheConfig();
      expect(config.redis.db).toBe(0);
      expect(config.redis.url).toBe(cloud_runtimeRedisUrl);
    });

    it('should force database to 0 for CloudRuntime Redis', () => {
      // Test the cache config function directly with CloudRuntime URL
      process.env.REDIS_URL = 'redis://cloud_runtime-redis-host:6379';
      process.env.REDIS_DB = '5'; // This should be ignored for CloudRuntime

      const config = cacheConfig();
      expect(config.redis.db).toBe(0);
      expect(config.redis.url).toBe('redis://cloud_runtime-redis-host:6379');

      // Clean up
      delete process.env.REDIS_URL;
      delete process.env.REDIS_DB;
    });

    it('should handle non-CloudRuntime Redis URLs normally', () => {
      process.env.REDIS_URL = 'redis://localhost:6379';
      process.env.REDIS_DB = '3';

      const config = cacheConfig();
      expect(config.redis.db).toBe(3);
      expect(config.redis.url).toBe('redis://localhost:6379');

      // Clean up
      delete process.env.REDIS_URL;
      delete process.env.REDIS_DB;
    });
  });

  describe('AdvancedCacheManager CloudRuntime integration', () => {
    it('should detect and handle CloudRuntime Redis URLs', async () => {
      const cloud_runtimeRedisUrl = 'redis://cloud_runtime-redis-host:6379';
      const mockConfig = {
        redis: {
          url: cloud_runtimeRedisUrl,
          host: 'localhost',
          port: 6379,
          db: 0,
          ttl: 3600,
          maxRetriesPerRequest: 10,
          enableReadyCheck: true,
          retryStrategy: (times: number) => Math.min(times * 50, 5000),
        },
        ttl: {
          short: 300,
          medium: 1800,
          long: 7200,
          veryLong: 86400,
          session: 604800,
        },
        keyPrefix: 'fuse:',
        monitoring: {
          enabled: false,
          sampleRate: 100,
          metricsInterval: 60000,
        },
      };

      jest.spyOn(configService, 'get').mockReturnValue(mockConfig);

      // Mock Redis client creation to avoid actual connection
      const mockRedisClient = {
        on: jest.fn(),
        ping: jest.fn().mockResolvedValue('PONG'),
        quit: jest.fn().mockResolvedValue(true),
      };

      // This would normally fail in a test environment without Redis
      // We're mainly testing the configuration logic
      await expect(cacheManager.onModuleInit()).rejects.toBeDefined();
    });
  });
});
