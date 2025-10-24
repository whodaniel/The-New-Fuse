export interface RedisConfig {
    host: string;
    port: number;
    password?: string;
    db?: number;
    tls?: boolean;
}
export declare class UnifiedBridge {
    private config;
    private redisClient;
    constructor(config: RedisConfig);
}
