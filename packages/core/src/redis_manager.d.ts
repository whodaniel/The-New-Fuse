export interface RedisConfig {
  // Implementation needed
}
    host: string;
    port: number;
    password?: string;
    db?: number;
    keyPrefix?: string;
    tls?: boolean;
}
export declare class RedisManager {
  // Implementation needed
}
    private readonly client;
    private readonly logger;
    RedisConfig: any;
}
