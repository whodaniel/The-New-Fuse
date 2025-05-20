import { registerAs } from '@nestjs/config';

export const REDIS_CHANNELS = {
  TASK_UPDATES: 'myapp:task:updates',
  USER_EVENTS: 'myapp:user:events',
  SYSTEM_NOTIFICATIONS: 'myapp:system:notifications',
} as const;

export const REDIS_QUEUES = {
  TASK_QUEUE: 'myapp:task:queue',
  EMAIL_QUEUE: 'myapp:email:queue',
  PROCESSING_QUEUE: 'myapp:processing:queue',
} as const;

export const redisConfig = registerAs('redis', () => ({
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT || '6379', 10),
  password: process.env.REDIS_PASSWORD,
  db: parseInt(process.env.REDIS_DB || '0', 10),
  keyPrefix: process.env.REDIS_KEY_PREFIX || 'myapp:',
  cluster: {
    enabled: process.env.REDIS_CLUSTER_ENABLED === 'true',
    nodes: process.env.REDIS_CLUSTER_NODES?.split(',') || [],
  },
  retryStrategy: (times: number) => Math.min(times * 50, 2000),
}));
