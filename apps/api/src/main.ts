import { Logger, ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import * as dotenv from 'dotenv';
// Load environment variables specific to the API service from apps/api/.env BEFORE importing AppModule
dotenv.config();

import * as express from 'express';
import 'reflect-metadata';
import { AppModule } from './app.module';
import {
  DEFAULT_HOST,
  DEFAULT_PORT,
  GLOBAL_API_PREFIX,
  HEALTH_CHECK_PATH,
  ROOT_PATH,
  SERVICE_NAME_API,
  SERVICE_STATUS_HEALTHY,
} from './config/app.constants';
import { getCorsOptions } from './config/cors.config';
import { validateGcpEnvironment } from './config/gcp.config';
import { setupSwagger } from './config/swagger.config';
import { routeFallbackMiddleware } from './middleware/route-fallback.middleware';
import { securityMiddleware } from './middleware/security.middleware';

const logger = new Logger('Bootstrap');

async function bootstrap(): Promise<void> {
  // Validate GCP environment variables
  validateGcpEnvironment();

  const app = await NestFactory.create(AppModule, {
    rawBody: true,
    // Enable CORS with strict configuration
    cors: getCorsOptions(),
  });

  // Back-compat middleware for /api/auth/* -> /api/v1/auth/* (if versioning is implicitly active)
  // app.use(backCompatMiddleware);

  // Explicitly add body parsers (essential for POST data processing)
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

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
  app.setGlobalPrefix(GLOBAL_API_PREFIX);

  // Swagger API Documentation Setup
  setupSwagger(app);

  // Enhanced security headers
  app.use(securityMiddleware);

  // Route fallback: when users hit SPA paths on the API host, redirect to frontend app.
  app.use(routeFallbackMiddleware);

  // Root endpoint for health checks
  app.getHttpAdapter().get(ROOT_PATH, (req: any, res: any) => {
    res.json({
      status: SERVICE_STATUS_HEALTHY,
      service: SERVICE_NAME_API,
      timestamp: new Date().toISOString(),
    });
  });
  app.getHttpAdapter().get(HEALTH_CHECK_PATH, (req: any, res: any) => {
    res.json({
      status: SERVICE_STATUS_HEALTHY,
      service: SERVICE_NAME_API,
      timestamp: new Date().toISOString(),
    });
  });
  app.getHttpAdapter().get('/api/v1/health', (req: any, res: any) => {
    res.json({
      status: 'ok',
      service: SERVICE_NAME_API,
      timestamp: new Date().toISOString(),
    });
  });

  const port = process.env.PORT || DEFAULT_PORT;
  await app.listen(port, DEFAULT_HOST);
  logger.log(`API Server running on port ${port} and host 0.0.0.0`);
}

bootstrap().catch((error) => {
  logger.error('Failed to start API application', error);
  process.exit(1);
});
