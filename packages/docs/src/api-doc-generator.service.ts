// Auto-Generated API Documentation Service
// Generates comprehensive API documentation from type-safe repositories and controllers

import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { METHOD_METADATA, PATH_METADATA } from '@nestjs/common/constants';
import { ConfigService } from '@nestjs/config';
import { ModulesContainer, Reflector } from '@nestjs/core';
import { InstanceWrapper } from '@nestjs/core/injector/instance-wrapper';
import * as fs from 'fs';
import * as path from 'path';
import { RedisCacheService } from '../../cache/src/redis-cache.service';

// Documentation interfaces
export interface ApiDocumentation {
  info: {
    title: string;
    version: string;
    description: string;
    generatedAt: string;
    generatedBy: string;
  };
  servers: ApiServer[];
  endpoints: ApiEndpoint[];
  schemas: ApiSchema[];
  authentication: AuthenticationInfo;
  examples: ApiExample[];
  changelog: ChangelogEntry[];
}

export interface ApiServer {
  url: string;
  description: string;
  environment: 'development' | 'staging' | 'production';
}

export interface ApiEndpoint {
  id: string;
  path: string;
  method: string;
  summary: string;
  description: string;
  tags: string[];
  parameters: ApiParameter[];
  requestBody?: ApiRequestBody;
  responses: ApiResponse[];
  security: SecurityRequirement[];
  examples: EndpointExample[];
  deprecated: boolean;
  operationId: string;
  controller: string;
  handler: string;
  since: string;
}

export interface ApiParameter {
  name: string;
  in: 'path' | 'query' | 'header' | 'cookie';
  description: string;
  required: boolean;
  schema: TypeSchema;
  example?: any;
  deprecated?: boolean;
}

export interface ApiRequestBody {
  description: string;
  required: boolean;
  content: {
    [mediaType: string]: {
      schema: TypeSchema;
      example?: any;
      examples?: { [key: string]: any };
    };
  };
}

export interface ApiResponse {
  statusCode: number;
  description: string;
  headers?: { [name: string]: ApiHeader };
  content?: {
    [mediaType: string]: {
      schema: TypeSchema;
      example?: any;
      examples?: { [key: string]: any };
    };
  };
}

export interface ApiHeader {
  description: string;
  schema: TypeSchema;
  example?: any;
}

export interface TypeSchema {
  type: string;
  format?: string;
  description?: string;
  properties?: { [name: string]: TypeSchema };
  items?: TypeSchema;
  required?: string[];
  enum?: any[];
  example?: any;
  nullable?: boolean;
  readOnly?: boolean;
  writeOnly?: boolean;
  minimum?: number;
  maximum?: number;
  minLength?: number;
  maxLength?: number;
  pattern?: string;
  $ref?: string;
}

export interface ApiSchema {
  name: string;
  type: 'object' | 'enum' | 'union' | 'interface';
  description: string;
  properties: { [name: string]: SchemaProperty };
  required: string[];
  examples: any[];
  inheritance?: {
    extends?: string[];
    implements?: string[];
  };
  generics?: string[];
  deprecated?: boolean;
}

export interface SchemaProperty {
  name: string;
  type: string;
  description: string;
  required: boolean;
  nullable: boolean;
  readOnly: boolean;
  writeOnly: boolean;
  format?: string;
  enum?: any[];
  minimum?: number;
  maximum?: number;
  minLength?: number;
  maxLength?: number;
  pattern?: string;
  example?: any;
  deprecated?: boolean;
}

export interface AuthenticationInfo {
  types: AuthenticationType[];
  securitySchemes: { [name: string]: SecurityScheme };
}

export interface AuthenticationType {
  name: string;
  type: 'bearer' | 'apiKey' | 'oauth2' | 'basic';
  description: string;
  scheme?: string;
  bearerFormat?: string;
  flows?: OAuthFlows;
}

export interface SecurityScheme {
  type: string;
  description: string;
  name?: string;
  in?: string;
  scheme?: string;
  bearerFormat?: string;
  flows?: OAuthFlows;
}

export interface OAuthFlows {
  implicit?: OAuthFlow;
  password?: OAuthFlow;
  clientCredentials?: OAuthFlow;
  authorizationCode?: OAuthFlow;
}

