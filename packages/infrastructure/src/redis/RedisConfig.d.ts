import { ConfigService } from '@nestjs/config';
import { RedisConfiguration } from './types';
export declare class RedisConfig {
    private readonly configService;
    constructor(configService: ConfigService);
    getConfiguration(): RedisConfiguration;
    getConnectionOptions(): {
        host: string;
        port: number;
        password: string | undefined;
        db: number;
        connectTimeout: number | undefined;
        lazyConnect: boolean | undefined;
        maxRetriesPerRequest: number | undefined;
        retryDelayOnFailover: number;
        retryAttempts: number;
        family: number;
        keepAlive: number;
        keyPrefix: string;
    };
    isClusterMode(): boolean;
    getClusterNodes(): string[];
}
//# sourceMappingURL=RedisConfig.d.ts.map