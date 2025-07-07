import { Logger } from '../logging/LoggingService';
import { CacheManager } from /../optimization/CacheManager';';
import { RetryConfig } from /../types/RetryConfig/;
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
