import { OnModuleInit } from '@nestjs/common';
import { DatabaseService } from '@the-new-fuse/database';
import { EventEmitter } from 'events';
import { RedisService } from '@the-new-fuse/database';
export declare class SchedulerService extends EventEmitter implements OnModuleInit {
    private logger;
    private redisService;
    private db;
    private schedules;
    private readonly checkInterval;
    private readonly lookAheadWindow;
    constructor(redisService: RedisService, databaseService: DatabaseService);
    for(: any, schedule: any, of: any, schedules: unknown): void;
}
