import { OnModuleDestroy } from '@nestjs/common';
export declare class MemoryManager implements OnModuleDestroy {
    private redis;
    private readonly defaultTTL;
    constructor();
    store(key: string, value: unknown, ttl?: number): Promise<void>;
    get(key: string): Promise<unknown>;
    delete(key: string): Promise<void>;
    exists(key: string): Promise<boolean>;
    getKeys(pattern: string): Promise<string[]>;
    disconnect(): Promise<void>;
    onModuleDestroy(): Promise<void>;
}
//# sourceMappingURL=MemoryManager.d.ts.map