export interface OAuthFlow {
  authorizationUrl?: string;
  tokenUrl?: string;
  refreshUrl?: string;
  scopes: { [scope: string]: string };
}

export interface SecurityRequirement {
  [name: string]: string[];
}

export interface ApiExample {
  name: string;
  description: string;
  category: 'request' | 'response' | 'workflow' | 'integration';
  content: {
    endpoint?: string;
    method?: string;
    request?: any;
    response?: any;
    code?: string;
    language?: string;
  };
  tags: string[];
}

export interface EndpointExample {
  name: string;
  description: string;
  request?: {
    parameters?: { [name: string]: any };
    body?: any;
    headers?: { [name: string]: string };
  };
  response?: {
    statusCode: number;
    body: any;
    headers?: { [name: string]: string };
  };
}

export interface ChangelogEntry {
  version: string;
  date: string;
  changes: ChangelogChange[];
}

export interface ChangelogChange {
  type: 'added' | 'changed' | 'deprecated' | 'removed' | 'fixed' | 'security';
  description: string;
  endpoint?: string;
  breakingChange: boolean;
}

// Documentation generation options
export interface DocGenerationOptions {
  outputPath: string;
  format: ('openapi' | 'markdown' | 'html' | 'json')[];
  includeExamples: boolean;
  includeSchemas: boolean;
  includeChangelog: boolean;
  generatePostmanCollection: boolean;
  generateSDK: boolean;
  validateTypes: boolean;
  customTemplates?: string;
}

@Injectable()
export class ApiDocGeneratorService implements OnModuleInit {
  private readonly logger = new Logger(ApiDocGeneratorService.name);

  private documentation: ApiDocumentation | null = null;
  private controllers: Map<string, any> = new Map();
  private schemas: Map<string, ApiSchema> = new Map();
  private endpoints: Map<string, ApiEndpoint> = new Map();

  // Configuration
  private readonly config = {
    defaultOutputPath: './docs/api',
    cacheKey: 'api_documentation',
    cacheTTL: 3600, // 1 hour
    supportedFormats: ['openapi', 'markdown', 'html', 'json'],
    templatePath: './templates',
  };

  constructor(
    private configService: ConfigService,
    private modulesContainer: ModulesContainer,
    private reflector: Reflector,
    private cacheService: RedisCacheService
  ) {}

  async onModuleInit(): Promise<void> {
    await this.discoverControllers();
    this.logger.log('API Documentation Generator initialized');
  }

  // Main documentation generation method
  async generateDocumentation(
    options: Partial<DocGenerationOptions> = {}
  ): Promise<ApiDocumentation> {
    const startTime = Date.now();

    const opts: DocGenerationOptions = {
      outputPath: this.config.defaultOutputPath,
      format: ['openapi', 'markdown'],
      includeExamples: true,
      includeSchemas: true,
      includeChangelog: true,
      generatePostmanCollection: false,
      generateSDK: false,
      validateTypes: true,
      ...options,
    };

    this.logger.log('Starting API documentation generation...');

    try {
      // Check cache first
      const cachedDoc = await this.getCachedDocumentation();
      if (cachedDoc && !this.shouldRegenerateDocumentation(cachedDoc)) {
        this.logger.log('Using cached documentation');
        return cachedDoc;
      }

      // Generate fresh documentation
      this.documentation = await this.buildDocumentation();

      // Generate output files
      for (const format of opts.format) {
        await this.generateOutput(format, opts);
      }

      // Generate additional artifacts
      if (opts.generatePostmanCollection) {
        await this.generatePostmanCollection(opts);
      }

      if (opts.generateSDK) {
        await this.generateSDK(opts);
      }

      // Cache the documentation
      await this.cacheDocumentation(this.documentation);

      const duration = Date.now() - startTime;
      this.logger.log(`API documentation generated successfully in ${duration}ms`);

      return this.documentation;
    } catch (error) {
      this.logger.error('Error generating API documentation:', error);
      throw error;
    }
  }

