import { OnModuleInit } from '@nestjs/common';
import { EventEmitter } from 'events';
export declare class MonitoringService extends EventEmitter implements OnModuleInit {
    private logger;
    private redis;
    private db;
    private metrics;
    private alerts;
    private checkIntervals;
    private readonly defaultInterval;
    constructor();
}
