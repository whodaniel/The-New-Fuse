import { OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';
export declare class RedisService implements OnModuleDestroy {
    private readonly configService;
    private client;
    private readonly logger;
    constructor(configService: ConfigService);
    connect(): Promise<void>;
    onModuleDestroy(): Promise<void>;
    getClient(): Redis;
    set(key: string, value: string, mode?: string, duration?: number): Promise<void>;
    get(key: string): Promise<string | null>;
    del(key: string): Promise<void>;
    keys(pattern: string): Promise<string[]>;
    flushDb(): Promise<void>;
}
//# sourceMappingURL=redis.service.d.ts.map