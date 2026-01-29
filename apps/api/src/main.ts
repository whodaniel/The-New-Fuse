// Enhanced DI chain logging for Redis configuration debugging
import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import * as fs from 'fs';
import * as yaml from 'js-yaml';
import * as path from 'path';
import { AppModule } from './app.module';

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule, {
    // Enable CORS with streamlined configuration
    cors: {
      origin: [
        'https://thenewfuse.com',
        'https://www.thenewfuse.com',
        'https://api-production-48f1.up.railway.app',
        'http://localhost:3000',
        'http://localhost:3001',
        'http://localhost:5173',
      ],
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
      allowedHeaders: '*', // Be permissive with headers to resolve production issues
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

  // Global Prefix
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
        console.log('📚 Loaded OpenAPI specification from openapi.yaml');
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
        console.log('📚 Generated OpenAPI specification from code decorators');
      }

      // Setup Swagger UI at 'docs' path (results in /api/docs with global prefix)
      SwaggerModule.setup('docs', app, document, {
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

      console.log('📖 API Documentation available at: http://localhost:3001/api/docs');
    } catch (error) {
      console.error('⚠️  Failed to setup API documentation:', error);
    }
  }

  const port = process.env.PORT || 3001;
  await app.listen(port);
  console.log('🔄 Triggering redeploy for DB migration update');
  console.log(`🚀 API Server running on port ${port} with enhanced security`);
}

bootstrap().catch((error) => {
  console.error('❌ Failed to start API application:', error);
  process.exit(1);
});
