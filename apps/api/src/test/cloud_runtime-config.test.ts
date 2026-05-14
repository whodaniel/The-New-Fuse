/* eslint-disable @typescript-eslint/no-require-imports */
import { ConfigService } from '@nestjs/config';
import { CloudRuntimeConfigService } from '../config/cloud_runtime.config';

describe('CloudRuntimeConfigService', () => {
  let configService: ConfigService;
  let cloud_runtimeConfigService: CloudRuntimeConfigService;

  beforeEach(() => {
    // Mock ConfigService
    configService = {
      get: jest.fn((key: string) => {
        const mockEnv: Record<string, string> = {
          DATABASE_URL: 'postgresql://user:password@db.cloud_runtime.internal:5432/database',
          REDIS_URL: 'redis://redis.cloud_runtime.internal:6379',
          CLOUD_RUNTIME_ENVIRONMENT: 'true',
          CLOUD_RUNTIME_SERVICE_NAME: 'the-new-fuse-api',
          CLOUD_RUNTIME_PROJECT_ID: '12345',
        };
        return mockEnv[key];
      }),
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } as any;

    cloud_runtimeConfigService = new CloudRuntimeConfigService(configService);
  });

  describe('getDatabaseUrl', () => {
    it('should return the DATABASE_URL from environment', () => {
      const url = cloud_runtimeConfigService.getDatabaseUrl();
      expect(url).toBe('postgresql://user:password@db.cloud_runtime.internal:5432/database');
    });

    it('should throw error if DATABASE_URL is missing', () => {
      jest.spyOn(configService, 'get').mockReturnValueOnce(undefined);
      expect(() => cloud_runtimeConfigService.getDatabaseUrl()).toThrow(
        'DATABASE_URL is required in CloudRuntime environment'
      );
    });

    it('should validate DATABASE_URL format', () => {
      jest.spyOn(configService, 'get').mockReturnValueOnce('invalid-url');
      expect(() => cloud_runtimeConfigService.getDatabaseUrl()).toThrow(
        'DATABASE_URL must be a valid PostgreSQL connection string'
      );
    });
  });

  describe('getRedisUrl', () => {
    it('should return REDIS_URL if available', () => {
      const url = cloud_runtimeConfigService.getRedisUrl();
      expect(url).toBe('redis://redis.cloud_runtime.internal:6379');
    });

    it('should fallback to individual Redis config if REDIS_URL is missing', () => {
      jest.spyOn(configService, 'get').mockImplementation((key: string) => {
        if (key === 'REDIS_URL') return undefined;
        if (key === 'REDIS_HOST') return 'localhost';
        if (key === 'REDIS_PORT') return '6379';
        return undefined;
      });

      const url = cloud_runtimeConfigService.getRedisUrl();
      expect(url).toBe('redis://localhost:6379');
    });

    it('should validate REDIS_URL format', () => {
      jest.spyOn(configService, 'get').mockReturnValueOnce('invalid-redis-url');
      expect(() => cloud_runtimeConfigService.getRedisUrl()).toThrow(
        'REDIS_URL must be a valid Redis connection string'
      );
    });

    it('should detect and handle CloudRuntime Redis URLs', () => {
      // Test with a CloudRuntime-specific Redis URL
      jest.spyOn(configService, 'get').mockReturnValueOnce('redis://redis-12345.upstash.io:6379');

      const url = cloud_runtimeConfigService.getRedisUrl();
      expect(url).toBe('redis://redis-12345.upstash.io:6379');
    });
  });

  describe('getCloudRuntimeConfig', () => {
    it('should return complete CloudRuntime configuration', () => {
      const config = cloud_runtimeConfigService.getCloudRuntimeConfig();
      expect(config).toEqual({
        databaseUrl: 'postgresql://user:password@db.cloud_runtime.internal:5432/database',
        redisUrl: 'redis://redis.cloud_runtime.internal:6379',
        isCloudRuntimeEnvironment: true,
        serviceName: 'the-new-fuse-api',
        projectId: '12345',
      });
    });
  });
});

describe('validateCloudRuntimeEnvironment', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    jest.resetModules();
    process.env = { ...originalEnv };
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  it('should pass validation with all required variables', () => {
    process.env.DATABASE_URL = 'postgresql://user:password@db.cloud_runtime.internal:5432/database';
    process.env.REDIS_URL = 'redis://redis.cloud_runtime.internal:6379';
    process.env.JWT_SECRET = 'very-long-secret-key-that-is-more-than-32-characters';
    process.env.JWT_REFRESH_SECRET = 'another-very-long-secret-key-for-refresh-tokens';

    expect(() => {
      const { validateCloudRuntimeEnvironment } = require('../config/cloud_runtime.config');
      validateCloudRuntimeEnvironment();
    }).not.toThrow();
  });

  it('should fail validation with missing DATABASE_URL', () => {
    process.env.REDIS_URL = 'redis://redis.cloud_runtime.internal:6379';
    process.env.JWT_SECRET = 'very-long-secret-key-that-is-more-than-32-characters';
    process.env.JWT_REFRESH_SECRET = 'another-very-long-secret-key-for-refresh-tokens';

    expect(() => {
      const { validateCloudRuntimeEnvironment } = require('../config/cloud_runtime.config');
      validateCloudRuntimeEnvironment();
    }).toThrow('Missing required CloudRuntime environment variable: DATABASE_URL');
  });

  it('should fail validation with missing REDIS_URL', () => {
    process.env.DATABASE_URL = 'postgresql://user:password@db.cloud_runtime.internal:5432/database';
    process.env.JWT_SECRET = 'very-long-secret-key-that-is-more-than-32-characters';
    process.env.JWT_REFRESH_SECRET = 'another-very-long-secret-key-for-refresh-tokens';

    expect(() => {
      const { validateCloudRuntimeEnvironment } = require('../config/cloud_runtime.config');
      validateCloudRuntimeEnvironment();
    }).toThrow('Missing required CloudRuntime environment variable: REDIS_URL');
  });
});
