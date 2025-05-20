export const RedisChannels = {
  MESSAGE_PROCESSING: 'fuse:message:processing',
  PATTERN_RECOGNITION: 'fuse:pattern:recognition',
  STATE_UPDATES: 'fuse:state:updates',
  SERVICE_HEALTH: 'fuse:service:health'
};

export const RedisConfig = {
  HOST: process.env.REDIS_HOST || 'localhost',
  PORT: parseInt(process.env.REDIS_PORT || '6379', 10),
  KEY_PREFIX: 'fuse:',
  TTL_SECONDS: 86400 // 24 hours
};