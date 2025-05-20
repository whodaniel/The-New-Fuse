import { OnModuleInit } from '@nestjs/common';
import { EventEmitter } from 'events';
export declare class ErrorRecoveryService extends EventEmitter implements OnModuleInit {
    private readonly logger;
    private readonly redis;
    private readonly db;
    private readonly strategies;
    private readonly recoveryHandlers;
    private readonly activeRecoveries;
    constructor();
    for(: any, strategy: any, of: any, strategies: unknown): void;
}
