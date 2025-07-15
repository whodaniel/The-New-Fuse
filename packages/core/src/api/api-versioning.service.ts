import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Request, Response } from 'express';

export enum VersioningStrategy {
  URI = 'uri',
  HEADER = 'header',
  MEDIA_TYPE = 'media-type',
  QUERY_PARAM = 'query-param'
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

@Injectable()
export class ApiVersioningService {
  private readonly logger = new Logger(ApiVersioningService.name);
  private config: ApiVersioningConfig;

  constructor(private readonly configService: ConfigService) {
    this.config = {
      enabled: this.configService.get<boolean>('api.versioning.enabled', true),
      strategy: this.configService.get<VersioningStrategy>('api.versioning.strategy', VersioningStrategy.HEADER),
      defaultVersion: this.configService.get<string>('api.versioning.defaultVersion', '1'),
      supportedVersions: this.configService.get<string[]>('api.versioning.supportedVersions', ['1']),
      headerName: this.configService.get<string>('api.versioning.headerName', 'x-api-version'),
      queryParamName: this.configService.get<string>('api.versioning.queryParamName', 'version'),
      deprecatedVersions: this.configService.get<string[]>('api.versioning.deprecatedVersions', []),
      sunsetVersions: this.configService.get<Record<string, Date>>('api.versioning.sunsetVersions', {})
    };

    this.validateConfiguration();
    this.logger.log('API versioning service initialized');
  }

  extractVersion(request: Request): string {
    if (!this.config.enabled) {
      return this.config.defaultVersion;
    }

    let version: string | undefined;

    switch (this.config.strategy) {
      case VersioningStrategy.HEADER:
        version = request.headers[this.config.headerName] as string;
        break;
      
      case VersioningStrategy.QUERY_PARAM:
        version = request.query[this.config.queryParamName] as string;
        break;
      
      case VersioningStrategy.URI:
        // Extract version from URI pattern like /v1/users or /api/v2/users
        const uriMatch = request.path.match(/\/v(\d+(?:\.\d+)?)\//);
        version = uriMatch ? uriMatch[1] : undefined;
        break;
      
      case VersioningStrategy.MEDIA_TYPE:
        // Extract version from Accept header like application/vnd.api+json; version=1
        const acceptHeader = request.headers.accept;
        if (acceptHeader) {
          const mediaTypeMatch = acceptHeader.match(/version=(\d+(?:\.\d+)?)/);
          version = mediaTypeMatch ? mediaTypeMatch[1] : undefined;
        }
        break;
    }

    // Validate and return version or default
    if (version && this.config.supportedVersions.includes(version)) {
      return version;
    }

    return this.config.defaultVersion;
  }

  addVersionHeaders(response: Response, requestedVersion: string): void {
    response.header('API-Version', requestedVersion);
    response.header('Supported-Versions', this.config.supportedVersions.join(', '));

    // Add deprecation warnings
    if (this.config.deprecatedVersions.includes(requestedVersion)) {
      response.header('Deprecation', 'true');
      response.header('Warning', `Version ${requestedVersion} is deprecated`);
    }

    // Add sunset dates
    const sunsetDate = this.config.sunsetVersions[requestedVersion];
    if (sunsetDate) {
      response.header('Sunset', sunsetDate.toISOString());
    }
  }

  isVersionSupported(version: string): boolean {
    return this.config.supportedVersions.includes(version);
  }

  isVersionDeprecated(version: string): boolean {
    return this.config.deprecatedVersions.includes(version);
  }

  getSunsetDate(version: string): Date | undefined {
    return this.config.sunsetVersions[version];
  }

  getAllSupportedVersions(): string[] {
    return [...this.config.supportedVersions];
  }

  getDefaultVersion(): string {
    return this.config.defaultVersion;
  }

  private validateConfiguration(): void {
    const errors: string[] = [];

    if (this.config.supportedVersions.length === 0) {
      errors.push('At least one supported version must be specified');
    }

    if (!this.config.supportedVersions.includes(this.config.defaultVersion)) {
      errors.push('Default version must be included in supported versions');
    }

    // Validate deprecated versions are also supported
    for (const deprecatedVersion of this.config.deprecatedVersions) {
      if (!this.config.supportedVersions.includes(deprecatedVersion)) {
        errors.push(`Deprecated version ${deprecatedVersion} must be included in supported versions`);
      }
    }

    // Validate sunset versions are also supported
    for (const sunsetVersion of Object.keys(this.config.sunsetVersions)) {
      if (!this.config.supportedVersions.includes(sunsetVersion)) {
        errors.push(`Sunset version ${sunsetVersion} must be included in supported versions`);
      }
    }

    if (errors.length > 0) {
      this.logger.error('API versioning configuration validation failed:');
      errors.forEach(error => this.logger.error(`- ${error}`));
      throw new Error(`Invalid API versioning configuration: ${errors.join(', ')}`);
    }
  }

  updateConfig(updates: Partial<ApiVersioningConfig>): void {
    this.config = { ...this.config, ...updates };
    this.validateConfiguration();
    this.logger.log('API versioning configuration updated');
  }
}