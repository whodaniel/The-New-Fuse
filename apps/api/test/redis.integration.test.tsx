import { setupTests } from '@the-new-fuse/utils';
import { createRedisClient } from '@the-new-fuse/database';

describe('Redis Integration', () => {
  let redis: ReturnType<typeof createRedisClient>;

  beforeAll(async () => {
    redis = createRedisClient();
    await redis.connect();
  });

  afterAll(async () => {
    await redis.quit();
  });

  test('should connect to Redis', async () => {
    const response = await redis.ping();
    expect(response).toBe('PONG');
  });
});