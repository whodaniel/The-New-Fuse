import { ConfigService } from '@nestjs/config';
/**
 * GCP Environment Configuration
 * Handles GCP-specific environment variable parsing and configuration
 */
export declare class GcpConfigService {
    private configService;
    constructor(configService: ConfigService);
    /**
     * Get GCP Project ID
     */
    getProjectId(): string;
    /**
     * Get GCS Bucket Name
     */
    getGcsBucket(): string;
    /**
     * Get configuration for GCP environment
     */
    getGcpConfig(): {
        projectId: string;
        bucket: string;
        keyFile: any;
        isGcpEnvironment: boolean;
    };
}
/**
 * GCP Environment Validator
 * Validates that all required GCP environment variables are present
 */
export declare function validateGcpEnvironment(): void;
//# sourceMappingURL=gcp.config.d.ts.map