  // Build comprehensive documentation
  private async buildDocumentation(): Promise<ApiDocumentation> {
    const info = this.buildDocumentationInfo();
    const servers = this.buildServerInfo();
    const endpoints = await this.buildEndpoints();
    const schemas = await this.buildSchemas();
    const authentication = this.buildAuthenticationInfo();
    const examples = await this.buildExamples();
    const changelog = await this.buildChangelog();

    return {
      info,
      servers,
      endpoints,
      schemas,
      authentication,
      examples,
      changelog,
    };
  }

  private buildDocumentationInfo() {
    const packageJson = this.loadPackageJson();

    return {
      title: packageJson.name || 'The New Fuse API',
      version: packageJson.version || '1.0.0',
      description: packageJson.description || 'Comprehensive API for The New Fuse platform',
      generatedAt: new Date().toISOString(),
      generatedBy: 'API Documentation Generator v1.0.0',
    };
  }

  private buildServerInfo(): ApiServer[] {
    return [
      {
        url: this.configService.get('API_BASE_URL', 'http://localhost:3000'),
        description: 'Development server',
        environment: 'development',
      },
      {
        url: this.configService.get('STAGING_API_URL', 'https://staging-api.example.com'),
        description: 'Staging server',
        environment: 'staging',
      },
      {
        url: this.configService.get('PRODUCTION_API_URL', 'https://api.example.com'),
        description: 'Production server',
        environment: 'production',
      },
    ];
  }

  // Controller discovery
  private async discoverControllers(): Promise<void> {
    const controllers = [...this.modulesContainer.values()]
      .map((module) => (module.controllers ? [...module.controllers.values()] : []))
      .reduce((acc, controllers) => acc.concat(controllers), []);

    for (const wrapper of controllers) {
      if (wrapper.metatype && this.isController(wrapper.metatype)) {
        const controllerMetadata = this.extractControllerMetadata(wrapper);
        this.controllers.set(controllerMetadata.name, controllerMetadata);
      }
    }

    this.logger.debug(`Discovered ${this.controllers.size} controllers`);
  }

  private isController(metatype: any): boolean {
    return Reflect.getMetadata('__controller__', metatype);
  }

  private extractControllerMetadata(wrapper: InstanceWrapper): any {
    const { metatype } = wrapper;
    const controllerPath = Reflect.getMetadata(PATH_METADATA, metatype) || '';
    const controllerName = metatype.name;

    const methods = Object.getOwnPropertyNames(metatype.prototype)
      .filter((method) => method !== 'constructor')
      .map((methodName) =>
        this.extractMethodMetadata(metatype.prototype, methodName, controllerPath)
      )
      .filter(Boolean);

    return {
      name: controllerName,
      path: controllerPath,
      methods,
      class: metatype,
    };
  }

  private extractMethodMetadata(prototype: any, methodName: string, controllerPath: string): any {
    const httpMethod = Reflect.getMetadata(METHOD_METADATA, prototype[methodName]);
    const methodPath = Reflect.getMetadata(PATH_METADATA, prototype[methodName]) || '';

    if (!httpMethod) return null;

    const fullPath = this.combinePaths(controllerPath, methodPath);

    // Extract additional metadata from decorators
    const summary = this.extractApiOperationSummary(prototype, methodName);
    const description = this.extractApiOperationDescription(prototype, methodName);
    const tags = this.extractApiTags(prototype, methodName);
    const parameters = this.extractParameters(prototype, methodName);
    const responses = this.extractResponses(prototype, methodName);
    const security = this.extractSecurity(prototype, methodName);
    const deprecated = this.extractDeprecated(prototype, methodName);

    return {
      name: methodName,
      httpMethod: httpMethod.toLowerCase(),
      path: fullPath,
      summary,
      description,
      tags,
      parameters,
      responses,
      security,
      deprecated,
    };
  }

