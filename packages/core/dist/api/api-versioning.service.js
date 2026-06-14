var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var ApiVersioningService_1;
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
export var VersioningStrategy;
(function (VersioningStrategy) {
    VersioningStrategy["URI"] = "uri";
    VersioningStrategy["HEADER"] = "header";
    VersioningStrategy["MEDIA_TYPE"] = "media-type";
    VersioningStrategy["QUERY_PARAM"] = "query-param";
})(VersioningStrategy || (VersioningStrategy = {}));
let ApiVersioningService = ApiVersioningService_1 = class ApiVersioningService {
    constructor(configService) {
        this.configService = configService;
        this.logger = new Logger(ApiVersioningService_1.name);
        this.config = {
            enabled: this.configService.get('api.versioning.enabled', true),
            strategy: this.configService.get('api.versioning.strategy', VersioningStrategy.HEADER),
            defaultVersion: this.configService.get('api.versioning.defaultVersion', '1'),
            supportedVersions: this.configService.get('api.versioning.supportedVersions', ['1']),
            headerName: this.configService.get('api.versioning.headerName', 'x-api-version'),
            queryParamName: this.configService.get('api.versioning.queryParamName', 'version'),
            deprecatedVersions: this.configService.get('api.versioning.deprecatedVersions', []),
            sunsetVersions: this.configService.get('api.versioning.sunsetVersions', {})
        };
        this.validateConfiguration();
        this.logger.log('API versioning service initialized');
    }
    extractVersion(request) {
        if (!this.config.enabled) {
            return this.config.defaultVersion;
        }
        let version;
        switch (this.config.strategy) {
            case VersioningStrategy.HEADER:
                version = request.headers[this.config.headerName];
                break;
            case VersioningStrategy.QUERY_PARAM:
                version = request.query[this.config.queryParamName];
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
        if (version && this.isVersionSupported(version)) {
            return version;
        }
        return this.config.defaultVersion;
    }
    addVersionHeaders(response, requestedVersion) {
        response.header('API-Version', requestedVersion);
        response.header('Supported-Versions', this.config.supportedVersions.join(', '));
        // Add deprecation warnings
        if (this.isVersionDeprecated(requestedVersion)) {
            response.header('Deprecation', 'true');
            response.header('Warning', `Version ${requestedVersion} is deprecated`);
        }
        // Add sunset dates
        const sunsetDate = this.config.sunsetVersions[requestedVersion];
        if (sunsetDate) {
            response.header('Sunset', sunsetDate.toISOString());
        }
    }
    isVersionSupported(version) {
        return this.config.supportedVersions.includes(version);
    }
    isVersionDeprecated(version) {
        return this.config.deprecatedVersions.includes(version);
    }
    getSunsetDate(version) {
        return this.config.sunsetVersions[version];
    }
    getAllSupportedVersions() {
        return [...this.config.supportedVersions];
    }
    getDefaultVersion() {
        return this.config.defaultVersion;
    }
    validateConfiguration() {
        const errors = [];
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
    updateConfig(updates) {
        this.config = { ...this.config, ...updates };
        this.validateConfiguration();
        this.logger.log('API versioning configuration updated');
    }
};
ApiVersioningService = ApiVersioningService_1 = __decorate([
    Injectable(),
    __metadata("design:paramtypes", [ConfigService])
], ApiVersioningService);
export { ApiVersioningService };
//# sourceMappingURL=api-versioning.service.js.map