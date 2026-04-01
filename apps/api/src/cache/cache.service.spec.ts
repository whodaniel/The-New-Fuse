import { afterEach, beforeEach, describe, expect, it, jest } from '@jest/globals';
import { ConfigService } from '@nestjs/config';
import { Redis } from 'ioredis';
import { CacheService } from './cache.service';

jest.mock('ioredis', () => {
  return {
    Redis: jest.fn().mockImplementation(() => ({
      on: jest.fn(),
      get: jest.fn(),
      set: jest.fn(),
    })),
  };
});

describe('CacheService', () => {
  let service: CacheService;
  let configService: ConfigService;

  const mockConfigService = {
    get: jest.fn(),
  };

  beforeEach(() => {
    // Reset the mock implementation before each test to ensure clean state
    mockConfigService.get.mockReset();

    // Default mock implementation to avoid "undefined" errors during construction
    mockConfigService.get.mockReturnValue(undefined);

    // Direct instantiation
    configService = mockConfigService as any;
    // We instantiate service in the tests to allow setting up configService before constructor runs
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    service = new CacheService(configService);
    expect(service).toBeDefined();
  });

  it('should handle standard redis url', () => {
    const url = 'redis://localhost:6379';
    mockConfigService.get.mockReturnValue(url);

    service = new CacheService(configService);

    expect(Redis).toHaveBeenCalledWith(url);
  });

  it('should handle duplicated redis url', () => {
    const url = 'redis://localhost:6379redis://localhost:6379';
    mockConfigService.get.mockReturnValue(url);

    service = new CacheService(configService);

    expect(Redis).toHaveBeenCalledWith('redis://localhost:6379');
  });

  it('should handle railway style duplication', () => {
    const url = 'redis://host:6379redis://host:6379';
    mockConfigService.get.mockReturnValue(url);

    service = new CacheService(configService);

    expect(Redis).toHaveBeenCalledWith('redis://host:6379');
  });

  it('should handle rediss (TLS)', () => {
    const url = 'rediss://user:pass@host:6379';
    mockConfigService.get.mockReturnValue(url);

    service = new CacheService(configService);

    expect(Redis).toHaveBeenCalledWith(url);
  });

  it('should handle rediss duplication', () => {
    const url = 'rediss://host:6379rediss://host:6379';
    mockConfigService.get.mockReturnValue(url);

    service = new CacheService(configService);

    expect(Redis).toHaveBeenCalledWith('rediss://host:6379');
  });

  it('should detect railway url but process correctly', () => {
    const url = 'redis://railway.internal:6379';
    mockConfigService.get.mockReturnValue(url);

    service = new CacheService(configService);

    expect(Redis).toHaveBeenCalledWith(url);
  });

  it('should detect railway url with duplication and process correctly', () => {
    const url = 'redis://railway.internal:6379redis://railway.internal:6379';
    mockConfigService.get.mockReturnValue(url);

    service = new CacheService(configService);

    expect(Redis).toHaveBeenCalledWith('redis://railway.internal:6379');
  });

  it('should fallback to individual env vars if REDIS_URL is missing', () => {
    mockConfigService.get.mockImplementation((key: any) => {
      if (key === 'REDIS_URL') return undefined;
      if (key === 'REDIS_HOST') return 'localhost';
      if (key === 'REDIS_PORT') return 6379;
      return undefined;
    });

    // Reset Redis mock to clear previous calls from beforeEach instantiation
    (Redis as unknown as jest.Mock).mockClear();

    service = new CacheService(configService);

    expect(Redis).toHaveBeenCalledWith(
      expect.objectContaining({
        host: 'localhost',
        port: 6379,
      })
    );
  });
});
