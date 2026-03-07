/* eslint-disable @typescript-eslint/no-require-imports */
import { ConfigService } from '@nestjs/config';
import { RailwayConfigService } from '../config/railway.config';

describe('RailwayConfigService', () => {
  let configService: ConfigService;
  let railwayConfigService: RailwayConfigService;

  beforeEach(() => {
    // Mock ConfigService
    configService = {
      get: jest.fn((key: string) => {
        const mockEnv: Record<string, string> = {
          DATABASE_URL: 'postgresql://user:password@db.railway.internal:5432/database',
          REDIS_URL: 'redis://redis.railway.internal:6379',
          RAILWAY_ENVIRONMENT: 'true',
          RAILWAY_SERVICE_NAME: 'the-new-fuse-api',
          RAILWAY_PROJECT_ID: '12345',
        };
        return mockEnv[key];
      }),
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } as any;

    railwayConfigService = new RailwayConfigService(configService);
  });

  describe('getDatabaseUrl', () => {
    it('should return the DATABASE_URL from environment', () => {
      const url = railwayConfigService.getDatabaseUrl();
      expect(url).toBe('postgresql://user:password@db.railway.internal:5432/database');
    });

    it('should throw error if DATABASE_URL is missing', () => {
      jest.spyOn(configService, 'get').mockReturnValueOnce(undefined);
      expect(() => railwayConfigService.getDatabaseUrl()).toThrow(
        'DATABASE_URL is required in Railway environment'
      );
    });

    it('should validate DATABASE_URL format', () => {
      jest.spyOn(configService, 'get').mockReturnValueOnce('invalid-url');
      expect(() => railwayConfigService.getDatabaseUrl()).toThrow(
        'DATABASE_URL must be a valid PostgreSQL connection string'
      );
    });
  });

  describe('getRedisUrl', () => {
    it('should return REDIS_URL if available', () => {
      const url = railwayConfigService.getRedisUrl();
      expect(url).toBe('redis://redis.railway.internal:6379');
    });

    it('should fallback to individual Redis config if REDIS_URL is missing', () => {
      jest.spyOn(configService, 'get').mockImplementation((key: string) => {
        if (key === 'REDIS_URL') return undefined;
        if (key === 'REDIS_HOST') return 'localhost';
        if (key === 'REDIS_PORT') return '6379';
        return undefined;
      });

      const url = railwayConfigService.getRedisUrl();
      expect(url).toBe(
        'redis://default:mDNmtwseaVHcQsCHaIoZapjlWrvAjtot@tramway.proxy.rlwy.net:13570'
      );
    });

    it('should validate REDIS_URL format', () => {
      jest.spyOn(configService, 'get').mockReturnValueOnce('invalid-redis-url');
      expect(() => railwayConfigService.getRedisUrl()).toThrow(
        'REDIS_URL must be a valid Redis connection string'
      );
    });

    it('should detect and handle Railway Redis URLs', () => {
      // Test with a Railway-specific Redis URL
      jest.spyOn(configService, 'get').mockReturnValueOnce('redis://redis-12345.upstash.io:6379');

      const url = railwayConfigService.getRedisUrl();
      expect(url).toBe('redis://redis-12345.upstash.io:6379');
    });
  });

  describe('getRailwayConfig', () => {
    it('should return complete Railway configuration', () => {
      const config = railwayConfigService.getRailwayConfig();
      expect(config).toEqual({
        databaseUrl: 'postgresql://user:password@db.railway.internal:5432/database',
        redisUrl: 'redis://redis.railway.internal:6379',
        isRailwayEnvironment: true,
        serviceName: 'the-new-fuse-api',
        projectId: '12345',
      });
    });
  });
});

describe('validateRailwayEnvironment', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    jest.resetModules();
    process.env = { ...originalEnv };
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  it('should pass validation with all required variables', () => {
    process.env.DATABASE_URL = 'postgresql://user:password@db.railway.internal:5432/database';
    process.env.REDIS_URL = 'redis://redis.railway.internal:6379';
    process.env.JWT_SECRET = 'very-long-secret-key-that-is-more-than-32-characters';
    process.env.JWT_REFRESH_SECRET = 'another-very-long-secret-key-for-refresh-tokens';

    expect(() => {
      const { validateRailwayEnvironment } = require('../config/railway.config');
      validateRailwayEnvironment();
    }).not.toThrow();
  });

  it('should fail validation with missing DATABASE_URL', () => {
    process.env.REDIS_URL = 'redis://redis.railway.internal:6379';
    process.env.JWT_SECRET = 'very-long-secret-key-that-is-more-than-32-characters';
    process.env.JWT_REFRESH_SECRET = 'another-very-long-secret-key-for-refresh-tokens';

    expect(() => {
      const { validateRailwayEnvironment } = require('../config/railway.config');
      validateRailwayEnvironment();
    }).toThrow('Missing required Railway environment variable: DATABASE_URL');
  });

  it('should fail validation with missing REDIS_URL', () => {
    process.env.DATABASE_URL = 'postgresql://user:password@db.railway.internal:5432/database';
    process.env.JWT_SECRET = 'very-long-secret-key-that-is-more-than-32-characters';
    process.env.JWT_REFRESH_SECRET = 'another-very-long-secret-key-for-refresh-tokens';

    expect(() => {
      const { validateRailwayEnvironment } = require('../config/railway.config');
      validateRailwayEnvironment();
    }).toThrow('Missing required Railway environment variable: REDIS_URL');
  });
});
