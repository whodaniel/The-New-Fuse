import { TaskQueue } from '@the-new-fuse/core';

export const taskQueue = new TaskQueue({
  redis: {
    host: process.env.REDIS_HOST,
    port: process.env.REDIS_PORT
  },
  workers: {
    concurrency: 3,
    timeout: 30000
  },
  retries: {
    max: 3,
    backoff: 'exponential'
  }
});