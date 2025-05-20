import { Logger } from 'winston';
import { Redis } from 'ioredis';
import { DatabaseService } from '@the-new-fuse/database';
export declare class ErrorRecoverySystem {
    private redis;
    private logger;
    private db;
    constructor(redis: Redis, logger: Logger, db: DatabaseService);
    handleAgentFailure(): Promise<void>;
}