  // Endpoint building
  private async buildEndpoints(): Promise<ApiEndpoint[]> {
    const endpoints: ApiEndpoint[] = [];

    for (const [controllerName, controller] of this.controllers) {
      for (const method of controller.methods) {
        const endpoint: ApiEndpoint = {
          id: this.generateEndpointId(controller.path, method.path, method.httpMethod),
          path: method.path,
          method: method.httpMethod.toUpperCase(),
          summary: method.summary || `${method.httpMethod.toUpperCase()} ${method.path}`,
          description: method.description || '',
          tags: method.tags || [controllerName.replace('Controller', '')],
          parameters: await this.buildEndpointParameters(method),
          requestBody: await this.buildRequestBody(method),
          responses: await this.buildEndpointResponses(method),
          security: method.security || [],
          examples: await this.buildEndpointExamples(method),
          deprecated: method.deprecated || false,
          operationId: `${controllerName}_${method.name}`,
          controller: controllerName,
          handler: method.name,
          since: '1.0.0', // Would extract from version control or metadata
        };

        endpoints.push(endpoint);
      }
    }

    return endpoints.sort((a, b) => a.path.localeCompare(b.path));
  }

  private async buildEndpointParameters(method: any): Promise<ApiParameter[]> {
    // Extract parameters from method signatures and decorators
    const parameters: ApiParameter[] = [];

    // Path parameters
    const pathParams = this.extractPathParameters(method.path);
    for (const param of pathParams) {
      parameters.push({
        name: param,
        in: 'path',
        description: `${param} parameter`,
        required: true,
        schema: { type: 'string' },
      });
    }

    // Query parameters (from @Query decorators)
    const queryParams = this.extractQueryParameters(method);
    parameters.push(...queryParams);

    // Header parameters (from @Headers decorators)
    const headerParams = this.extractHeaderParameters(method);
    parameters.push(...headerParams);

    return parameters;
  }

  private async buildRequestBody(method: any): Promise<ApiRequestBody | undefined> {
    const bodyParam = this.extractBodyParameter(method);
    if (!bodyParam) return undefined;

    return {
      description: 'Request body',
      required: true,
      content: {
        'application/json': {
          schema: await this.buildTypeSchema(bodyParam.type),
          example: this.generateExampleFromType(bodyParam.type),
        },
      },
    };
  }

  private async buildEndpointResponses(method: any): Promise<ApiResponse[]> {
    const responses: ApiResponse[] = [];

    // Default success response
    responses.push({
      statusCode: 200,
      description: 'Successful response',
      content: {
        'application/json': {
          schema: await this.buildResponseSchema(method),
          example: this.generateResponseExample(method),
        },
      },
    });

    // Common error responses
    responses.push(
      {
        statusCode: 400,
        description: 'Bad Request',
        content: {
          'application/json': {
            schema: this.buildErrorSchema(),
            example: { message: 'Invalid request parameters', statusCode: 400 },
          },
        },
      },
      {
        statusCode: 401,
        description: 'Unauthorized',
        content: {
          'application/json': {
            schema: this.buildErrorSchema(),
            example: { message: 'Authentication required', statusCode: 401 },
          },
        },
      },
      {
        statusCode: 500,
        description: 'Internal Server Error',
        content: {
          'application/json': {
            schema: this.buildErrorSchema(),
            example: { message: 'Internal server error', statusCode: 500 },
          },
        },
      }
    );

    return responses;
  }

  // Schema building
  private async buildSchemas(): Promise<ApiSchema[]> {
    const schemas: ApiSchema[] = [];

    // Extract schemas from discovered types
    for (const [controllerName, controller] of this.controllers) {
      for (const method of controller.methods) {
        const methodSchemas = await this.extractSchemasFromMethod(method);
        schemas.push(...methodSchemas);
      }
    }

    // Add common schemas
    schemas.push(
      this.buildErrorResponseSchema(),
      this.buildPaginationSchema(),
      this.buildMetadataSchema()
    );

    return this.deduplicateSchemas(schemas);
  }

  private buildErrorResponseSchema(): ApiSchema {
    return {
      name: 'ErrorResponse',
      type: 'object',
      description: 'Standard error response format',
      properties: {
        message: {
          name: 'message',
          type: 'string',
          description: 'Error message',
          required: true,
          nullable: false,
          readOnly: true,
          writeOnly: false,
        },
        statusCode: {
          name: 'statusCode',
          type: 'number',
          description: 'HTTP status code',
          required: true,
          nullable: false,
          readOnly: true,
          writeOnly: false,
        },
        timestamp: {
          name: 'timestamp',
          type: 'string',
          description: 'Error timestamp',
          required: false,
          nullable: false,
          readOnly: true,
          writeOnly: false,
          format: 'date-time',
        },
      },
      required: ['message', 'statusCode'],
      examples: [
        {
          message: 'Resource not found',
          statusCode: 404,
          timestamp: '2023-01-01T00:00:00.000Z',
        },
      ],
    };
  }

