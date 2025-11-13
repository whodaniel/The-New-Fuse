import { OnModuleDestroy } from '@nestjs/common';
import { UnifiedRedisService } from '@the-new-fuse/infrastructure';
export declare class RedisService implements OnModuleDestroy {
    private readonly unifiedRedis;
    private readonly logger;
    private readonly subscriptionCallbacks;
    private readonly patternCallbacks;
    constructor(unifiedRedis: UnifiedRedisService);
    onModuleDestroy(): Promise<void>;
    get(key: string): Promise<string | null>;
    getAll(pattern: string): Promise<string[]>;
    set(key: string, value: string, ttl?: number): Promise<void>;
    setWorkflowState(workflowId: string, state: any): Promise<void>;
    del(key: string): Promise<void>;
    exists(key: string): Promise<boolean>;
    keys(pattern: string): Promise<string[]>;
    publish(channel: string, message: string): Promise<void>;
    subscribe(channel: string, callback: (message: string) => void): Promise<void>;
    unsubscribe(channel: string): Promise<void>;
    punsubscribe(pattern: string): Promise<void>;
    disconnect(): Promise<void>;
}
//# sourceMappingURL=redis.service.d.ts.map