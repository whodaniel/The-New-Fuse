/**
 * Sync Server
 * Main server entry point that integrates with existing infrastructure
 */

import { NestFactory } from '@nestjs/core';
import { Logger, ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { SyncModule } from './SyncModule';
import { SyncHealthService } from './SyncHealthService';
import { SyncConfigService } from './SyncConfigService';
import { SyncMetricsService } from './SyncMetricsService';

export class SyncServer {
  private readonly logger = new Logger(SyncServer.name);
  private app: any;
  private healthService?: SyncHealthService;
  private configService?: SyncConfigService;
  private metricsService?: SyncMetricsService;

  /**
   * Initialize and start the sync server
   */
  async start(): Promise<void> {
    try {
      this.logger.log('Starting Sync Core server...');

      // Create NestJS application
      this.app = await NestFactory.create(SyncModule, {
        logger: ['error', 'warn', 'log', 'debug', 'verbose']
      });

      // Get services
      this.healthService = this.app.get(SyncHealthService);
      this.configService = this.app.get(SyncConfigService);
      this.metricsService = this.app.get(SyncMetricsService);

      // Configure application
      await this.configureApp();

      // Setup health checks
      await this.setupHealthChecks();

      // Setup metrics
      await this.setupMetrics();

      // Start server
      const port = process.env.PORT || 3003;
      await this.app.listen(port);

      this.logger.log(`Sync Core server started on port ${port}`);
      this.logger.log(`Health check available at: http://localhost:${port}/health/sync`);
      this.logger.log(`Metrics available at: http://localhost:${port}/metrics`);
      this.logger.log(`API documentation available at: http://localhost:${port}/api`);

      // Setup graceful shutdown
      this.setupGracefulShutdown();

    } catch (error) {
      this.logger.error('Failed to start Sync Core server', error);
      process.exit(1);
    }
  }

  /**
   * Configure NestJS application
   */
  private async configureApp(): Promise<void> {
    // Enable CORS
    this.app.enableCors({
      origin: process.env.CORS_ORIGIN || '*',
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
      allowedHeaders: ['Content-Type', 'Authorization'],
    });

    // Global validation pipe
    this.app.useGlobalPipes(new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }));

    // Setup Swagger documentation
    const config = new DocumentBuilder()
      .setTitle('Sync Core API')
      .setDescription('Multi-tenant synchronization system API')
      .setVersion('1.0')
      .addTag('sync')
      .addTag('health')
      .addTag('metrics')
      .build();

    const document = SwaggerModule.createDocument(this.app, config);
    SwaggerModule.setup('api', this.app, document);

    this.logger.log('Application configured successfully');
  }

  /**
   * Setup health check endpoints
   */
  private async setupHealthChecks(): Promise<void> {
    if (!this.healthService) {
      throw new Error('Health service not available');
    }

    // Basic health check
    this.app.get('/health/sync', async (req: any, res: any) => {
      try {
        const health = await this.healthService!.checkHealth();
        const statusCode = health.overall === 'healthy' ? 200 : 503;
        res.status(statusCode).json(health);
      } catch (error) {
        this.logger.error('Health check failed', error);
        res.status(503).json({
          status: 'unhealthy',
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    });

    // Readiness probe
    this.app.get('/health/sync/ready', async (req: any, res: any) => {
      try {
        const health = await this.healthService!.checkHealth();
        const ready = health.overall !== 'unhealthy';
        res.status(ready ? 200 : 503).json({
          ready,
          status: health.overall
        });
      } catch (error) {
        res.status(503).json({ ready: false, error: 'Health check failed' });
      }
    });

    // Startup probe
    this.app.get('/health/sync/startup', async (req: any, res: any) => {
      try {
        // Simple startup check - just verify services are initialized
        const started = this.healthService && this.configService && this.metricsService;
        res.status(started ? 200 : 503).json({
          started: !!started,
          timestamp: new Date().toISOString()
        });
      } catch (error) {
        res.status(503).json({ started: false, error: 'Startup check failed' });
      }
    });

    // Detailed health metrics
    this.app.get('/health/sync/detailed', async (req: any, res: any) => {
      try {
        const metrics = await this.healthService!.getSyncHealthMetrics();
        res.json(metrics);
      } catch (error) {
        this.logger.error('Detailed health check failed', error);
        res.status(500).json({
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    });

    this.logger.log('Health check endpoints configured');
  }

  /**
   * Setup metrics endpoints
   */
  private async setupMetrics(): Promise<void> {
    if (!this.metricsService) {
      throw new Error('Metrics service not available');
    }

    // Prometheus metrics endpoint
    this.app.get('/metrics', async (req: any, res: any) => {
      try {
        const metrics = await this.metricsService!.getPrometheusMetrics();
        res.set('Content-Type', 'text/plain; version=0.0.4; charset=utf-8');
        res.send(metrics);
      } catch (error) {
        this.logger.error('Failed to get metrics', error);
        res.status(500).send('# Failed to get metrics\n');
      }
    });

    // JSON metrics endpoint
    this.app.get('/metrics/json', async (req: any, res: any) => {
      try {
        const metrics = await this.metricsService!.getJsonMetrics();
        res.json(metrics);
      } catch (error) {
        this.logger.error('Failed to get JSON metrics', error);
        res.status(500).json({
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    });

    this.logger.log('Metrics endpoints configured');
  }

  /**
   * Setup graceful shutdown
   */
  private setupGracefulShutdown(): void {
    const shutdown = async (signal: string) => {
      this.logger.log(`Received ${signal}, starting graceful shutdown...`);

      try {
        // Stop accepting new requests
        if (this.app) {
          await this.app.close();
        }

        // Cleanup services
        if (this.healthService) {
          await this.healthService.shutdown();
        }

        if (this.configService) {
          await this.configService.shutdown();
        }

        if (this.metricsService) {
          await this.metricsService.shutdown();
        }

        this.logger.log('Graceful shutdown completed');
        process.exit(0);
      } catch (error) {
        this.logger.error('Error during shutdown', error);
        process.exit(1);
      }
    };

    // Handle shutdown signals
    process.on('SIGTERM', () => shutdown('SIGTERM'));
    process.on('SIGINT', () => shutdown('SIGINT'));

    // Handle uncaught exceptions
    process.on('uncaughtException', (error) => {
      this.logger.error('Uncaught exception', error);
      shutdown('uncaughtException');
    });

    process.on('unhandledRejection', (reason, promise) => {
      this.logger.error('Unhandled rejection', { reason, promise });
      shutdown('unhandledRejection');
    });
  }
}

/**
 * Start the server if this file is run directly
 */
if (require.main === module) {
  const server = new SyncServer();
  server.start().catch((error) => {
    console.error('Failed to start server:', error);
    process.exit(1);
  });
}