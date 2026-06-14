import { ConfigService } from '@nestjs/config';
export declare class CacheService {
    private configService;
    private client;
    private logger;
    private enabled;
    constructor(configService: ConfigService);
    get(key: string): Promise<string | null>;
    set(key: string, value: string): Promise<'OK'>;
    del(key: string): Promise<number>;
    sadd(key: string, member: string): Promise<number>;
    srem(key: string, member: string): Promise<number>;
    scard(key: string): Promise<number>;
    hget(key: string, field: string): Promise<string | null>;
    hgetall(key: string): Promise<Record<string, string>>;
    lrange(key: string, start: number, stop: number): Promise<string[]>;
}
//# sourceMappingURL=cache.service.d.ts.map