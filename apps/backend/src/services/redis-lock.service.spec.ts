import { ConfigService } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';
import Redis from 'ioredis';
import { RedisLockService } from './redis-lock.service.js';

// Mock ioredis
jest.mock('ioredis', () => require('ioredis-mock'));

describe('RedisLockService', () => {
  let service: RedisLockService;
  let redis: Redis;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RedisLockService,
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn((key: string) => {
              if (key === 'REDIS_URL') {
                return 'redis://localhost:6379';
              }
              return null;
            }),
          },
        },
      ],
    }).compile();

    service = module.get<RedisLockService>(RedisLockService);
    await service.onModuleInit();
    redis = (service as any).redis;
  });

  afterEach(async () => {
    await redis.flushall();
    await service.onModuleDestroy();
  });

  describe('acquireLock', () => {
    it('should acquire a lock and return a lock ID', async () => {
      const lockId = await service.acquireLock('test-key', 10);
      expect(lockId).toBeDefined();
      const value = await redis.get('lock:test-key');
      expect(value).toEqual(lockId);
    });

    it('should fail to acquire a lock if it is already held', async () => {
      await service.acquireLock('test-key', 10);
      const lockId = await service.acquireLock('test-key', 10, 1, 10);
      expect(lockId).toBeNull();
    });

    it('should acquire a lock after it is released', async () => {
      const lockId1 = await service.acquireLock('test-key', 10);
      await service.releaseLock('test-key', lockId1);
      const lockId2 = await service.acquireLock('test-key', 10);
      expect(lockId2).toBeDefined();
    });
  });

  describe('releaseLock', () => {
    it('should release a held lock', async () => {
      const lockId = await service.acquireLock('test-key', 10);
      const result = await service.releaseLock('test-key', lockId);
      expect(result).toBe(true);
      const value = await redis.get('lock:test-key');
      expect(value).toBeNull();
    });

    it('should fail to release a lock with the wrong lock ID', async () => {
      await service.acquireLock('test-key', 10);
      const result = await service.releaseLock('test-key', 'wrong-id');
      expect(result).toBe(false);
      const value = await redis.get('lock:test-key');
      expect(value).toBeDefined();
    });
  });

  describe('extendLock', () => {
    it('should extend the TTL of a held lock', async () => {
      const lockId = await service.acquireLock('test-key', 1);
      await new Promise((resolve) => setTimeout(resolve, 500));
      const result = await service.extendLock('test-key', lockId, 10);
      expect(result).toBe(true);
      const ttl = await redis.ttl('lock:test-key');
      expect(ttl).toBeGreaterThan(5);
    });

    it('should fail to extend a lock with the wrong lock ID', async () => {
      await service.acquireLock('test-key', 10);
      const result = await service.extendLock('test-key', 'wrong-id', 10);
      expect(result).toBe(false);
    });
  });
});
