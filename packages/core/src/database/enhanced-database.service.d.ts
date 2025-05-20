import { OnModuleInit, OnModuleDestroy } from '@nestjs/common';
export declare class EnhancedDatabaseService implements OnModuleInit, OnModuleDestroy {
    private readonly logger;
    DataSource: any;
}
