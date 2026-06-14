import { OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { EventEmitter } from 'events';
import { ConfigService } from '@nestjs/config';
import { z } from 'zod';
export interface ConfigSchema {
    name: string;
    type: 'string' | 'number' | 'boolean' | 'object' | 'array';
    required?: boolean;
    default?: any;
    description?: string;
    validation?: z.ZodSchema;
}
export interface ConfigurationOptions {
    autoReload?: boolean;
    watchInterval?: number;
    cacheEnabled?: boolean;
    validateOnLoad?: boolean;
    configPath?: string;
}
export declare class ConfigurationService extends EventEmitter implements OnModuleInit, OnModuleDestroy {
    private readonly configService;
    private readonly logger;
    private readonly configPath;
    private readonly schemas;
    private readonly cache;
    private readonly cachePrefix;
    private watcherIntervals;
    private readonly options;
    constructor(configService: ConfigService, options?: ConfigurationOptions);
    onModuleInit(): Promise<void>;
    private loadSchemas;
    private loadConfigurations;
    private loadConfigFile;
    private processConfigValue;
    private startConfigWatcher;
    reloadConfigurations(): Promise<void>;
    setConfig(key: string, value: any): void;
    getConfig<T = any>(key: string, defaultValue?: T): T;
    hasConfig(key: string): boolean;
    deleteConfig(key: string): boolean;
    getAllConfigs(): Record<string, any>;
    getSchema(name: string): ConfigSchema | undefined;
    getAllSchemas(): ConfigSchema[];
    validateConfig(key: string, value: any): boolean;
    saveConfig(key: string, value: any): Promise<void>;
    private loadYamlFile;
    onModuleDestroy(): void;
}
//# sourceMappingURL=ConfigurationService.d.ts.map