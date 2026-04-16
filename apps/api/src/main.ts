import { Logger, ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
// @ts-ignore
// @ts-ignore
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import * as dotenv from 'dotenv';
dotenv.config();
import * as fs from 'fs';
import * as yaml from 'js-yaml';
import * as path from 'path';
import { AppModule } from './app.module';
import { validateGcpEnvironment } from './config/gcp.config';

const logger = new Logger('Bootstrap');

async function bootstrap(): Promise<void> {
  // Validate GCP environment variables
  validateGcpEnvironment();

  const app = await NestFactory.create(AppModule, {
    rawBody: true,
    // Enable CORS with strict configuration
    cors: {
      origin:
        process.env.NODE_ENV === 'production'
          ? [
              ...(process.env.ALLOWED_ORIGINS?.split(',') || ['https://yourdomain.com']),
              'chrome-extension://kddfgejmbblgadkdmalfnagbiefbcdmi',
              'https://fae7326d.ai-arcade-poker.pages.dev',
            ]
          : [
              'http://localhost:3000',
              'http://localhost:3001',
              'http://localhost:5173',
              'chrome-extension://kddfgejmbblgadkdmalfnagbiefbcdmi',
              'https://fae7326d.ai-arcade-poker.pages.dev',
            ],
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
      allowedHeaders: [
        'Content-Type',
        'Authorization',
        'X-Requested-With',
        'X-CSRF-Token',
        'X-Request-ID',
        'X-Client-IP',
      ],
    },
  });

  // Global validation pipe with enhanced options
  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
      whitelist: true,
      forbidNonWhitelisted: true,
      forbidUnknownValues: true,
      disableErrorMessages: process.env.NODE_ENV === 'production',
      validationError: {
        target: false,
        value: false,
      },
    })
  );

  // Note: Security middleware should be applied in module configure() method
  // Using app.use(app.get()) causes "requires a middleware function" error
  // These are NestJS providers, not Express middleware functions
  // They should be applied via MiddlewareConsumer in AppModule

  // Set global prefix for API routes
  app.setGlobalPrefix('api');

  // Swagger API Documentation Setup
  if (process.env.ENABLE_API_DOCS !== 'false') {
    try {
      // Try to load OpenAPI spec from YAML file
      const openapiPath = path.join(__dirname, '../../..', 'openapi.yaml');

      let document;
      if (fs.existsSync(openapiPath)) {
        const fileContents = fs.readFileSync(openapiPath, 'utf8');
        document = yaml.load(fileContents) as any;
        logger.log('Loaded OpenAPI specification from openapi.yaml');
      } else {
        // Fallback to generating from decorators
        const config = new DocumentBuilder()
          .setTitle('The New Fuse API')
          .setDescription(
            'Comprehensive API for multi-agent orchestration, workflow automation, and blockchain integration'
          )
          .setVersion('1.0.0')
          .addBearerAuth(
            {
              type: 'http',
              scheme: 'bearer',
              bearerFormat: 'JWT',
              description: 'Enter JWT token',
            },
            'BearerAuth'
          )
          .addServer('http://localhost:3001/api', 'Development API Server')
          .addServer('http://localhost:4000/api/v1', 'API Gateway (Development)')
          .addTag('auth', 'Authentication and authorization endpoints')
          .addTag('Agents', 'Agent management and orchestration')
          .addTag('chat', 'Chat rooms and messaging')
          .addTag('workflows', 'Workflow creation and execution')
          .addTag('wallets', 'Web3 wallet management')
          .addTag('transactions', 'Blockchain transaction operations')
          .addTag('smart-accounts', 'ERC-4337 Smart Account operations')
          .addTag('mcp', 'Model Context Protocol operations')
          .build();

        document = SwaggerModule.createDocument(app, config);
        logger.log('Generated OpenAPI specification from code decorators');
      }

      // Setup Swagger UI
      SwaggerModule.setup('api-docs', app, document, {
        swaggerOptions: {
          persistAuthorization: true,
          tagsSorter: 'alpha',
          operationsSorter: 'alpha',
          docExpansion: 'none',
          filter: true,
          tryItOutEnabled: true,
        },
        customSiteTitle: 'The New Fuse API Documentation',
        customfavIcon: 'https://thenewfuse.com/favicon.ico',
        customCss: '.swagger-ui .topbar { display: none }',
      });

      logger.log(`API Documentation available at: http://localhost:3001/api-docs`);
    } catch (error) {
      logger.error('Failed to setup API documentation', error);
    }
  }

  // Enhanced security headers
  app.use((req: any, res: any, next: any) => {
    // Content Security Policy
    res.setHeader(
      'Content-Security-Policy',
      "default-src 'self'; " +
        "script-src 'self' 'unsafe-inline' 'unsafe-eval'; " +
        "style-src 'self' 'unsafe-inline'; " +
        "img-src 'self' data: https:; " +
        "font-src 'self'; " +
        "connect-src 'self' wss: https:; " +
        "frame-src 'none'; " +
        "object-src 'none'; " +
        "base-uri 'self'; " +
        "form-action 'self';"
    );

    // Additional security headers
    res.setHeader('X-Frame-Options', 'DENY');
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-XSS-Protection', '1; mode=block');
    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
    res.setHeader('Permissions-Policy', 'geolocation=(), microphone=(), camera=(), payment=()');

    // Remove server information
    res.removeHeader('X-Powered-By');

    next();
  });

  // Route fallback: when users hit SPA paths on the API host, redirect to frontend app.
  app.use((req: any, res: any, next: any) => {
    const isGet = req.method === 'GET';
    const path = req.path || '';
    const isApi = path.startsWith('/api');
    const isApiDocs = path.startsWith('/api-docs');
    const acceptsHtml = String(req.headers.accept || '').includes('text/html');
    if (!isGet || isApi || isApiDocs || !acceptsHtml) {
      return next();
    }

    const frontendBase = process.env.FRONTEND_URL || 'https://thenewfuse.com';
    try {
      const target = new URL(req.originalUrl || '/', frontendBase).toString();
      return res.redirect(302, target);
    } catch {
      return res.redirect(302, frontendBase);
    }
  });

  // Root endpoint for health checks
  app.getHttpAdapter().get('/', (req: any, res: any) => {
    res.json({ status: 'healthy', service: 'api' });
  });
  app.getHttpAdapter().get('/health', (req: any, res: any) => {
    res.json({ status: 'healthy', service: 'api' });
  });

  const port = process.env.PORT || 3001;
  await app.listen(port, '0.0.0.0');
  logger.log(`API Server running on port ${port} and host 0.0.0.0`);
}

bootstrap().catch((error) => {
  logger.error('Failed to start API application', error);
  process.exit(1);
});
