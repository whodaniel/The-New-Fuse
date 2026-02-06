import { createRedisClient } from '@the-new-fuse/database';
describe('Redis Integration', () => {
  let redis;
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
//# sourceMappingURL=redis.integration.test.js.map
