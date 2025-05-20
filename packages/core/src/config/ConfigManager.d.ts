import { OnModuleInit } from '@nestjs/common';
import { EventEmitter } from 'events';
export declare class ConfigManager extends EventEmitter implements OnModuleInit {
    private logger;
    private redis;
    private db;
    private config;
    private sources;
    private watchers;
    private schemas;
    constructor();
    private loadConfigFiles;
}
