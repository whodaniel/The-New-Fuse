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
}
import { Redis } from 'ioredis';
export declare class RedisService implements RedisTransaction {
    protected client: Redis | null;
    constructor();
    executeTransaction(commands: RedisCommand[]): Promise<[Error | null, unknown][] | null>;
}
//# sourceMappingURL=ioredis.d.d.ts.map