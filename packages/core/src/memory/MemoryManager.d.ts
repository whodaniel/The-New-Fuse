import { OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '../config/ConfigService';
export declare class MemoryManager implements OnModuleDestroy {
    private readonly configService;
    private redis;
    private readonly defaultTTL;
    constructor(configService: ConfigService);
    store(key: string, value: unknown, ttl?: number): Promise<void>;
    get(key: string): Promise<unknown>;
    delete(key: string): Promise<void>;
    exists(key: string): Promise<boolean>;
    getKeys(pattern: string): Promise<string[]>;
    disconnect(): Promise<void>;
    onModuleDestroy(): Promise<void>;
}
//# sourceMappingURL=MemoryManager.d.ts.map