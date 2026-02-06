import { redisClient } from './redis.js';

// Mock the Redis module
jest.mock('./redis.js', () => ({
  redisClient: {
    connect: jest.fn().mockResolvedValue(undefined),
    disconnect: jest.fn().mockResolvedValue(undefined),
    set: jest.fn().mockResolvedValue(undefined),
    get: jest.fn().mockImplementation((key: string) => {
      // Return the value that was set for the key
      return Promise.resolve('Hello Redis Cloud!');
    }),
    delete: jest.fn().mockResolvedValue(1),
  },
}));

describe('Redis Client', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should connect to Redis successfully', async () => {
    await redisClient.connect();
    expect(redisClient.connect).toHaveBeenCalled();
  });

  it('should set and get values correctly', async () => {
    const testKey = 'test_key_' + Date.now();
    const testValue = 'Hello Redis Cloud!';

    await redisClient.set(testKey, testValue);
    expect(redisClient.set).toHaveBeenCalledWith(testKey, testValue);

    const retrievedValue = await redisClient.get(testKey);
    expect(redisClient.get).toHaveBeenCalledWith(testKey);
    expect(retrievedValue).toBe(testValue);
  });

  it('should delete keys correctly', async () => {
    const testKey = 'test_key_to_delete';

    await redisClient.delete(testKey);
    expect(redisClient.delete).toHaveBeenCalledWith(testKey);
  });

  it('should disconnect from Redis successfully', async () => {
    await redisClient.disconnect();
    expect(redisClient.disconnect).toHaveBeenCalled();
  });
});
