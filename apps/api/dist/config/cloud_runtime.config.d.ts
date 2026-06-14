import { ConfigService } from '@nestjs/config';
/**
 * CloudRuntime Environment Configuration
 * Handles CloudRuntime-specific environment variable parsing and configuration
 */
export declare class CloudRuntimeConfigService {
    private configService;
    constructor(configService: ConfigService);
    /**
     * Get the proper database URL for CloudRuntime environment
     */
    getDatabaseUrl(): string;
    /**
     * Get the proper Redis URL for CloudRuntime environment
     */
    getRedisUrl(): string;
    /**
     * Get configuration for CloudRuntime environment
     */
    getCloudRuntimeConfig(): {
        databaseUrl: string;
        redisUrl: string;
        isCloudRuntimeEnvironment: boolean;
        serviceName: any;
        projectId: any;
    };
}
/**
 * CloudRuntime Environment Validator
 * Validates that all required CloudRuntime environment variables are present
 */
export declare function validateCloudRuntimeEnvironment(): void;
//# sourceMappingURL=cloud_runtime.config.d.ts.map