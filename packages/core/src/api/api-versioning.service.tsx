import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { CentralizedLoggingService } from '../logging/centralized-logging.service.js';
import { Request } from 'express';

export enum VersioningStrategy {
  URI = 'uri',
  HEADER = 'header',
  MEDIA_TYPE = 'media-type',
  QUERY_PARAM = 'query-param'
}

export interface ApiVersionConfig {
  enabled: boolean;
  strategy: VersioningStrategy;
  defaultVersion: string;
  supportedVersions: string[];
  headerName?: string;
  queryParamName?: string;
  deprecatedVersions?: string[];
  sunsetVersions?: Record<string, Date>;
}

@Injectable()
export class ApiVersioningService {
  private readonly logger: any;
  private config: ApiVersionConfig;

  constructor(
    private readonly configService: ConfigService,
    private readonly loggingService: CentralizedLoggingService
  ) {
    this.logger = this.loggingService.createLogger('ApiVersioning');
    
    // Load configuration
    this.config = {
      enabled: this.configService.get<boolean>('api.versioning.enabled', true),
      strategy: this.configService.get<VersioningStrategy>('api.versioning.strategy', VersioningStrategy.URI),
      defaultVersion: this.configService.get<string>('api.versioning.defaultVersion', '1'),
      supportedVersions: this.configService.get<string[]>('api.versioning.supportedVersions', ['1']),
      headerName: this.configService.get<string>('api.versioning.headerName', 'x-api-version'),
      queryParamName: this.configService.get<string>('api.versioning.queryParamName', 'version'),
      deprecatedVersions: this.configService.get<string[]>('api.versioning.deprecatedVersions', []),
      sunsetVersions: this.configService.get<Record<string, Date>>('api.versioning.sunsetVersions', {})
    };
    
    this.logger.info('API versioning service initialized', {
      metadata: {
        strategy: this.config.strategy,
        defaultVersion: this.config.defaultVersion,
        supportedVersions: this.config.supportedVersions
      }
    });
  }

  /**
   * Extract API version from request based on configured strategy
   */
  extractVersion(request: Request): string {
    if (!this.config.enabled) {
      return this.config.defaultVersion;
    }
    
    let version: string | undefined;
    
    switch (this.config.strategy) {
      case VersioningStrategy.URI:
        // Extract from URI path, e.g., /v1/users
        const match = request.path.match(/^\/v(\d+)/);
        version = match ? match[1] : undefined;
        break;
        
      case VersioningStrategy.HEADER:
        // Extract from header
        version = request.headers[this.config.headerName!.toLowerCase()] as string;
        break;
        
      case VersioningStrategy.MEDIA_TYPE:
        // Extract from Accept header, e.g., application/vnd.api.v1+json
        const acceptHeader = request.headers.accept;
        if (acceptHeader) {
          const mediaTypeMatch = acceptHeader.match(/application\/vnd\.api\.v(\d+)\+json/);
          version = mediaTypeMatch ? mediaTypeMatch[1] : undefined;
        }
        break;
        
      case VersioningStrategy.QUERY_PARAM:
        // Extract from query parameter
        version = request.query[this.config.queryParamName!] as string;
        break;
    }
    
    // Validate version
    if (version && this.isVersionSupported(version)) {
      return version;
    }
    
    return this.config.defaultVersion;
  }

  /**
   * Check if a version is supported
   */
  isVersionSupported(version: string): boolean {
    return this.config.supportedVersions.includes(version);
  }

  /**
   * Check if a version is deprecated
   */
  isVersionDeprecated(version: string): boolean {
    return this.config.deprecatedVersions?.includes(version) || false;
  }

  /**
   * Get sunset date for a version (if any)
   */
  getVersionSunsetDate(version: string): Date | null {
    return this.config.sunsetVersions?.[version] || null;
  }

  /**
   * Add version headers to response
   */
  addVersionHeaders(response: any, version: string): void {
    if (!this.config.enabled) {
      return;
    }
    
    // Add current version header
    response.header('x-api-version', version);
    
    // Add deprecation header if applicable
    if (this.isVersionDeprecated(version)) {
      response.header('Deprecation', 'true');
    }
    
    // Add sunset header if applicable
    const sunsetDate = this.getVersionSunsetDate(version);
    if (sunsetDate) {
      response.header('Sunset', sunsetDate.toUTCString());
    }
  }

  /**
   * Get all supported versions
   */
  getSupportedVersions(): string[] {
    return [...this.config.supportedVersions];
  }

  /**
   * Get default version
   */
  getDefaultVersion(): string {
    return this.config.defaultVersion;
  }

  /**
   * Get versioning strategy
   */
  getVersioningStrategy(): VersioningStrategy {
    return this.config.strategy;
  }
}
