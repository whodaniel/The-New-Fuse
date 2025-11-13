import { LoggingService } from './LoggingService';
import { ConfigService } from '../config/ConfigService';
export interface RedisConfig {
    host: string;
    port: number;
    password?: string;
    database?: number;
    keyPrefix?: string;
    ttl?: number;
}
export interface CacheEntry<T = any> {
    data: T;
    timestamp: number;
    ttl: number;
}
export declare class RedisService {
    private readonly logger;
    private readonly configService;
    private client;
    private config;
    private isConnected;
    constructor(logger: LoggingService, configService: ConfigService);
    private initializeConfig;
    private initializeClient;
    set(key: string, value: any, ttl?: number): Promise<void>;
    get<T = any>(key: string): Promise<T | null>;
}
//# sourceMappingURL=redis.service.d.ts.map