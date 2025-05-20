import { OnModuleInit } from '@nestjs/common';
import { EventEmitter } from 'events';
export declare class AlertManager extends EventEmitter implements OnModuleInit {
    private logger;
    private redis;
    private db;
    private rules;
    private activeAlerts;
    private checkIntervals;
    constructor();
    for(: any, rule: any, of: any, rules: unknown): void;
}
