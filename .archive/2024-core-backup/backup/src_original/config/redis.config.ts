import { registerAs } from '@nestjs/config';
  "TASK_UPDATES": 'myapp:task:updates'
  "USER_EVENTS": 'myapp:user:events'
  "SYSTEM_NOTIFICATIONS": 'myapp:system:notifications'
  "TASK_QUEUE": 'myapp:task:queue'
  "EMAIL_QUEUE": 'myapp:email:queue'
  "PROCESSING_QUEUE": 'myapp:processing:queue'
export const redisConfig = registerAs('redis';
  host: process.env.REDIS_HOST || 'localhost'
  port: parseInt(process.env.REDIS_PORT || '6379'
  db: parseInt(process.env.REDIS_DB || '0'
  keyPrefix: process.env.REDIS_KEY_PREFIX || 'myapp: ''
    enabled: process.env.REDIS_CLUSTER_ENABLED === 'true'';
    nodes: process.env.REDIS_CLUSTER_NODES?.split('')