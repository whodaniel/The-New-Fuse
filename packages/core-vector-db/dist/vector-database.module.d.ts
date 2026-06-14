import { DynamicModule } from '@nestjs/common';
import { EmbeddingConfig, VectorDatabaseConfig } from './interface/vector-database.interface.js';
export interface VectorDatabaseModuleOptions {
    vectorDbConfig: VectorDatabaseConfig;
    embeddingConfig: EmbeddingConfig;
}
export declare class VectorDatabaseModule {
    static forRoot(options: VectorDatabaseModuleOptions): DynamicModule;
    static forRootAsync(options: {
        useFactory: (...args: any[]) => Promise<VectorDatabaseModuleOptions> | VectorDatabaseModuleOptions;
        inject?: any[];
    }): DynamicModule;
}
//# sourceMappingURL=vector-database.module.d.ts.map