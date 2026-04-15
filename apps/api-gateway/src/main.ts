/**
 * Unified API Gateway for The New Fuse Platform
 * Consolidates multiple API services into a single entry point
 * Provides consistent authentication, versioning, and documentation
 */

import { ValidationPipe, VersioningType } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
// @ts-ignore
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { GlobalExceptionFilter } from './filters/global-exception.filter';
import { LoggingInterceptor } from './interceptors/logging.interceptor';
import { ResponseInterceptor } from './interceptors/response.interceptor';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    logger: ['error', 'warn', 'log', 'debug', 'verbose'],
  });

  // Enable CORS
  // In dev: always allow, including file:// and electron origins (no Origin header)
  const prodAllowedOrigins = new Set([
    'https://thenewfuse.com',
    'https://app.thenewfuse.com',
    'https://poker.ai-arcade.xyz',
  ]);

  app.enableCors({
    origin:
      process.env.NODE_ENV === 'production'
        ? (origin, callback) => {
            if (!origin) return callback(null, true);
            if (prodAllowedOrigins.has(origin) || origin.endsWith('.ai-arcade.xyz')) {
              return callback(null, true);
            }
            return callback(new Error('CORS origin not allowed'));
          }
        : (origin, callback) => callback(null, true),
    credentials: true,
    methods: ['GET', 'HEAD', 'PUT', 'PATCH', 'POST', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'x-api-key'],
    exposedHeaders: ['Content-Length', 'ETag'],
    preflightContinue: false,
    optionsSuccessStatus: 204,
  });

  // Back-compat: some clients still call /v1/* without the global /api prefix.
  app.use((req, _res, next) => {
    if (req.url.startsWith('/v1/') || req.url === '/v1') {
      req.url = `/api${req.url}`;
    }
    next();
  });

  // Global validation pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      disableErrorMessages: process.env.NODE_ENV === 'production',
    })
  );

  // Global exception filter
  app.useGlobalFilters(new GlobalExceptionFilter());

  // Global interceptors
  app.useGlobalInterceptors(new LoggingInterceptor(), new ResponseInterceptor());

  // Global prefix for ALL routes
  app.setGlobalPrefix('api');

  // API versioning - use URI versioning with prefix
  app.enableVersioning({
    type: VersioningType.URI,
    prefix: 'v',
    defaultVersion: '1',
  });

  // Setup unified Swagger documentation.
  // If route introspection fails, keep the gateway available and continue without docs.
  if (process.env.SWAGGER_ENABLED !== 'false') {
    try {
      const config = new DocumentBuilder()
        .setTitle('The New Fuse - Unified API')
        .setDescription(
          `
      Unified API Gateway for The New Fuse Platform.

      This gateway consolidates all platform APIs including:
      - Agent Management (Port 3001)
      - Core Backend Services (Port 3004)
      - Webhook & SSE Services (Port 3000)
      - MCP Server Management
      - Real-time Communication

      All endpoints are now available through this single entry point with
      consistent authentication, versioning, and error handling.
    `
    )
    .setVersion('1.0.0')
    .setContact(
      'The New Fuse API Support',
      'https://thenewfuse.com/support',
      'api-support@thenewfuse.com'
    )
    .setLicense('Proprietary', 'https://thenewfuse.com/license')
    .addTag('auth', 'Authentication and authorization')
    .addTag('agents', 'AI Agent management and operations')
    .addTag('chat', 'Real-time chat and communication')
    .addTag('workflows', 'Task workflows and pipelines')
    .addTag('webhooks', 'Webhook management and ingestion')
    .addTag('sse', 'Server-Sent Events streaming')
    .addTag('mcp', 'Model Context Protocol servers')
    .addTag('sgp', 'Spreadsheet Graph Protocol translation bridge')
    .addTag('health', 'Health checks and monitoring')
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        name: 'JWT',
        description: 'JWT token obtained from /auth/login',
        in: 'header',
      },
      'JWT-auth'
    )
    .addApiKey(
      {
        type: 'apiKey',
        name: 'x-api-key',
        in: 'header',
        description: 'API key for service-to-service communication',
      },
      'api-key'
    )
    .addServer('https://api.thenewfuse.com', 'Production server')
    .addServer('https://staging-api.thenewfuse.com', 'Staging server')
    .addServer('http://localhost:8080', 'Local API Gateway')
    .build();

      const document = SwaggerModule.createDocument(app as any, config, {
        deepScanRoutes: true,
        operationIdFactory: (controllerKey: string, methodKey: string) => methodKey,
      });

      SwaggerModule.setup('docs', app as any, document, {
        swaggerOptions: {
          persistAuthorization: true,
          tagsSorter: 'alpha',
          operationsSorter: 'alpha',
          docExpansion: 'none',
          filter: true,
          showRequestDuration: true,
          syntaxHighlight: {
            theme: 'monokai',
          },
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
    } catch (error) {
      console.error('Swagger initialization failed; continuing without /docs:', error);
    }
  }

  const healthPayload = () => ({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    memory: process.memoryUsage(),
    version: process.env.npm_package_version || '1.0.0',
    services: {
      agents: 'active',
      webhooks: 'active',
      sse: 'active',
      mcp: 'active',
    },
  });

  const healthPayload = () => ({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    memory: process.memoryUsage(),
    version: process.env.npm_package_version || '1.0.0',
    services: {
      agents: 'active',
      webhooks: 'active',
      sse: 'active',
      mcp: 'active',
    },
  });

  const healthPayload = () => ({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    memory: process.memoryUsage(),
    version: process.env.npm_package_version || '1.0.0',
    services: {
      agents: 'active',
      webhooks: 'active',
      sse: 'active',
      mcp: 'active',
    },
  });

  const healthPayload = () => ({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    memory: process.memoryUsage(),
    version: process.env.npm_package_version || '1.0.0',
    services: {
      agents: 'active',
      webhooks: 'active',
      sse: 'active',
      mcp: 'active',
    },
  });

  const healthPayload = () => ({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    memory: process.memoryUsage(),
    version: process.env.npm_package_version || '1.0.0',
    services: {
      agents: 'active',
      webhooks: 'active',
      sse: 'active',
      mcp: 'active',
    },
  });

  const healthPayload = () => ({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    memory: process.memoryUsage(),
    version: process.env.npm_package_version || '1.0.0',
    services: {
      agents: 'active',
      webhooks: 'active',
      sse: 'active',
      mcp: 'active',
    },
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
      api: '/v1',
      environment: process.env.NODE_ENV || 'development',
    });
  };

  app.getHttpAdapter().get('/', rootHandler);
  app.getHttpAdapter().head('/', (req, res) => {
    res.status(200).end();
  });

  // Health check endpoint
  app.getHttpAdapter().get('/health', (req, res) => {
    res.json(healthPayload());
  });
  // Compatibility health endpoints (some infra checks hit /api/health)
  app.getHttpAdapter().get('/api/health', (req, res) => {
    res.json(healthPayload());
  });
  app.getHttpAdapter().get('/api/v1/health', (req, res) => {
    res.json(healthPayload());
  });

  // Listen on provided API_GATEWAY_PORT, default to PORT provided by Railway, fallback to 8080
  const port = Number(process.env.API_GATEWAY_PORT || process.env.PORT || 8080);
  await app.listen(port, '0.0.0.0');
  console.log(`🚀 API Gateway listening on http://localhost:${port}`);
}

bootstrap().catch((err) => {
  console.error('Failed to start API Gateway:', err);
  process.exit(1);
});
