var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var DACCDataResolverService_1;
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as fs from 'fs/promises';
import * as path from 'path';
/**
 * Supported URI schemes for data resolution
 */
export var DataSourceScheme;
(function (DataSourceScheme) {
    DataSourceScheme["FILE"] = "file";
    DataSourceScheme["HTTP"] = "http";
    DataSourceScheme["HTTPS"] = "https";
    DataSourceScheme["CEE"] = "cee";
    DataSourceScheme["DB"] = "db";
    DataSourceScheme["STORAGE"] = "storage"; // Storage service
})(DataSourceScheme || (DataSourceScheme = {}));
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
let DACCDataResolverService = DACCDataResolverService_1 = class DACCDataResolverService {
    configService;
    logger = new Logger(DACCDataResolverService_1.name);
    maxContentSize;
    requestTimeout;
    allowedFileExtensions;
    constructor(configService) {
        this.configService = configService;
        this.maxContentSize = this.configService.get('DACC_RESOLVER_MAX_CONTENT_SIZE', 10 * 1024 * 1024); // 10MB
        this.requestTimeout = this.configService.get('DACC_RESOLVER_TIMEOUT_MS', 30000); // 30 seconds
        this.allowedFileExtensions = this.configService.get('DACC_RESOLVER_ALLOWED_EXTENSIONS', [
            '.txt', '.json', '.yaml', '.yml', '.md', '.csv', '.xml', '.html'
        ]);
    }
    /**
     * Resolve POML template by processing all data components
     */
    async resolvePOMLTemplate(template) {
        try {
            this.logger.debug(`Resolving POML template: ${template.template_name}`);
            let resolvedContent = template.template_content;
            const resolutionMetadata = {};
            // Find all data component tags in the template
            const dataComponentPattern = /<(document|table|img|folder)\s+src="([^"]+)"[^>]*>/g;
            const matches = Array.from(resolvedContent.matchAll(dataComponentPattern));
            for (const match of matches) {
                const [fullMatch, componentType, srcUri] = match;
                this.logger.debug(`Processing data component: ${componentType} with URI: ${srcUri}`);
                // Resolve the data source
                const resolution = await this.resolveDataSource(srcUri, componentType);
                if (resolution.success) {
                    // Create a variable name for the resolved content
                    const variableName = `resolved_${componentType}_${Date.now()}`;
                    // Replace the data component tag with a variable definition
                    const variableDefinition = `<let name="${variableName}">${resolution.resolved_content}</let>`;
                    resolvedContent = resolvedContent.replace(fullMatch, variableDefinition);
                    // Store resolution metadata
                    resolutionMetadata[srcUri] = {
                        scheme: resolution.scheme,
                        content_type: resolution.content_type,
                        variable_name: variableName,
                        resolved_at: new Date().toISOString(),
                        ...(resolution.metadata || {})
                    };
                }
                else {
                    this.logger.error(`Failed to resolve ${srcUri}: ${resolution.error}`);
                    // Replace with error placeholder
                    const errorPlaceholder = `<!-- ERROR: Failed to resolve ${srcUri} - ${resolution.error} -->`;
                    resolvedContent = resolvedContent.replace(fullMatch, errorPlaceholder);
                }
            }
            return {
                ...template,
                template_content: resolvedContent,
                hint_metadata: {
                    ...template.hint_metadata,
                    data_resolutions: resolutionMetadata,
                    resolved_at: new Date().toISOString()
                }
            };
        }
        catch (error) {
            this.logger.error(`Failed to resolve POML template ${template.template_name}: ${error.message}`);
            return template; // Return original template on failure
        }
    }
    /**
     * Resolve individual data source based on URI scheme
     */
    async resolveDataSource(uri, componentType) {
        try {
            const parsedUri = new URL(uri);
            const scheme = parsedUri.protocol.replace(':', '');
            this.logger.debug(`Resolving URI: ${uri} with scheme: ${scheme}`);
            switch (scheme) {
                case DataSourceScheme.FILE:
                    return await this.resolveFileSource(parsedUri);
                case DataSourceScheme.HTTP:
                case DataSourceScheme.HTTPS:
                    return await this.resolveHttpSource(parsedUri);
                case DataSourceScheme.CEE:
                    return await this.resolveCEESource(parsedUri);
                case DataSourceScheme.DB:
                    return await this.resolveDBSource(parsedUri);
                case DataSourceScheme.STORAGE:
                    return await this.resolveStorageSource(parsedUri);
                default:
                    return {
                        scheme: scheme,
                        resolved_content: '',
                        content_type: 'text/plain',
                        success: false,
                        error: `Unsupported URI scheme: ${scheme}`
                    };
            }
        }
        catch (error) {
            return {
                scheme: DataSourceScheme.FILE, // Default fallback
                resolved_content: '',
                content_type: 'text/plain',
                success: false,
                error: `Invalid URI format: ${error.message}`
            };
        }
    }
    /**
     * Resolve file:// URIs from local filesystem
     */
    async resolveFileSource(uri) {
        try {
            const filePath = uri.pathname;
            const fileExt = path.extname(filePath).toLowerCase();
            // Security check: ensure file extension is allowed
            if (!this.allowedFileExtensions.includes(fileExt)) {
                return {
                    scheme: DataSourceScheme.FILE,
                    resolved_content: '',
                    content_type: 'text/plain',
                    success: false,
                    error: `File extension ${fileExt} not allowed`
                };
            }
            // Read file content
            const content = await fs.readFile(filePath, 'utf-8');
            // Size check
            if (content.length > this.maxContentSize) {
                return {
                    scheme: DataSourceScheme.FILE,
                    resolved_content: '',
                    content_type: 'text/plain',
                    success: false,
                    error: `File size exceeds maximum allowed size of ${this.maxContentSize} bytes`
                };
            }
            return {
                scheme: DataSourceScheme.FILE,
                resolved_content: content,
                content_type: this.getContentType(fileExt),
                success: true,
                metadata: {
                    file_path: filePath,
                    file_size: content.length,
                    file_extension: fileExt
                }
            };
        }
        catch (error) {
            return {
                scheme: DataSourceScheme.FILE,
                resolved_content: '',
                content_type: 'text/plain',
                success: false,
                error: `File read error: ${error.message}`
            };
        }
    }
    /**
     * Resolve HTTP/HTTPS URIs from web sources
     */
    async resolveHttpSource(uri) {
        try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), this.requestTimeout);
            const response = await fetch(uri.toString(), {
                signal: controller.signal,
                headers: {
                    'User-Agent': 'DACC-Data-Resolver/1.0'
                }
            });
            clearTimeout(timeoutId);
            if (!response.ok) {
                return {
                    scheme: uri.protocol.includes('https') ? DataSourceScheme.HTTPS : DataSourceScheme.HTTP,
                    resolved_content: '',
                    content_type: 'text/plain',
                    success: false,
                    error: `HTTP ${response.status}: ${response.statusText}`
                };
            }
            const content = await response.text();
            // Size check
            if (content.length > this.maxContentSize) {
                return {
                    scheme: uri.protocol.includes('https') ? DataSourceScheme.HTTPS : DataSourceScheme.HTTP,
                    resolved_content: '',
                    content_type: 'text/plain',
                    success: false,
                    error: `Content size exceeds maximum allowed size of ${this.maxContentSize} bytes`
                };
            }
            return {
                scheme: uri.protocol.includes('https') ? DataSourceScheme.HTTPS : DataSourceScheme.HTTP,
                resolved_content: content,
                content_type: response.headers.get('content-type') || 'text/plain',
                success: true,
                metadata: {
                    url: uri.toString(),
                    status: response.status,
                    headers: Object.fromEntries(response.headers.entries()),
                    content_length: content.length
                }
            };
        }
        catch (error) {
            return {
                scheme: uri.protocol.includes('https') ? DataSourceScheme.HTTPS : DataSourceScheme.HTTP,
                resolved_content: '',
                content_type: 'text/plain',
                success: false,
                error: `HTTP request failed: ${error.message}`
            };
        }
    }
    /**
     * Resolve cee:// URIs from Code Execution Environment
     */
    async resolveCEESource(uri) {
        // TODO: Integrate with existing CEE service
        // For now, return a placeholder implementation
        return {
            scheme: DataSourceScheme.CEE,
            resolved_content: `CEE artifact from ${uri.pathname}`,
            content_type: 'text/plain',
            success: true,
            metadata: {
                cee_path: uri.pathname,
                integration_status: 'placeholder'
            }
        };
    }
    /**
     * Resolve db:// URIs from database queries
     */
    async resolveDBSource(uri) {
        // TODO: Integrate with database service
        // For now, return a placeholder implementation
        return {
            scheme: DataSourceScheme.DB,
            resolved_content: `Database query result from ${uri.pathname}`,
            content_type: 'application/json',
            success: true,
            metadata: {
                db_connection: uri.hostname,
                query_path: uri.pathname,
                integration_status: 'placeholder'
            }
        };
    }
    /**
     * Resolve storage:// URIs from cloud storage
     */
    async resolveStorageSource(uri) {
        // TODO: Integrate with cloud storage service
        // For now, return a placeholder implementation
        return {
            scheme: DataSourceScheme.STORAGE,
            resolved_content: `Storage content from ${uri.pathname}`,
            content_type: 'text/plain',
            success: true,
            metadata: {
                bucket: uri.hostname,
                key: uri.pathname,
                integration_status: 'placeholder'
            }
        };
    }
    /**
     * Determine content type based on file extension
     */
    getContentType(extension) {
        const contentTypes = {
            '.txt': 'text/plain',
            '.json': 'application/json',
            '.yaml': 'application/x-yaml',
            '.yml': 'application/x-yaml',
            '.md': 'text/markdown',
            '.csv': 'text/csv',
            '.xml': 'application/xml',
            '.html': 'text/html'
        };
        return contentTypes[extension.toLowerCase()] || 'text/plain';
    }
    /**
     * Health check method
     */
    async getHealthStatus() {
        return {
            service: 'DACC Data Resolver',
            status: 'healthy',
            max_content_size: this.maxContentSize,
            request_timeout: this.requestTimeout,
            allowed_extensions: this.allowedFileExtensions,
            supported_schemes: Object.values(DataSourceScheme),
            timestamp: new Date().toISOString()
        };
    }
};
DACCDataResolverService = DACCDataResolverService_1 = __decorate([
    Injectable(),
    __metadata("design:paramtypes", [ConfigService])
], DACCDataResolverService);
export { DACCDataResolverService };
//# sourceMappingURL=data-resolver.service.js.map