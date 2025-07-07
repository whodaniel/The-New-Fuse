/**
 * Simplified Redis client for basic connection and messaging.
 */
interface RedisConfigOptions {
    host?: string;
    port?: number;
}
export declare class RedisConfig {
    host: string;
    port: number;
    constructor({ host, port }?: RedisConfigOptions);
}
export declare class ClientBridge {
    private config;
    private redis;
    instanceId: string;
    shouldRun: boolean;
    constructor(config: RedisConfig, instanceId?: string);
}
export {};
