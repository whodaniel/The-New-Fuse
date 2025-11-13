import { registerAs } from '@nestjs/config';
export const REDIS_CHANNELS = {
    TASK_UPDATES: 'myapp:task:updates',
    USER_EVENTS: 'myapp:user:events',
    SYSTEM_NOTIFICATIONS: 'myapp:system:notifications',
    AGENT_COMMUNICATION: 'myapp:agent:communication',
    WORKFLOW_EVENTS: 'myapp:workflow:events'
};
export const REDIS_QUEUES = {
    TASK_QUEUE: 'myapp:task:queue',
    EMAIL_QUEUE: 'myapp:email:queue',
    PROCESSING_QUEUE: 'myapp:processing:queue',
    AGENT_QUEUE: 'myapp:agent:queue',
    NOTIFICATION_QUEUE: 'myapp:notification:queue'
};
export const redisConfig = registerAs('redis', () => ({
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379'),
    password: process.env.REDIS_PASSWORD,
    db: parseInt(process.env.REDIS_DB || '0'),
    keyPrefix: process.env.REDIS_KEY_PREFIX || 'myapp:',
    maxRetriesPerRequest: null,
    retryDelayOnFailover: 100,
    enableReadyCheck: false,
    lazyConnect: true,
    keepAlive: 30000,
    family: 4,
    cluster: {
        enabled: process.env.REDIS_CLUSTER_ENABLED === 'true',
        nodes: process.env.REDIS_CLUSTER_NODES?.split(',').map(node => {
            const [host, port] = node.split(':');
            return { host, port: parseInt(port) };
        }) || []
    },
    tls: process.env.REDIS_TLS === 'true' ? {
        rejectUnauthorized: false
    } : undefined,
    connectTimeout: 10000,
    commandTimeout: 5000,
    channels: REDIS_CHANNELS,
    queues: REDIS_QUEUES
}));
//# sourceMappingURL=redis.config.js.map