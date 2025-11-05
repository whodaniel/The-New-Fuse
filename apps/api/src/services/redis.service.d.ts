import { OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
export declare class RedisService implements OnModuleDestroy {
    private configService;
    private client;
    constructor(configService: ConfigService);
    getClient(): Redis;
    set(key: string, value: string, ttl?: number): Promise<void>;
    get(key: string): Promise<string | null>;
    del(key: string): Promise<number>;
    exists(key: string): Promise<number>;
    expire(key: string, seconds: number): Promise<number>;
    ttl(key: string): Promise<number>;
    onModuleDestroy(): void;
}
//# sourceMappingURL=redis.service.d.ts.map