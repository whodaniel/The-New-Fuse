import { ConfigService } from '@nestjs/config';
import { POMTemplateDefinition } from '@the-new-fuse/types/dist/dacc';
/**
 * Supported URI schemes for data resolution
 */
export declare enum DataSourceScheme {
    FILE = "file",
    HTTP = "http",
    HTTPS = "https",
    CEE = "cee",// Code Execution Environment
    DB = "db",// Database queries
    STORAGE = "storage"
}
/**
 * Data resolution result
 */
export interface DataResolutionResult {
    scheme: DataSourceScheme;
    resolved_content: string;
    content_type: string;
    metadata?: Record<string, any>;
    success: boolean;
    error?: string;
}
/**
 * DACC Data Resolver Service
 *
 * Resolves POML data component URIs and injects content into templates
 * before they are sent to the Agent Execution Controller.
 *
 * Supports multiple URI schemes:
 * - file://path/to/file -> Local file system access
 * - https://url -> Web content fetching
 * - cee://job-id/artifact -> Code execution environment artifacts
 * - db://connection/query -> Database query results
 * - storage://bucket/key -> Cloud storage access
 */
export declare class DACCDataResolverService {
    private configService;
    private readonly logger;
    private readonly maxContentSize;
    private readonly requestTimeout;
    private readonly allowedFileExtensions;
    constructor(configService: ConfigService);
    /**
     * Resolve POML template by processing all data components
     */
    resolvePOMLTemplate(template: POMTemplateDefinition): Promise<POMTemplateDefinition>;
    /**
     * Resolve individual data source based on URI scheme
     */
    private resolveDataSource;
    /**
     * Resolve file:// URIs from local filesystem
     */
    private resolveFileSource;
    /**
     * Resolve HTTP/HTTPS URIs from web sources
     */
    private resolveHttpSource;
    /**
     * Resolve cee:// URIs from Code Execution Environment
     */
    private resolveCEESource;
    /**
     * Resolve db:// URIs from database queries
     */
    private resolveDBSource;
    /**
     * Resolve storage:// URIs from cloud storage
     */
    private resolveStorageSource;
    /**
     * Determine content type based on file extension
     */
    private getContentType;
    /**
     * Health check method
     */
    getHealthStatus(): Promise<Record<string, any>>;
}
//# sourceMappingURL=data-resolver.service.d.ts.map