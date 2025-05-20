import { OnModuleInit } from '@nestjs/common';
import { EventEmitter } from 'events';
import { Redis } from 'ioredis';
import { DatabaseService } from '../database/database.service.js';
import { StateManagerOptions } from '@the-new-fuse/types';
export declare class StateService extends EventEmitter implements OnModuleInit {
    private readonly logger;
    private readonly redis;
    private readonly db;
    private readonly state;
    private readonly transactions;
    private readonly locks;
    private readonly lockTimeout;
    private readonly snapshotInterval;
    private snapshotTimer;
    constructor(redis: Redis, db: DatabaseService, options?: StateManagerOptions);
}
