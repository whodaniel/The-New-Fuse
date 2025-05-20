import { OnModuleInit } from '@nestjs/common';
import { EventEmitter } from 'events';
import { Redis } from 'ioredis';
import { DatabaseService } from '../database/database.service.js';
import { StateManagerOptions } from '@the-new-fuse/types';
export declare class StateManager extends EventEmitter implements OnModuleInit {
    private readonly options;
    private readonly logger;
    private readonly redis;
    private readonly db;
    private readonly states;
    private readonly schemas;
    private readonly subscribers;
    private readonly snapshots;
    private readonly transactions;
    private readonly maxRetries;
    private readonly retryDelay;
    constructor(redis: Redis, db: DatabaseService, options?: StateManagerOptions);
}
