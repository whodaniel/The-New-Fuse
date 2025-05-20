import { Logger } from '../logging/LoggingService.js';
import { CacheManager } from '../optimization/CacheManager.js';
import { RetryConfig } from '../types/RetryConfig.js';
export declare class ExternalApiService {
    private readonly cacheManager;
    private readonly config;
    private axiosInstance;
    private logger;
    constructor(cacheManager: CacheManager, logger: Logger, config?: {
        baseURL?: string;
        timeout?: number;
        retryConfig?: RetryConfig;
    });
}
