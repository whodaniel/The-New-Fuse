"use strict";
/**
 * Unified API Gateway for The New Fuse Platform
 * Consolidates multiple API services into a single entry point
 * Provides consistent authentication, versioning, and documentation
 */
Object.defineProperty(exports, "__esModule", { value: true });
const core_1 = require("@nestjs/core");
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const app_module_1 = require("./app.module");
const global_exception_filter_1 = require("./filters/global-exception.filter");
const response_interceptor_1 = require("./interceptors/response.interceptor");
const logging_interceptor_1 = require("./interceptors/logging.interceptor");
async function bootstrap() {
    console.log('🔧 Starting API Gateway bootstrap...');
    console.log('📋 Environment variables:');
    console.log(`   PORT: ${process.env.PORT || '8080 (default)'}`);
    console.log(`   NODE_ENV: ${process.env.NODE_ENV || 'undefined'}`);
    console.log(`   BACKEND_SERVICE_URL: ${process.env.BACKEND_SERVICE_URL || 'undefined'}`);
    console.log(`   WEBHOOKS_SERVICE_URL: ${process.env.WEBHOOKS_SERVICE_URL || 'undefined'}`);
    console.log(`   AGENTS_SERVICE_URL: ${process.env.AGENTS_SERVICE_URL || 'undefined'}`);
    const app = await core_1.NestFactory.create(app_module_1.AppModule, {
        logger: ['error', 'warn', 'log', 'debug', 'verbose'],
    });
    // Enable CORS
    // In dev: always allow, including file:// and electron origins (no Origin header)
    app.enableCors({
        origin: process.env.NODE_ENV === 'production'
            ? ['https://thenewfuse.com', 'https://app.thenewfuse.com']
            : (origin, callback) => callback(null, true),
        credentials: true,
        methods: ['GET', 'HEAD', 'PUT', 'PATCH', 'POST', 'DELETE', 'OPTIONS'],
        allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'x-api-key'],
        exposedHeaders: ['Content-Length', 'ETag'],
        preflightContinue: false,
        optionsSuccessStatus: 204,
    });
    // Global validation pipe
    app.useGlobalPipes(new common_1.ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
        disableErrorMessages: process.env.NODE_ENV === 'production',
    }));
    // Global exception filter
    app.useGlobalFilters(new global_exception_filter_1.GlobalExceptionFilter());
    // Global interceptors
    app.useGlobalInterceptors(new logging_interceptor_1.LoggingInterceptor(), new response_interceptor_1.ResponseInterceptor());
    // API prefix - use '/api' to align with backend expectations
    app.setGlobalPrefix('api');
    app.enableVersioning({
        type: common_1.VersioningType.URI,
        defaultVersion: '1',
    });
    // Setup unified Swagger documentation
    const config = new swagger_1.DocumentBuilder()
        .setTitle('The New Fuse - Unified API')
        .setDescription(`
      Unified API Gateway for The New Fuse Platform.
      
      This gateway consolidates all platform APIs including:
      - Agent Management (Port 3001)
      - Core Backend Services (Port 3004) 
      - Webhook & SSE Services (Port 3000)
      - MCP Server Management
      - Real-time Communication
      
      All endpoints are now available through this single entry point with
      consistent authentication, versioning, and error handling.
    `)
        .setVersion('1.0.0')
        .setContact('The New Fuse API Support', 'https://thenewfuse.com/support', 'api-support@thenewfuse.com')
        .setLicense('Proprietary', 'https://thenewfuse.com/license')
        .addTag('auth', 'Authentication and authorization')
        .addTag('agents', 'AI Agent management and operations')
        .addTag('chat', 'Real-time chat and communication')
        .addTag('workflows', 'Task workflows and pipelines')
        .addTag('webhooks', 'Webhook management and ingestion')
        .addTag('sse', 'Server-Sent Events streaming')
        .addTag('mcp', 'Model Context Protocol servers')
        .addTag('health', 'Health checks and monitoring')
        .addBearerAuth({
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        name: 'JWT',
        description: 'JWT token obtained from /auth/login',
        in: 'header',
    }, 'JWT-auth')
        .addApiKey({
        type: 'apiKey',
        name: 'x-api-key',
        in: 'header',
        description: 'API key for service-to-service communication'
    }, 'api-key')
        .addServer('https://api.thenewfuse.com', 'Production server')
        .addServer('https://staging-api.thenewfuse.com', 'Staging server')
        .addServer('http://localhost:8080', 'Local API Gateway')
        .build();
    const document = swagger_1.SwaggerModule.createDocument(app, config, {
        deepScanRoutes: true,
        operationIdFactory: (controllerKey, methodKey) => methodKey,
    });
    swagger_1.SwaggerModule.setup('docs', app, document, {
        swaggerOptions: {
            persistAuthorization: true,
            tagsSorter: 'alpha',
            operationsSorter: 'alpha',
            docExpansion: 'none',
            filter: true,
            showRequestDuration: true,
            syntaxHighlight: {
                theme: 'monokai'
            }
        },
        customCss: `
      .swagger-ui .topbar { display: none }
      .swagger-ui .info { margin: 30px 0 }
      .swagger-ui .scheme-container { margin: 30px 0 }
      .swagger-ui .info .title { font-size: 32px; color: #2c3e50; }
      .swagger-ui .info .description { font-size: 16px; line-height: 1.6; }
      .swagger-ui .opblock.opblock-post { border-color: #49cc90; }
      .swagger-ui .opblock.opblock-get { border-color: #61affe; }
      .swagger-ui .opblock.opblock-put { border-color: #fca130; }
      .swagger-ui .opblock.opblock-delete { border-color: #f93e3e; }
    `,
        customSiteTitle: 'The New Fuse - Unified API Documentation',
        customfavIcon: '/favicon.ico',
    });
    // Root endpoint for health checks and basic info
    const rootHandler = (req, res) => {
        res.json({
            name: 'The New Fuse - Unified API Gateway',
            version: process.env.npm_package_version || '1.0.0',
            status: 'operational',
            timestamp: new Date().toISOString(),
            uptime: process.uptime(),
            documentation: '/docs',
            health: '/health',
            api: '/api',
            environment: process.env.NODE_ENV || 'development'
        });
    };
    app.getHttpAdapter().get('/', rootHandler);
    app.getHttpAdapter().head('/', (req, res) => {
        res.status(200).end();
    });
    // Health check endpoint
    app.getHttpAdapter().get('/health', (req, res) => {
        res.json({
            status: 'healthy',
            timestamp: new Date().toISOString(),
            uptime: process.uptime(),
            memory: process.memoryUsage(),
            version: process.env.npm_package_version || '1.0.0',
            services: {
                agents: 'active',
                webhooks: 'active',
                sse: 'active',
                mcp: 'active'
            }
        });
    });
    // Listen on provided PORT, default to 3000 for local alignment
    const port = Number(process.env.PORT || 3000);
    await app.listen(port, '0.0.0.0');
    console.log(`🚀 API Gateway listening on http://localhost:${port}`);
}
bootstrap().catch(err => {
    console.error('Failed to start API Gateway:', err);
    process.exit(1);
});
//# sourceMappingURL=main.js.map