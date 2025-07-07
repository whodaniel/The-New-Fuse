import Redis from 'ioredis';

export function createRedisClient() {
  const client = new Redis();
  return client;
}