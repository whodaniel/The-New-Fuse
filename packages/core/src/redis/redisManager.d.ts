export interface RedisConfig {
    host: string;
    port: number;
    password?: string;
    db?: number;
    keyPrefix?: string;
}
export declare class RedisManager {
    private readonly client;
    private readonly subscriber;
    private readonly publisher;
    private readonly messageHandlers;
    private readonly keyPrefix;
    constructor(config: RedisConfig);
    private setupErrorHandlers;
}
