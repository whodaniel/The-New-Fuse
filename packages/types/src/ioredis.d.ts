export interface RedisConfig {
    host: string;
    port: number;
    password?: string;
    db?: number;
    tls?: boolean | object;
}
export interface RedisClientOptions extends RedisConfig {
    instanceId?: string;
    connectionTimeout?: number;
    maxRetriesPerRequest?: number;
    keyPrefix?: string;
    retryStrategy?: (times: number) => number | void;
    lazyConnect?: boolean;
}
export interface RedisCommand {
    cmd: string;
    args: unknown[];
}
export interface RedisTransaction {
    executeTransaction(commands: RedisCommand[]): Promise<[Error | null, unknown][] | null>;
    exec(): Promise<[Error | null, unknown][] | null>;
}
export interface RedisOperations {
    connect(): Promise<void>;
    disconnect(): Promise<void>;
    ping(): Promise<string>;
    get(key: string): Promise<string | null>;
    set(key: string, value: string, ttl?: number): Promise<'OK'>;
    del(key: string): Promise<number>;
    exists(key: string): Promise<number>;
    multi(): RedisMulti;
}
export interface RedisMulti {
    exec(): Promise<[Error | null, unknown][] | null>;
    get(key: string): RedisMulti;
    set(key: string, value: string, ttl?: number): RedisMulti;
    del(key: string): RedisMulti;
    exists(key: string): RedisMulti;
    [key: string]: ((...args: any[]) => RedisMulti) | (() => Promise<[Error | null, unknown][] | null>);
}
export interface Redis extends RedisOperations {
    readonly status: string;
    readonly options: RedisClientOptions;
    duplicate(): Redis;
}
export declare class RedisService implements RedisTransaction {
    protected client: Redis | null;
    constructor();
    executeTransaction(commands: RedisCommand[]): Promise<[Error | null, unknown][] | null>;
    exec(): Promise<[Error | null, unknown][] | null>;
}
//# sourceMappingURL=ioredis.d.ts.map