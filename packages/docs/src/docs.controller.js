// Documentation Controller - REST API endpoints for auto-generated documentation
// Provides endpoints for generating, viewing, and managing API documentation
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
var _a;
import { Controller, Get, Res, UseInterceptors, Header, } from '@nestjs/common';
import { ApiTags, ApiExcludeEndpoint, } from '@nestjs/swagger';
import { PerformanceInterceptor } from '../interceptors/performance.interceptor';
import { ApiDocGeneratorService, ApiDocumentation, } from './api-doc-generator.service';
let DocsController = class DocsController {
    docGeneratorService;
    constructor(docGeneratorService) {
        this.docGeneratorService = docGeneratorService;
    }
    // Public documentation endpoints (no auth required)
    async getOpenAPISpec(res) {
        try {
            const documentation = await this.docGeneratorService.generateDocumentation({
                format: ['openapi'],
            });
            const openApiSpec = this.convertToOpenAPI(documentation);
            res.json(openApiSpec);
        }
        catch (error) {
            res.status(500).json({ error: 'Failed to generate OpenAPI specification' });
        }
    }
    async getSwaggerUI(res) {
        const swaggerHTML = `
<!DOCTYPE html>
<html>
<head>
  <title>The New Fuse API Documentation</title>
  <link rel="stylesheet" type="text/css" href="https://unpkg.com/swagger-ui-dist@4.15.5/swagger-ui.css" />
  <style>
    html { box-sizing: border-box; overflow: -moz-scrollbars-vertical; overflow-y: scroll; }
    *, *:before, *:after { box-sizing: inherit; }
    body { margin:0; background: #fafafa; }
  </style>
</head>
<body>
  <div id="swagger-ui"></div>
  <script src="https://unpkg.com/swagger-ui-dist@4.15.5/swagger-ui-bundle.js"></script>
  <script src="https://unpkg.com/swagger-ui-dist@4.15.5/swagger-ui-standalone-preset.js"></script>
  <script>
    window.onload = function() {
      const ui = SwaggerUIBundle({
        url: '/api/docs/openapi.json',
        dom_id: '#swagger-ui',
        deepLinking: true,
        presets: [
          SwaggerUIBundle.presets.apis,
          SwaggerUIStandalonePreset
        ],
        plugins: [
          SwaggerUIBundle.plugins.DownloadUrl
        ],
        layout: "StandaloneLayout",
        validatorUrl: null,
        docExpansion: "list",
        operationsSorter: "alpha",
        tagsSorter: "alpha"
      });
    };
  </script>
</body>
</html>;
    res.send(swaggerHTML);
  }

  @Get('redoc')
  @ApiExcludeEndpoint()
  @Header('Content-Type', 'text/html')
  async getRedocUI(@Res() res: Response): Promise<void> {
    const redocHTML = 
<!DOCTYPE html>
<html>
<head>
  <title>The New Fuse API Documentation</title>
  <meta charset="utf-8"/>
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <link href="https://fonts.googleapis.com/css?family=Montserrat:300,400,700|Roboto:300,400,700" rel="stylesheet">
  <style>
    body { margin: 0; padding: 0; }
  </style>
</head>
<body>
  <redoc spec-url='/api/docs/openapi.json' theme='{ "colors": { "primary": { "main": "#1976d2" } } }'></redoc>
  <script src="https://cdn.jsdelivr.net/npm/redoc@2.0.0/bundles/redoc.standalone.js"></script>
</body>
</html>;
    res.send(redocHTML);
  }

  @Get('postman')
  @ApiExcludeEndpoint()
  @Header('Content-Type', 'application/json')
  @Header('Content-Disposition', 'attachment; filename="api-collection.json"')
  async getPostmanCollection(@Res() res: Response): Promise<void> {
    try {
      await this.docGeneratorService.generateDocumentation({
        format: [],
        generatePostmanCollection: true,
      });
      
      // In real implementation, would read the generated Postman collection file
      const collection = {
        info: {
          name: 'The New Fuse API',
          description: 'Generated Postman collection for The New Fuse API',
          schema: 'https://schema.getpostman.com/json/collection/v2.1.0/collection.json',
        },
        item: [],
      };
      
      res.json(collection);
    } catch (error) {
      res.status(500).json({ error: 'Failed to generate Postman collection' });
    }
  }

  // Protected documentation management endpoints
  @Get()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Get complete API documentation',
    description: 'Returns the complete auto-generated API documentation with all schemas, endpoints, and examples',
  })
  @ApiQuery({
    name: 'format',
    required: false,
    enum: ['json', 'openapi'],
    description: 'Response format',
  })
  @ApiResponse({
    status: 200,
    description: 'API documentation retrieved successfully',
  })
  async getDocumentation(
    @Query('format') format: 'json' | 'openapi' = 'json',
    @CurrentUser() user: User,
  ): Promise<ApiDocumentation | any> {
    const documentation = await this.docGeneratorService.generateDocumentation();
    
    if (format === 'openapi') {
      return this.convertToOpenAPI(documentation);
    }
    
    return documentation;
  }

  @Post('generate')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Generate API documentation',
    description: 'Generates fresh API documentation with specified options',
  })
  @ApiResponse({
    status: 200,
    description: 'Documentation generated successfully',
  })
  async generateDocumentation(
    @Body() options: Partial<DocGenerationOptions>,
    @CurrentUser() user: User,
  ): Promise<{
    success: boolean;
    message: string;
    documentation: ApiDocumentation;
    generatedFiles: string[];
  }> {
    const documentation = await this.docGeneratorService.generateDocumentation(options);
    
    const generatedFiles = [];
    if (options.format?.includes('openapi')) generatedFiles.push('openapi.json');
    if (options.format?.includes('markdown')) generatedFiles.push('README.md');
    if (options.format?.includes('html')) generatedFiles.push('index.html');
    if (options.generatePostmanCollection) generatedFiles.push('postman-collection.json');
    if (options.generateSDK) generatedFiles.push('sdk/typescript/index.ts');
    
    return {
      success: true,
      message: 'Documentation generated successfully',
      documentation,
      generatedFiles,
    };
  }

  @Put('regenerate')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Regenerate API documentation',
    description: 'Forces regeneration of API documentation, clearing cache',
  })
  @ApiResponse({
    status: 200,
    description: 'Documentation regenerated successfully',
  })
  async regenerateDocumentation(
    @CurrentUser() user: User,
  ): Promise<{
    success: boolean;
    message: string;
    documentation: ApiDocumentation;
  }> {
    const documentation = await this.docGeneratorService.regenerateDocumentation();
    
    return {
      success: true,
      message: 'Documentation regenerated successfully',
      documentation,
    };
  }

  @Get('status')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Get documentation generation status',
    description: 'Returns information about the current state of documentation generation',
  })
  @ApiResponse({
    status: 200,
    description: 'Documentation status retrieved successfully',
  })
  async getDocumentationStatus(
    @CurrentUser() user: User,
  ): Promise<{
    cached: boolean;
    lastGenerated?: string;
    controllersCount: number;
    endpointsCount: number;
    availableFormats: string[];
    cacheStatus: string;
  }> {
    const status = await this.docGeneratorService.getDocumentationStatus();
    
    return {
      ...status,
      availableFormats: ['openapi', 'markdown', 'html', 'json'],
      cacheStatus: status.cached ? 'cached' : 'not_cached',
    };
  }

  @Get('endpoints')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Get all API endpoints',
    description: 'Returns a list of all discovered API endpoints with metadata',
  })
  @ApiQuery({
    name: 'controller',
    required: false,
    description: 'Filter by controller name',
  })
  @ApiQuery({
    name: 'method',
    required: false,
    enum: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
    description: 'Filter by HTTP method',
  })
  @ApiQuery({
    name: 'tag',
    required: false,
    description: 'Filter by tag',
  })
  @ApiResponse({
    status: 200,
    description: 'Endpoints retrieved successfully',
  })
  async getEndpoints(
    @Query('controller') controller?: string,
    @Query('method') method?: string,
    @Query('tag') tag?: string,
    @CurrentUser() user: User,
  ): Promise<{
    endpoints: any[];
    totalCount: number;
    filters: {
      controller?: string;
      method?: string;
      tag?: string;
    };
  }> {
    const documentation = await this.docGeneratorService.generateDocumentation();
    let endpoints = documentation.endpoints;
    
    // Apply filters
    if (controller) {
      endpoints = endpoints.filter(ep => ep.controller.toLowerCase().includes(controller.toLowerCase()));
    }
    
    if (method) {
      endpoints = endpoints.filter(ep => ep.method === method.toUpperCase());
    }
    
    if (tag) {
      endpoints = endpoints.filter(ep => ep.tags.some(t => t.toLowerCase().includes(tag.toLowerCase())));
    }
    
    return {
      endpoints,
      totalCount: endpoints.length,
      filters: { controller, method, tag },
    };
  }

  @Get('schemas')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Get all API schemas',
    description: 'Returns all discovered API schemas and type definitions',
  })
  @ApiQuery({
    name: 'search',
    required: false,
    description: 'Search schema names and descriptions',
  })
  @ApiResponse({
    status: 200,
    description: 'Schemas retrieved successfully',
  })
  async getSchemas(
    @Query('search') search?: string,
    @CurrentUser() user: User,
  ): Promise<{
    schemas: any[];
    totalCount: number;
    searchTerm?: string;
  }> {
    const documentation = await this.docGeneratorService.generateDocumentation();
    let schemas = documentation.schemas;
    
    if (search) {
      const searchLower = search.toLowerCase();
      schemas = schemas.filter(schema => 
        schema.name.toLowerCase().includes(searchLower) ||
        schema.description.toLowerCase().includes(searchLower)
      );
    }
    
    return {
      schemas,
      totalCount: schemas.length,
      searchTerm: search,
    };
  }

  @Get('examples')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Get API examples',
    description: 'Returns code examples and usage patterns for the API',
  })
  @ApiQuery({
    name: 'category',
    required: false,
    enum: ['request', 'response', 'workflow', 'integration'],
    description: 'Filter by example category',
  })
  @ApiQuery({
    name: 'tag',
    required: false,
    description: 'Filter by tag',
  })
  @ApiResponse({
    status: 200,
    description: 'Examples retrieved successfully',
  })
  async getExamples(
    @Query('category') category?: 'request' | 'response' | 'workflow' | 'integration',
    @Query('tag') tag?: string,
    @CurrentUser() user: User,
  ): Promise<{
    examples: any[];
    totalCount: number;
    categories: string[];
    filters: {
      category?: string;
      tag?: string;
    };
  }> {
    const documentation = await this.docGeneratorService.generateDocumentation();
    let examples = documentation.examples;
    
    if (category) {
      examples = examples.filter(ex => ex.category === category);
    }
    
    if (tag) {
      examples = examples.filter(ex => ex.tags.includes(tag));
    }
    
    const categories = [...new Set(documentation.examples.map(ex => ex.category))];
    
    return {
      examples,
      totalCount: examples.length,
      categories,
      filters: { category, tag },
    };
  }

  @Get('changelog')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Get API changelog',
    description: 'Returns the changelog with version history and breaking changes',
  })
  @ApiQuery({
    name: 'version',
    required: false,
    description: 'Filter by specific version',
  })
  @ApiResponse({
    status: 200,
    description: 'Changelog retrieved successfully',
  })
  async getChangelog(
    @Query('version') version?: string,
    @CurrentUser() user: User,
  ): Promise<{
    changelog: any[];
    totalVersions: number;
    latestVersion: string;
    breakingChanges: any[];
  }> {
    const documentation = await this.docGeneratorService.generateDocumentation();
    let changelog = documentation.changelog;
    
    if (version) {
      changelog = changelog.filter(entry => entry.version === version);
    }
    
    const breakingChanges = documentation.changelog
      .flatMap(entry => entry.changes.filter(change => change.breakingChange));
    
    return {
      changelog,
      totalVersions: documentation.changelog.length,
      latestVersion: documentation.changelog[0]?.version || '1.0.0',
      breakingChanges,
    };
  }

  @Get('export/:format')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Export documentation',
    description: 'Exports documentation in specified format for download',
  })
  @ApiParam({
    name: 'format',
    enum: ['openapi', 'markdown', 'html', 'json', 'postman'],
    description: 'Export format',
  })
  @ApiResponse({
    status: 200,
    description: 'Documentation exported successfully',
  })
  async exportDocumentation(
    @Param('format') format: 'openapi' | 'markdown' | 'html' | 'json' | 'postman',
    @Res() res: Response,
    @CurrentUser() user: User,
  ): Promise<void> {
    try {
      const documentation = await this.docGeneratorService.generateDocumentation({
        format: [format as any],
        generatePostmanCollection: format === 'postman',
      });
      
      let content: string;
      let contentType: string;
      let filename: string;
      
      switch (format) {
        case 'openapi':
          content = JSON.stringify(this.convertToOpenAPI(documentation), null, 2);
          contentType = 'application/json';
          filename = 'openapi.json';
          break;
        case 'json':
          content = JSON.stringify(documentation, null, 2);
          contentType = 'application/json';
          filename = 'documentation.json';
          break;
        case 'markdown':
          content = this.convertToMarkdown(documentation);
          contentType = 'text/markdown';
          filename = 'documentation.md';
          break;
        case 'html':
          content = this.convertToHTML(documentation);
          contentType = 'text/html';
          filename = 'documentation.html';
          break;
        case 'postman':
          content = JSON.stringify(this.convertToPostman(documentation), null, 2);
          contentType = 'application/json';
          filename = 'postman-collection.json';
          break;
        default:
          res.status(400).json({ error: 'Unsupported format' });
          return;
      }
      
      res.setHeader('Content-Type', contentType);
      res.setHeader('Content-Disposition', attachment; filename="${filename}");
      res.send(content);
      
    } catch (error) {`;
        res.status(500).json({ error: Failed, to, documentation, as, $ }, { format } ` });
    }
  }

  @Get('sdk/:language')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Download SDK',
    description: 'Downloads auto-generated SDK for specified language',
  })
  @ApiParam({
    name: 'language',
    enum: ['typescript', 'javascript', 'python', 'java'],
    description: 'SDK language',
  })
  @ApiResponse({
    status: 200,
    description: 'SDK downloaded successfully',
  })
  async downloadSDK(
    @Param('language') language: 'typescript' | 'javascript' | 'python' | 'java',
    @Res() res: Response,
    @CurrentUser() user: User,
  ): Promise<void> {
    try {
      await this.docGeneratorService.generateDocumentation({
        format: [],
        generateSDK: true,
      });
      
      // For now, only TypeScript is implemented
      if (language !== 'typescript') {
        res.status(400).json({ error: SDK for ${language} not yet available`);
    }
    ;
    return;
};
__decorate([
    Get('openapi.json'),
    ApiExcludeEndpoint(),
    Header('Content-Type', 'application/json'),
    __param(0, Res()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], DocsController.prototype, "getOpenAPISpec", null);
__decorate([
    Get('swagger'),
    ApiExcludeEndpoint(),
    Header('Content-Type', 'text/html'),
    __param(0, Res()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], DocsController.prototype, "getSwaggerUI", null);
DocsController = __decorate([
    ApiTags('Documentation'),
    Controller('api/docs'),
    UseInterceptors(PerformanceInterceptor),
    __metadata("design:paramtypes", [typeof (_a = typeof ApiDocGeneratorService !== "undefined" && ApiDocGeneratorService) === "function" ? _a : Object])
], DocsController);
export { DocsController };
const sdkContent = this.generateTypeScriptSDK();
res.setHeader('Content-Type', 'application/typescript');
res.setHeader('Content-Disposition', attachment);
filename = "api-sdk.ts";
;
res.send(sdkContent);
try { }
catch (error) {
    res.status(500).json({ error: Failed, to, generate, $ }, { language }, SDK);
}
;
convertToOpenAPI(documentation, ApiDocumentation);
any;
{
    return {
        openapi: '3.0.3',
        info: documentation.info,
        servers: documentation.servers,
        paths: this.buildOpenAPIPaths(documentation.endpoints),
        components: {
            schemas: this.buildOpenAPISchemas(documentation.schemas),
            securitySchemes: documentation.authentication.securitySchemes,
        },
    };
}
`
  private convertToMarkdown(documentation: ApiDocumentation): string {`;
return `# ${documentation.info.title}

${documentation.info.description}` `
**Version:** ${documentation.info.version}`
    ** Generated;
 ** $;
{
    documentation.info.generatedAt;
}
#;
#;
Endpoints `
`;
$;
{
    documentation.endpoints.map(endpoint => #, #, #, $, { endpoint, : .method } ` ${endpoint.path}

${endpoint.description}

**Tags:** ${endpoint.tags.join(', ')}
).join('\n')}

## Schemas

${documentation.schemas.map(schema => `
  `, #, #, #, $, { schema, : .name } `

${schema.description}` `).join('\n')}
;
  }

  private convertToHTML(documentation: ApiDocumentation): string {
    return <!DOCTYPE html>
<html>
<head>
  <title>${documentation.info.title}</title>
  <style>
    body { font-family: Arial, sans-serif; margin: 40px; }
    h1, h2, h3 { color: #333; }
    .endpoint { margin: 20px 0; padding: 15px; border: 1px solid #ddd; }
    .method { font-weight: bold; color: #007acc; }
    .path { font-family: monospace; background: #f5f5f5; padding: 2px 4px; }
  </style>
</head>
<body>
  <h1>${documentation.info.title}</h1>
  <p>${documentation.info.description}</p>`
        < p > Version, /strong> ${documentation.info.version}</p > `
  
  <h2>Endpoints</h2>`, $, { documentation, : .endpoints.map(endpoint => class {
        }, "endpoint" >
            class {
            }, "method" > $, { endpoint, : .method } < /span> <span class="path">${endpoint.path}</span > /h3>`
            < p > $, { endpoint, : .description } < /p>
            < p > Tags, /strong> ${endpoint.tags.join(', ')}</p >
            /div>).join('') }
        < /body>
        < /html>));
}
convertToPostman(documentation, ApiDocumentation);
any;
{
    return {
        info: {
            name: documentation.info.title,
            description: documentation.info.description,
            version: documentation.info.version,
            schema: 'https://schema.getpostman.com/json/collection/v2.1.0/collection.json',
        },
    } `
      item: documentation.endpoints.map(endpoint => ({`;
    name: `${endpoint.method} ${endpoint.path},
        request: {
          method: endpoint.method,
          header: [],`;
    url: {
        `
            raw: {{baseUrl}}${endpoint.path}`,
            host;
        ['{{baseUrl}}'],
            path;
        endpoint.path.split('/').filter(Boolean),
        ;
    }
}
variable: [
    {
        key: 'baseUrl',
        value: 'http://localhost:3000',
        type: 'string',
    },
],
;
;
generateTypeScriptSDK();
string;
{
    return; // Auto-generated TypeScript SDK for The New Fuse API
    export class ApiClient {
        config;
        constructor(config) {
            this.config = {
                timeout: 30000,
                ...config,
            };
        }
        async request(method, path, options = {}) {
            const url = new URL(path, this.config.baseUrl);
            if (options.params) {
                Object.entries(options.params).forEach(([key, value]) => {
                    url.searchParams.append(key, String(value));
                });
            }
            const headers = {
                'Content-Type': 'application/json',
                ...options.headers,
            };
            if (this.config.apiKey) {
                headers['Authorization'] = ;
                Bearer;
                $;
                {
                    this.config.apiKey;
                }
                ;
            }
            const response = await fetch(url.toString(), {
                method,
                headers,
                body: options.body ? JSON.stringify(options.body) : undefined,
            });
            `
    if (!response.ok) {`;
            throw new Error(API, request, failed, $, { response, : .status } ` \${response.statusText}\);
    }

    return response.json();
  }

  // Agent methods
  async getAgents(params?: { limit?: number; offset?: number }) {
    return this.request('GET', '/api/agents', { params });
  }

  async createAgent(data: any) {
    return this.request('POST', '/api/agents', { body: data });
  }
`, async, getAgent(id, string), {} `
    return this.request('GET', \/api/agents/\${id}\);`);
        }
    }
    `

  async updateAgent(id: string, data: any) {`;
    return this.request('PUT', /api/agents / , $, { id }, { body: data });
}
`
  async deleteAgent(id: string) {`;
return this.request('DELETE', /api/agents / , $, { id });
// Workflow methods
async;
getWorkflows(params ?  : { limit: number, offset: number });
{
    return this.request('GET', '/api/workflows', { params });
}
async;
createWorkflow(data, any);
{
    return this.request('POST', '/api/workflows', { body: data });
}
async;
getWorkflow(id, string);
{
    `
    return this.request('GET', \/api/workflows/\${id}`;
    ;
}
async;
executeWorkflow(id, string, data, any);
{
    return this.request('POST', /api/workflows / , $, { id } / execute, { body: data });
}
// Example usage:
// const client = new ApiClient({
//   baseUrl: 'https://api.example.com',
//   apiKey: 'your-api-key'
// });
// `
// const agents = await client.getAgents();`
`;
  }

  private buildOpenAPIPaths(endpoints: any[]): any {
    const paths: any = {};
    
    endpoints.forEach(endpoint => {
      if (!paths[endpoint.path]) {
        paths[endpoint.path] = {};
      }
      
      paths[endpoint.path][endpoint.method.toLowerCase()] = {
        operationId: endpoint.operationId,
        summary: endpoint.summary,
        description: endpoint.description,
        tags: endpoint.tags,
        parameters: endpoint.parameters,
        requestBody: endpoint.requestBody,
        responses: this.buildOpenAPIResponses(endpoint.responses),
        security: endpoint.security,
        deprecated: endpoint.deprecated,
      };
    });
    
    return paths;
  }

  private buildOpenAPISchemas(schemas: any[]): any {
    const openApiSchemas: any = {};
    
    schemas.forEach(schema => {
      openApiSchemas[schema.name] = {
        type: schema.type,
        description: schema.description,
        properties: schema.properties,
        required: schema.required,
        example: schema.examples[0],
      };
    });
    
    return openApiSchemas;
  }

  private buildOpenAPIResponses(responses: any[]): any {
    const openApiResponses: any = {};
    
    responses.forEach(response => {
      openApiResponses[response.statusCode] = {
        description: response.description,
        content: response.content,
        headers: response.headers,
      };
    });
    
    return openApiResponses;
  }
};
//# sourceMappingURL=docs.controller.js.map