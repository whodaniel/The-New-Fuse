export declare const REDIS_CHANNELS: {
    TASK_UPDATES: string;
    USER_EVENTS: string;
    SYSTEM_NOTIFICATIONS: string;
    AGENT_COMMUNICATION: string;
    WORKFLOW_EVENTS: string;
};
export declare const REDIS_QUEUES: {
    TASK_QUEUE: string;
    EMAIL_QUEUE: string;
    PROCESSING_QUEUE: string;
    AGENT_QUEUE: string;
    NOTIFICATION_QUEUE: string;
};
export declare const redisConfig: (() => {
    host: string;
    port: number;
    password: string;
    db: number;
    keyPrefix: string;
    maxRetriesPerRequest: any;
    retryDelayOnFailover: number;
    enableReadyCheck: boolean;
    lazyConnect: boolean;
    keepAlive: number;
    family: number;
    cluster: {
        enabled: boolean;
        nodes: {
            host: string;
            port: number;
        }[];
    };
    tls: {
        rejectUnauthorized: boolean;
    };
    connectTimeout: number;
    commandTimeout: number;
    channels: {
        TASK_UPDATES: string;
        USER_EVENTS: string;
        SYSTEM_NOTIFICATIONS: string;
        AGENT_COMMUNICATION: string;
        WORKFLOW_EVENTS: string;
    };
    queues: {
        TASK_QUEUE: string;
        EMAIL_QUEUE: string;
        PROCESSING_QUEUE: string;
        AGENT_QUEUE: string;
        NOTIFICATION_QUEUE: string;
    };
}) & import("@nestjs/config").ConfigFactoryKeyHost<{
    host: string;
    port: number;
    password: string;
    db: number;
    keyPrefix: string;
    maxRetriesPerRequest: any;
    retryDelayOnFailover: number;
    enableReadyCheck: boolean;
    lazyConnect: boolean;
    keepAlive: number;
    family: number;
    cluster: {
        enabled: boolean;
        nodes: {
            host: string;
            port: number;
        }[];
    };
    tls: {
        rejectUnauthorized: boolean;
    };
    connectTimeout: number;
    commandTimeout: number;
    channels: {
        TASK_UPDATES: string;
        USER_EVENTS: string;
        SYSTEM_NOTIFICATIONS: string;
        AGENT_COMMUNICATION: string;
        WORKFLOW_EVENTS: string;
    };
    queues: {
        TASK_QUEUE: string;
        EMAIL_QUEUE: string;
        PROCESSING_QUEUE: string;
        AGENT_QUEUE: string;
        NOTIFICATION_QUEUE: string;
    };
}>;
export interface RedisConfigType {
    host: string;
    port: number;
    password?: string;
    db: number;
    keyPrefix: string;
    maxRetriesPerRequest: number | null;
    retryDelayOnFailover: number;
    enableReadyCheck: boolean;
    lazyConnect: boolean;
    keepAlive: number;
    family: number;
    cluster: {
        enabled: boolean;
        nodes: Array<{
            host: string;
            port: number;
        }>;
    };
    tls?: {
        rejectUnauthorized: boolean;
    };
    connectTimeout: number;
    commandTimeout: number;
    channels: typeof REDIS_CHANNELS;
    queues: typeof REDIS_QUEUES;
}
//# sourceMappingURL=redis.config.d.ts.map