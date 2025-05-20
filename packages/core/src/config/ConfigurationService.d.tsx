import { OnModuleInit } from '@nestjs/common';
import { EventEmitter } from 'events';
export declare class ConfigurationService extends EventEmitter implements OnModuleInit {
    private logger;
    private redis;
    private db;
    private config;
    private schemas;
    private readonly cachePrefix;
    private readonly configPath;
    constructor();
    onModuleInit(): Promise<void>;
}
