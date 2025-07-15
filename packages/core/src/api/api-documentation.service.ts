import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as fs from 'fs';
import * as path from 'path';

export interface ApiDocumentationConfig {
  enabled: boolean;
  title: string;
  description: string;
  version: string;
  basePath: string;
  outputPath: string;
  servers: Array<{ url: string; description: string }>;
  securitySchemes: Record<string, any>;
  tags: Array<{ name: string; description: string }>;
}

@Injectable()
export class ApiDocumentationService implements OnModuleInit {
  private readonly logger = new Logger(ApiDocumentationService.name);
  private config: ApiDocumentationConfig;

  constructor(private readonly configService: ConfigService) {
    this.config = {
      enabled: this.configService.get<boolean>('api.documentation.enabled', true),
      title: this.configService.get<string>('api.documentation.title', 'API Documentation'),
      description: this.configService.get<string>('api.documentation.description', 'API Documentation'),
      version: this.configService.get<string>('api.documentation.version', '1.0.0'),
      basePath: this.configService.get<string>('api.documentation.basePath', '/api'),
      outputPath: this.configService.get<string>('api.documentation.outputPath', './docs/api'),
      servers: this.configService.get<Array<{ url: string; description: string }>>('api.documentation.servers', [
        { url: 'http://localhost:3000', description: 'Development server' }
      ]),
      securitySchemes: this.configService.get<Record<string, any>>('api.documentation.securitySchemes', {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer'
        }
      }),
      tags: this.configService.get<Array<{ name: string; description: string }>>('api.documentation.tags', [])
    };
  }

  async onModuleInit() {
    if (!this.config.enabled) {
      this.logger.info('API documentation generation is disabled');
      return;
    }

    this.logger.info('Initializing API documentation service');
    await this.generateDocumentation();
  }

  async generateDocumentation(): Promise<string> {
    try {
      const outputPath = path.join(this.config.outputPath, 'openapi.json');
      const documentation = this.buildOpenApiSpec();
      
      // Ensure output directory exists
      await fs.promises.mkdir(path.dirname(outputPath), { recursive: true });
      
      // Write documentation to file
      await fs.promises.writeFile(outputPath, JSON.stringify(documentation, null, 2));
      
      this.logger.info(`API documentation generated successfully: ${outputPath}`);
      return outputPath;
    } catch (error) {
      this.logger.error('Failed to generate API documentation', error);
      throw error;
    }
  }

  async generateVersionedDocumentation(versions: string[]): Promise<void> {
    try {
      for (const version of versions) {
        const outputPath = path.join(this.config.outputPath, `openapi-${version}.json`);
        const documentation = this.buildOpenApiSpec(version);
        
        await fs.promises.mkdir(path.dirname(outputPath), { recursive: true });
        await fs.promises.writeFile(outputPath, JSON.stringify(documentation, null, 2));
      }
      
      this.logger.info(`Generated versioned OpenAPI documentation for versions: ${versions.join(', ')}`);
    } catch (error) {
      this.logger.error('Failed to generate versioned API documentation', error);
      throw error;
    }
  }

  private buildOpenApiSpec(version?: string): any {
    return {
      openapi: '3.0.0',
      info: {
        title: this.config.title,
        description: this.config.description,
        version: version || this.config.version,
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
      paths: {},
      components: {
        securitySchemes: this.config.securitySchemes
      },
      tags: this.config.tags
    };
  }

  getConfig(): ApiDocumentationConfig {
    return this.config;
  }
}