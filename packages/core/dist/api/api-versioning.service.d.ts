import { ConfigService } from '@nestjs/config';
import { Request, Response } from 'express';
export declare enum VersioningStrategy {
    URI = "uri",
    HEADER = "header",
    MEDIA_TYPE = "media-type",
    QUERY_PARAM = "query-param"
}
export interface ApiVersioningConfig {
    enabled: boolean;
    strategy: VersioningStrategy;
    defaultVersion: string;
    supportedVersions: string[];
    headerName: string;
    queryParamName: string;
    deprecatedVersions: string[];
    sunsetVersions: Record<string, Date>;
}
export declare class ApiVersioningService {
    private readonly configService;
    private readonly logger;
    private config;
    constructor(configService: ConfigService);
    extractVersion(request: Request): string;
    addVersionHeaders(response: Response, requestedVersion: string): void;
    isVersionSupported(version: string): boolean;
    isVersionDeprecated(version: string): boolean;
    getSunsetDate(version: string): Date | undefined;
    getAllSupportedVersions(): string[];
    getDefaultVersion(): string;
    private validateConfiguration;
    updateConfig(updates: Partial<ApiVersioningConfig>): void;
}
//# sourceMappingURL=api-versioning.service.d.ts.map