  private buildPaginationSchema(): ApiSchema {
    return {
      name: 'PaginationMeta',
      type: 'object',
      description: 'Pagination metadata',
      properties: {
        page: {
          name: 'page',
          type: 'number',
          description: 'Current page number',
          required: true,
          nullable: false,
          readOnly: true,
          writeOnly: false,
          minimum: 1,
        },
        limit: {
          name: 'limit',
          type: 'number',
          description: 'Items per page',
          required: true,
          nullable: false,
          readOnly: true,
          writeOnly: false,
          minimum: 1,
          maximum: 100,
        },
        total: {
          name: 'total',
          type: 'number',
          description: 'Total number of items',
          required: true,
          nullable: false,
          readOnly: true,
          writeOnly: false,
        },
        pages: {
          name: 'pages',
          type: 'number',
          description: 'Total number of pages',
          required: true,
          nullable: false,
          readOnly: true,
          writeOnly: false,
        },
      },
      required: ['page', 'limit', 'total', 'pages'],
      examples: [
        {
          page: 1,
          limit: 20,
          total: 100,
          pages: 5,
        },
      ],
    };
  }

  private buildMetadataSchema(): ApiSchema {
    return {
      name: 'ResponseMetadata',
      type: 'object',
      description: 'Response metadata',
      properties: {
        requestId: {
          name: 'requestId',
          type: 'string',
          description: 'Unique request identifier',
          required: false,
          nullable: false,
          readOnly: true,
          writeOnly: false,
        },
        timestamp: {
          name: 'timestamp',
          type: 'string',
          description: 'Response timestamp',
          required: false,
          nullable: false,
          readOnly: true,
          writeOnly: false,
          format: 'date-time',
        },
        version: {
          name: 'version',
          type: 'string',
          description: 'API version',
          required: false,
          nullable: false,
          readOnly: true,
          writeOnly: false,
        },
      },
      required: [],
      examples: [
        {
          requestId: 'req_123456789',
          timestamp: '2023-01-01T00:00:00.000Z',
          version: '1.0.0',
        },
      ],
    };
  }

