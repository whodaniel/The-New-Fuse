import { OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
export declare class RedisService implements OnModuleDestroy {
    private readonly configService;
    private client;
    private publisher;
    private subscriber;
    private readonly logger;
    constructor(configService: ConfigService);
    connect(): Promise<void>;
    onModuleDestroy(): Promise<void>;
    getClient(): any;
    set(key: string, value: string, mode?: string, duration?: number): Promise<void>;
    get(key: string): Promise<string | null>;
    del(key: string): Promise<void>;
    keys(pattern: string): Promise<string[]>;
    flushDb(): Promise<void>;
    publish(channel: string, message: string): Promise<number>;
    getSubscriber(): Promise<any>;
}
//# sourceMappingURL=redis.service.d.ts.map