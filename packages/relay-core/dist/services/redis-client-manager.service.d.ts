import type { Cluster, Redis } from 'ioredis';
declare const CONFIG: {
    REDIS_URL: string;
    REDIS_KEYS: {
        INGRESS: string;
        EGRESS_PREFIX: string;
        AGENTS: string;
        HEARTBEATS: string;
        CHANNELS: string;
        TASKS: string;
        TASKS_REALTIME: string;
        TASKS_PLANNING: string;
        SUGGESTIONS: string;
        CHANGELOG: string;
        KANBAN: string;
        LOGS: string;
        STATE: string;
        SUPER_CYCLE: string;
        SELF_PROMPTS: string;
    };
};
export declare class RedisClientManager {
    redis: Redis | Cluster | null;
    redisSub: Redis | Cluster | null;
    upstash: any;
    private config;
    private logger;
    private onIngressMessage;
    private onRelayAgentRegisterRequest;
    constructor(config: typeof CONFIG, logger: (level: string, category: string, message: string, data?: any) => void, onIngressMessage: (envelope: any) => void, onRelayAgentRegisterRequest: (envelope: any) => Promise<void>);
    connectRedis(): Promise<void>;
    quit(): Promise<void>;
    hset(key: string, field: string | Record<string, any>, value?: string): Promise<any>;
    smembers(key: string): Promise<string[]>;
    sadd(key: string, member: string): Promise<any>;
    lpush(key: string, value: string): Promise<any>;
    ltrim(key: string, start: number, stop: number): Promise<"OK">;
    publish(channel: string, message: string): Promise<any>;
    del(key: string): Promise<any>;
    get rawRedisClient(): Redis | Cluster | null;
    get rawUpstashClient(): any;
    get redisKeys(): typeof CONFIG.REDIS_KEYS;
}
export {};
//# sourceMappingURL=redis-client-manager.service.d.ts.map