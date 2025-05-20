import { OnModuleInit } from '@nestjs/common';
import { DatabaseService } from '@the-new-fuse/database/src/database.service';
import { EventEmitter } from 'events';
export declare class StateSynchronizer extends EventEmitter implements OnModuleInit {
    private readonly databaseService;
    private logger;
    private redis;
    private db;
    private syncQueue;
    private retryTimeouts;
    private syncInProgress;
    constructor(databaseService: DatabaseService);
    onModuleInit(): Promise<void>;
}
