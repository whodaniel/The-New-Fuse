export interface RedisConfig {
    host: string;
    port: number;
    password?: string;
    db?: number;
    keyPrefix?: string;
    tls?: boolean;
}
export declare class RedisManager {
    private readonly client;
    private readonly logger;
    RedisConfig: any;
}
