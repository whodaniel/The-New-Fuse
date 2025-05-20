import { OnModuleInit } from '@nestjs/common';
import { Logger } from '@the-new-fuse/utils';
import { DatabaseService } from '@the-new-fuse/database';
import { Redis } from 'ioredis';
import { EventEmitter } from 'events';
export declare class ErrorHandlerService extends EventEmitter implements OnModuleInit {
    private readonly logger;
    private readonly redis;
    private readonly db;
    private readonly errorHandlers;
    private readonly patterns;
    constructor(logger: Logger, redis: Redis, db: DatabaseService);
    private persistError;
}
