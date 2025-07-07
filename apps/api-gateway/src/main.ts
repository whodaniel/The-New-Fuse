/**
 * Unified API Gateway for The New Fuse Platform
 * Consolidates multiple API services into a single entry point
 * Provides consistent authentication, versioning, and documentation
 */

import { NestFactory } from '@nestjs/core';
import { ValidationPipe, VersioningType } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { GlobalExceptionFilter } from './filters/global-exception.filter';
import { ResponseInterceptor } from './interceptors/response.interceptor';
import { LoggingInterceptor } from './interceptors/logging.interceptor';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    logger: ['error', 'warn', 'log', 'debug', 'verbose'],
  });

  // Enable CORS for all origins in development
  app.enableCors({
    origin: process.env.NODE_ENV === 'production' 
      ? ['https://thenewfuse.com', 'https://app.thenewfuse.com']
      : true,
    credentials: true,
  });

  // Global validation pipe
  app.useGlobalPipes(new ValidationPipe({
    whitelist: true,
    forbidNonWhitelisted: true,
    transform: true,
    disableErrorMessages: process.env.NODE_ENV === 'production',
  }));

  // Global exception filter
  app.useGlobalFilters(new GlobalExceptionFilter());

  // Global interceptors
  app.useGlobalInterceptors(
    new LoggingInterceptor(),
    new ResponseInterceptor()
  );

  // API versioning - prefix all routes with /v1
  app.setGlobalPrefix('v1');
  app.enableVersioning({
    type: VersioningType.URI,
    defaultVersion: '1',
  });

  // Setup unified Swagger documentation
  const config = new DocumentBuilder()
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

  const document = SwaggerModule.createDocument(app, config, {
    deepScanRoutes: true,
    operationIdFactory: (controllerKey: string, methodKey: string) => methodKey,
  });

  SwaggerModule.setup('docs', app, document, {
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

  const port = process.env.PORT || 8080;
  await app.listen(port);
}

bootstrap().catch(err => {
  console.error('Failed to start API Gateway:', err);
  process.exit(1);
});