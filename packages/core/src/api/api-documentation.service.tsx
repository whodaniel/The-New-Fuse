import { Injectable, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { CentralizedLoggingService } from '../logging/centralized-logging.service.js';
import { ApiVersioningService } from './api-versioning.service.js';
import * as fs from 'fs';
import * as path from 'path';
import * as util from 'util';

const writeFile = util.promisify(fs.writeFile);
const mkdir = util.promisify(fs.mkdir);

export interface ApiDocumentationConfig {
  enabled: boolean;
  title: string;
  description: string;
  version: string;
  basePath: string;
  outputPath: string;
  servers: { url: string; description: string }[];
  securitySchemes: Record<string, any>;
  tags: { name: string; description: string }[];
}

@Injectable()
export class ApiDocumentationService implements OnModuleInit {
  private readonly logger: any;
  private config: ApiDocumentationConfig;
  private openApiDocument: any;

  constructor(
    private readonly configService: ConfigService,
    private readonly loggingService: CentralizedLoggingService,
    private readonly versioningService: ApiVersioningService
  ) {
    this.logger = this.loggingService.createLogger('ApiDocumentation');
  }

  async onModuleInit() {
    // Load configuration
    this.config = {
      enabled: this.configService.get<boolean>('api.documentation.enabled', true),
      title: this.configService.get<string>('api.documentation.title', 'API Documentation'),
      description: this.configService.get<string>('api.documentation.description', 'API Documentation'),
      version: this.configService.get<string>('api.documentation.version', '1.0.0'),
      basePath: this.configService.get<string>('api.documentation.basePath', '/api'),
      outputPath: this.configService.get<string>('api.documentation.outputPath', 'docs/api'),
      servers: this.configService.get<{ url: string; description: string }[]>('api.documentation.servers', [
        { url: 'http://localhost:3000', description: 'Development server' }
      ]),
      securitySchemes: this.configService.get<Record<string, any>>('api.documentation.securitySchemes', {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT'
        }
      }),
      tags: this.configService.get<{ name: string; description: string }[]>('api.documentation.tags', [])
    };

    if (!this.config.enabled) {
      this.logger.info('API documentation is disabled');
      return;
    }

    // Initialize OpenAPI document
    this.initializeOpenApiDocument();
    
    this.logger.info('API documentation service initialized');
  }

  /**
   * Get the OpenAPI document
   */
  getOpenApiDocument(): any {
    return { ...this.openApiDocument };
  }

  /**
   * Add a path to the OpenAPI document
   */
  addPath(path: string, pathItem: any): void {
    if (!this.config.enabled) return;
    
    this.openApiDocument.paths[path] = {
      ...this.openApiDocument.paths[path],
      ...pathItem
    };
  }

  /**
   * Add a schema to the OpenAPI document
   */
  addSchema(name: string, schema: any): void {
    if (!this.config.enabled) return;
    
    this.openApiDocument.components.schemas[name] = schema;
  }

  /**
   * Add a tag to the OpenAPI document
   */
  addTag(tag: { name: string; description: string }): void {
    if (!this.config.enabled) return;
    
    // Check if tag already exists
    const existingTag = this.openApiDocument.tags.find((t: any) => t.name === tag.name);
    
    if (!existingTag) {
      this.openApiDocument.tags.push(tag);
    }
  }

  /**
   * Generate and save the OpenAPI document
   */
  async generateDocumentation(): Promise<string> {
    if (!this.config.enabled) {
      return '';
    }
    
    try {
      // Ensure output directory exists
      await mkdir(this.config.outputPath, { recursive: true });
      
      // Save OpenAPI document
      const outputPath = path.join(this.config.outputPath, 'openapi.json');
      await writeFile(outputPath, JSON.stringify(this.openApiDocument, null, 2));
      
      this.logger.info(`Generated OpenAPI documentation at ${outputPath}`);
      
      return outputPath;
    } catch (error) {
      this.logger.error('Failed to generate API documentation', { error });
      throw error;
    }
  }

  /**
   * Generate versioned OpenAPI documents
   */
  async generateVersionedDocumentation(): Promise<string[]> {
    if (!this.config.enabled) {
      return [];
    }
    
    try {
      // Ensure output directory exists
      await mkdir(this.config.outputPath, { recursive: true });
      
      const versions = this.versioningService.getSupportedVersions();
      const outputPaths: string[] = [];
      
      for (const version of versions) {
        // Create versioned document
        const versionedDocument = {
          ...this.openApiDocument,
          info: {
            ...this.openApiDocument.info,
            version: `${version}.0.0`,
            title: `${this.openApiDocument.info.title} (v${version})`
          }
        };
        
        // Add version-specific servers
        versionedDocument.servers = this.openApiDocument.servers.map((server: any) => ({
          ...server,
          url: server.url.replace('/api', `/api/v${version}`)
        }));
        
        // Save versioned document
        const outputPath = path.join(this.config.outputPath, `openapi-v${version}.json`);
        await writeFile(outputPath, JSON.stringify(versionedDocument, null, 2));
        
        outputPaths.push(outputPath);
      }
      
      this.logger.info(`Generated versioned OpenAPI documentation for versions: ${versions.join(', ')}`);
      
      return outputPaths;
    } catch (error) {
      this.logger.error('Failed to generate versioned API documentation', { error });
      throw error;
    }
  }

  /**
   * Private methods
   */

  private initializeOpenApiDocument(): void {
    this.openApiDocument = {
      openapi: '3.0.0',
      info: {
        title: this.config.title,
        description: this.config.description,
        version: this.config.version,
        contact: {
          name: this.configService.get<string>('api.documentation.contact.name', ''),
          email: this.configService.get<string>('api.documentation.contact.email', ''),
          url: this.configService.get<string>('api.documentation.contact.url', '')
        },
        license: {
          name: this.configService.get<string>('api.documentation.license.name', 'MIT'),
          url: this.configService.get<string>('api.documentation.license.url', '')
        }
      },
      servers: this.config.servers,
      tags: this.config.tags,
      paths: {},
      components: {
        schemas: {},
        securitySchemes: this.config.securitySchemes
      }
    };
  }
}
