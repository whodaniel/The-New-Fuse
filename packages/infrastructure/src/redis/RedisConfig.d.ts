import { ConfigService } from '@nestjs/config';
import { RedisConfiguration } from './types.js';
export declare class RedisConfig {
    private readonly configService;
    constructor(configService: ConfigService);
    private parseRedisConfig;
    getConfiguration(): RedisConfiguration & {
        tls?: any;
    };
    getUpstashConfig(): {
        url: string;
        token: string;
    } | null;
    getConnectionOptions(): {
        host: string;
        port: number;
        password?: string;
        db: number;
        connectTimeout?: number;
        lazyConnect?: boolean;
        maxRetriesPerRequest?: number;
        retryDelayOnFailover: number;
        retryAttempts: number;
        family: number;
        keepAlive: number;
        keyPrefix: string;
        tls?: any;
    } | null;
    isClusterMode(): boolean;
    getClusterNodes(): string[];
}
//# sourceMappingURL=RedisConfig.d.ts.map