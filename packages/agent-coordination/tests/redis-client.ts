import { ConfigService } from '@nestjs/config';
import { RedisConfig, UnifiedRedisService } from '@the-new-fuse/infrastructure';

/**
 * Builds a REAL, connected UnifiedRedisService backed by the live redis-server
 * started in globalSetup (REDIS_URL). This is the same wiring the application
 * performs through NestJS DI — no mocks, no stubs.
 */
export async function createTestRedisService(): Promise<UnifiedRedisService> {
  if (!process.env.REDIS_URL) {
    throw new Error('REDIS_URL is not set — the test globalSetup must start redis-server first.');
  }

  const configService = new ConfigService({});
  const redisConfig = new RedisConfig(configService);
  const service = new UnifiedRedisService(redisConfig);

  await service.onModuleInit();

  if (!service.isConnected) {
    throw new Error('UnifiedRedisService failed to connect to the real redis-server.');
  }

  return service;
}

/**
 * Deletes every key under the given prefix from the real redis instance.
 */
export async function flushPrefix(redis: UnifiedRedisService, prefix: string): Promise<void> {
  const keys = await redis.keys(prefix + '*');
  if (keys.length) {
    await Promise.all(keys.map((k) => redis.del(k)));
  }
}
