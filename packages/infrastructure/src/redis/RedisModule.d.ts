import { DynamicModule } from '@nestjs/common';
import { RedisConfiguration } from './types';
export interface RedisModuleOptions {
    isGlobal?: boolean;
    config?: Partial<RedisConfiguration>;
}
export declare class RedisModule {
    static forRoot(options?: RedisModuleOptions): DynamicModule;
    static forRootAsync(options: {
        isGlobal?: boolean;
        useFactory?: (...args: any[]) => Promise<Partial<RedisConfiguration>> | Partial<RedisConfiguration>;
        inject?: any[];
    }): DynamicModule;
}
//# sourceMappingURL=RedisModule.d.ts.map