import { OnModuleInit } from '@nestjs/common';
import { EventEmitter } from 'events';
export declare class QueueService extends EventEmitter implements OnModuleInit {
    private logger;
    private redis;
    private db;
    private config;
    private stats;
    private processors;
    private processing;
    private readonly statsUpdateInterval;
    constructor();
    onModuleInit(): Promise<void>;
}
