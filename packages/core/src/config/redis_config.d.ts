export interface RedisConfig {
  // Implementation needed
}
    host: string;
    port: number;
    password?: string;
    db?: number;
    tls?: boolean;
}
export declare class UnifiedBridge {
  // Implementation needed
}
    private config;
    private redisClient;
    constructor(config: RedisConfig);
}