  // Authentication info
  private buildAuthenticationInfo(): AuthenticationInfo {
    return {
      types: [
        {
          name: 'JWT Bearer Token',
          type: 'bearer',
          description: 'JWT token-based authentication',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        },
        {
          name: 'API Key',
          type: 'apiKey',
          description: 'API key authentication via header',
        },
      ],
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          description: 'JWT Bearer token authentication',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        },
        apiKeyAuth: {
          type: 'apiKey',
          description: 'API key authentication',
          name: 'X-API-Key',
          in: 'header',
        },
      },
    };
  }

  // Examples building
  private async buildExamples(): Promise<ApiExample[]> {
    const examples: ApiExample[] = [];

    // Generate examples for each endpoint
    for (const endpoint of this.endpoints.values()) {
      const endpointExamples = await this.generateEndpointExamples(endpoint);
      examples.push(...endpointExamples);
    }

    // Add workflow examples
    const workflowExamples = await this.generateWorkflowExamples();
    examples.push(...workflowExamples);

    return examples;
  }

  private async generateEndpointExamples(endpoint: ApiEndpoint): Promise<ApiExample[]> {
    const examples: ApiExample[] = [];

    // Request example
    examples.push({
      name: `${endpoint.method} ${endpoint.path} - Request`,
      description: `Example request for ${endpoint.summary}`,
      category: 'request',
      content: {
        endpoint: endpoint.path,
        method: endpoint.method,
        request: this.generateRequestExample(endpoint),
      },
      tags: endpoint.tags,
    });

    // Response example
    examples.push({
      name: `${endpoint.method} ${endpoint.path} - Response`,
      description: `Example response for ${endpoint.summary}`,
      category: 'response',
      content: {
        endpoint: endpoint.path,
        method: endpoint.method,
        response: this.generateResponseExample(endpoint),
      },
      tags: endpoint.tags,
    });

    return examples;
  }

  private async generateWorkflowExamples(): Promise<ApiExample[]> {
    return [
      {
        name: 'Create and Execute Workflow',
        description: 'Complete workflow creation and execution example',
        category: 'workflow',
        content: {
          code: `
// 1. Create a new workflow
const workflow = await fetch('/api/workflows', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    name: 'Data Processing Workflow',
    description: 'Process incoming data through multiple agents',
    steps: [
      { name: 'Validate', agent: 'validator' },
      { name: 'Transform', agent: 'transformer' },
      { name: 'Store', agent: 'storage' }
    ]
  })
}).then(r => r.json());

// 2. Execute the workflow
const execution = await fetch(\`/api/workflows/\${workflow.id}/execute\`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    input: { data: 'sample data' }
  })
}).then(r => r.json());

// 3. Monitor execution status
const status = await fetch(\`/api/workflows/\${workflow.id}/executions/\${execution.id}\`)
  .then(r => r.json());
`,
          language: 'javascript',
        },
        tags: ['workflow', 'agent', 'execution'],
      },
      {
        name: 'Agent Communication Pattern',
        description: 'Example of agent-to-agent communication',
        category: 'integration',
        content: {
          code: `
// Agent registration
const agent = await fetch('/api/agents', {
  method: 'POST',
  body: JSON.stringify({
    name: 'Data Processor',
    type: 'worker',
    capabilities: ['data_processing', 'validation']
  })
}).then(r => r.json());

// Send message to another agent
const message = await fetch('/api/agents/communicate', {
  method: 'POST',
  body: JSON.stringify({
    fromAgent: agent.id,
    toAgent: 'coordinator_agent',
    type: 'task_complete',
    payload: { taskId: 'task_123', result: 'success' }
  })
}).then(r => r.json());
`,
          language: 'javascript',
        },
        tags: ['agent', 'communication', 'a2a'],
      },
    ];
  }

  // Changelog building
  private async buildChangelog(): Promise<ChangelogEntry[]> {
    // In a real implementation, this would read from version control or changelog files
    return [
      {
        version: '1.0.0',
        date: '2023-01-01',
        changes: [
          {
            type: 'added',
            description: 'Initial API release with agent and workflow management',
            breakingChange: false,
          },
          {
            type: 'added',
            description: 'Authentication and authorization system',
            breakingChange: false,
          },
          {
            type: 'added',
            description: 'Real-time agent communication via WebSocket',
            breakingChange: false,
          },
        ],
      },
    ];
  }

  // Output generation
  private async generateOutput(format: string, options: DocGenerationOptions): Promise<void> {
    switch (format) {
      case 'openapi':
        await this.generateOpenAPISpec(options);
        break;
      case 'markdown':
        await this.generateMarkdownDocs(options);
        break;
      case 'html':
        await this.generateHTMLDocs(options);
        break;
      case 'json':
        await this.generateJSONDocs(options);
        break;
      default:
        this.logger.warn(`Unsupported format: ${format}`);
    }
  }

  private async generateOpenAPISpec(options: DocGenerationOptions): Promise<void> {
    if (!this.documentation) return;

    const openApiSpec = {
      openapi: '3.0.3',
      info: this.documentation.info,
      servers: this.documentation.servers,
      paths: this.buildOpenAPIPaths(),
      components: {
        schemas: this.buildOpenAPISchemas(),
        securitySchemes: this.documentation.authentication.securitySchemes,
      },
    };

    const outputPath = path.join(options.outputPath, 'openapi.json');
    await this.ensureDirectoryExists(path.dirname(outputPath));
    await fs.promises.writeFile(outputPath, JSON.stringify(openApiSpec, null, 2));

    this.logger.log(`OpenAPI spec generated: ${outputPath}`);
  }

  private async generateMarkdownDocs(options: DocGenerationOptions): Promise<void> {
    if (!this.documentation) return;

    const markdown = this.buildMarkdownDocumentation();
    const outputPath = path.join(options.outputPath, 'README.md');

    await this.ensureDirectoryExists(path.dirname(outputPath));
    await fs.promises.writeFile(outputPath, markdown);

    this.logger.log(`Markdown documentation generated: ${outputPath}`);
  }

  private async generateHTMLDocs(options: DocGenerationOptions): Promise<void> {
    if (!this.documentation) return;

    const html = await this.buildHTMLDocumentation();
    const outputPath = path.join(options.outputPath, 'index.html');

    await this.ensureDirectoryExists(path.dirname(outputPath));
    await fs.promises.writeFile(outputPath, html);

    this.logger.log(`HTML documentation generated: ${outputPath}`);
  }

  private async generateJSONDocs(options: DocGenerationOptions): Promise<void> {
    if (!this.documentation) return;

    const outputPath = path.join(options.outputPath, 'documentation.json');
    await this.ensureDirectoryExists(path.dirname(outputPath));
    await fs.promises.writeFile(outputPath, JSON.stringify(this.documentation, null, 2));

    this.logger.log(`JSON documentation generated: ${outputPath}`);
  }

  // Additional artifact generation
  private async generatePostmanCollection(options: DocGenerationOptions): Promise<void> {
    if (!this.documentation) return;

    const collection = this.buildPostmanCollection();
    const outputPath = path.join(options.outputPath, 'postman-collection.json');

    await this.ensureDirectoryExists(path.dirname(outputPath));
    await fs.promises.writeFile(outputPath, JSON.stringify(collection, null, 2));

    this.logger.log(`Postman collection generated: ${outputPath}`);
  }

  private async generateSDK(options: DocGenerationOptions): Promise<void> {
    if (!this.documentation) return;

    // Generate TypeScript SDK
    const tsSDK = this.buildTypeScriptSDK();
    const tsOutputPath = path.join(options.outputPath, 'sdk', 'typescript');

    await this.ensureDirectoryExists(tsOutputPath);
    await fs.promises.writeFile(path.join(tsOutputPath, 'index.ts'), tsSDK);

    this.logger.log(`TypeScript SDK generated: ${tsOutputPath}`);
  }

  // Utility methods
  private combinePaths(basePath: string, methodPath: string): string {
    const base = basePath.replace(/\/$/, '');
    const method = methodPath.replace(/^\//, '');
    return method ? `${base}/${method}` : base;
  }

  private generateEndpointId(
    controllerPath: string,
    methodPath: string,
    httpMethod: string
  ): string {
    const fullPath = this.combinePaths(controllerPath, methodPath);
    return `${httpMethod.toLowerCase()}_${fullPath.replace(/[\/{}]/g, '_')}`;
  }

  private extractPathParameters(path: string): string[] {
    const matches = path.match(/:(\w+)/g);
    return matches ? matches.map((match) => match.substring(1)) : [];
  }

  private async ensureDirectoryExists(dirPath: string): Promise<void> {
    try {
      await fs.promises.access(dirPath);
    } catch {
      await fs.promises.mkdir(dirPath, { recursive: true });
    }
  }

  // Cache management
  private async getCachedDocumentation(): Promise<ApiDocumentation | null> {
    try {
      return await this.cacheService.get(this.config.cacheKey);
    } catch (error) {
      this.logger.warn('Error loading cached documentation:', error);
      return null;
    }
  }

  private async cacheDocumentation(documentation: ApiDocumentation): Promise<void> {
    try {
      await this.cacheService.set(this.config.cacheKey, documentation, {
        ttl: this.config.cacheTTL,
      });
    } catch (error) {
      this.logger.warn('Error caching documentation:', error);
    }
  }

  private shouldRegenerateDocumentation(cachedDoc: ApiDocumentation): boolean {
    const cacheAge = Date.now() - new Date(cachedDoc.info.generatedAt).getTime();
    return cacheAge > this.config.cacheTTL * 1000;
  }

  // Helper methods for metadata extraction
  private extractApiOperationSummary(prototype: any, methodName: string): string {
    // Extract from @ApiOperation decorator
    return 'API Operation Summary'; // Placeholder
  }

  private extractApiOperationDescription(prototype: any, methodName: string): string {
    // Extract from @ApiOperation decorator
    return 'API Operation Description'; // Placeholder
  }

  private extractApiTags(prototype: any, methodName: string): string[] {
    // Extract from @ApiTags decorator
    return []; // Placeholder
  }

  private extractParameters(prototype: any, methodName: string): any[] {
    // Extract from parameter decorators
    return []; // Placeholder
  }

  private extractResponses(prototype: any, methodName: string): any[] {
    // Extract from @ApiResponse decorators
    return []; // Placeholder
  }

  private extractSecurity(prototype: any, methodName: string): any[] {
    // Extract from security decorators
    return []; // Placeholder
  }

  private extractDeprecated(prototype: any, methodName: string): boolean {
    // Extract from @Deprecated decorator
    return false; // Placeholder
  }

  private extractQueryParameters(method: any): ApiParameter[] {
    // Extract query parameters from method
    return []; // Placeholder
  }

  private extractHeaderParameters(method: any): ApiParameter[] {
    // Extract header parameters from method
    return []; // Placeholder
  }

  private extractBodyParameter(method: any): any {
    // Extract body parameter from method
    return null; // Placeholder
  }

  private async buildTypeSchema(type: any): Promise<TypeSchema> {
    // Build schema from TypeScript type
    return { type: 'object' }; // Placeholder
  }

  private generateExampleFromType(type: any): any {
    // Generate example from TypeScript type
    return {}; // Placeholder
  }

  private async buildResponseSchema(method: any): Promise<TypeSchema> {
    // Build response schema from method return type
    return { type: 'object' }; // Placeholder
  }

  private generateResponseExample(method: any): any {
    // Generate response example
    return {}; // Placeholder
  }

  private buildErrorSchema(): TypeSchema {
    return {
      type: 'object',
      properties: {
        message: { type: 'string' },
        statusCode: { type: 'number' },
        timestamp: { type: 'string', format: 'date-time' },
      },
      required: ['message', 'statusCode'],
    };
  }

  private async extractSchemasFromMethod(method: any): Promise<ApiSchema[]> {
    // Extract schemas from method parameters and return types
    return []; // Placeholder
  }

  private deduplicateSchemas(schemas: ApiSchema[]): ApiSchema[] {
    const seen = new Set<string>();
    return schemas.filter((schema) => {
      if (seen.has(schema.name)) {
        return false;
      }
      seen.add(schema.name);
      return true;
    });
  }

  private buildOpenAPIPaths(): any {
    // Build OpenAPI paths object
    return {}; // Placeholder
  }

  private buildOpenAPISchemas(): any {
    // Build OpenAPI schemas object
    return {}; // Placeholder
  }

  private buildMarkdownDocumentation(): string {
    // Build markdown documentation
    return '# API Documentation\n\nGenerated documentation...'; // Placeholder
  }

  private async buildHTMLDocumentation(): Promise<string> {
    // Build HTML documentation
    return '<html><body><h1>API Documentation</h1></body></html>'; // Placeholder
  }

  private buildPostmanCollection(): any {
    // Build Postman collection
    return { info: { name: 'API Collection' } }; // Placeholder
  }

  private buildTypeScriptSDK(): string {
    // Build TypeScript SDK
    return '// TypeScript SDK\nexport class ApiClient {}'; // Placeholder
  }

  private generateRequestExample(endpoint: any): any {
    // Generate request example for endpoint
    return {}; // Placeholder
  }

  private generateResponseExample(endpoint: any): any {
    // Generate response example for endpoint
    return {}; // Placeholder
  }

  private async buildEndpointExamples(method: any): Promise<EndpointExample[]> {
    // Build examples for endpoint
    return []; // Placeholder
  }

  private loadPackageJson(): any {
    try {
      const packagePath = path.join(process.cwd(), 'package.json');
      return JSON.parse(fs.readFileSync(packagePath, 'utf-8'));
    } catch {
      return {};
    }
  }

  // Public API for manual generation
  async regenerateDocumentation(): Promise<ApiDocumentation> {
    // Clear cache and regenerate
    await this.cacheService.delete(this.config.cacheKey);
    return this.generateDocumentation();
  }

  async getDocumentationStatus(): Promise<{
    cached: boolean;
    lastGenerated?: string;
    controllersCount: number;
    endpointsCount: number;
  }> {
    const cached = await this.getCachedDocumentation();

    return {
      cached: !!cached,
      lastGenerated: cached?.info.generatedAt,
      controllersCount: this.controllers.size,
      endpointsCount: this.endpoints.size,
    };
  }
}
