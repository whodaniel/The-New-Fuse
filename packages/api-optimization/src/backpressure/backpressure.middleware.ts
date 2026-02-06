import { HttpException, HttpStatus, Injectable, Logger, NestMiddleware } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NextFunction, Request, Response } from 'express';

export interface BackpressureConfig {
  enabled: boolean;
  maxConcurrentRequests: number;
  maxQueueSize: number;
  requestTimeout: number;
  slowdownThreshold: number;
}

export interface BackpressureStats {
  activeRequests: number;
  queuedRequests: number;
  totalProcessed: number;
  totalRejected: number;
  averageResponseTime: number;
}

/**
 * Backpressure handling middleware
 * Prevents server overload by limiting concurrent requests and queuing excess
 */
@Injectable()
export class BackpressureMiddleware implements NestMiddleware {
  private readonly logger = new Logger(BackpressureMiddleware.name);
  private config!: BackpressureConfig;

  private activeRequests = 0;
  private requestQueue: Array<{
    req: Request;
    res: Response;
    next: NextFunction;
    timestamp: number;
  }> = [];

  private stats: BackpressureStats = {
    activeRequests: 0,
    queuedRequests: 0,
    totalProcessed: 0,
    totalRejected: 0,
    averageResponseTime: 0,
  };

  private responseTimes: number[] = [];
  private maxResponseTimeSamples = 100;

  constructor(private configService: ConfigService) {
    this.initializeConfig();
    this.startQueueProcessor();
  }

  private initializeConfig(): void {
    this.config = {
      enabled: this.configService.get('BACKPRESSURE_ENABLED', 'true') === 'true',
      maxConcurrentRequests: this.configService.get('BACKPRESSURE_MAX_CONCURRENT', 100),
      maxQueueSize: this.configService.get('BACKPRESSURE_MAX_QUEUE', 50),
      requestTimeout: this.configService.get('BACKPRESSURE_TIMEOUT', 30000),
      slowdownThreshold: this.configService.get('BACKPRESSURE_SLOWDOWN_THRESHOLD', 80),
    };

    this.logger.log(
      `Backpressure configured: enabled=${this.config.enabled}, ` +
        `maxConcurrent=${this.config.maxConcurrentRequests}, ` +
        `maxQueue=${this.config.maxQueueSize}`
    );
  }

  async use(req: Request, res: Response, next: NextFunction): Promise<void> {
    if (!this.config.enabled) {
      return next();
    }

    // Skip backpressure for health checks
    if (this.shouldSkip(req)) {
      return next();
    }

    const startTime = Date.now();

    // Check if we're at capacity
    if (this.activeRequests >= this.config.maxConcurrentRequests) {
      // Check queue capacity
      if (this.requestQueue.length >= this.config.maxQueueSize) {
        this.stats.totalRejected++;
        this.setBackpressureHeaders(res, true);

        throw new HttpException(
          {
            statusCode: HttpStatus.SERVICE_UNAVAILABLE,
            message: 'Server is currently overloaded. Please try again later.',
            error: 'Service Unavailable',
            retryAfter: this.estimateRetryAfter(),
          },
          HttpStatus.SERVICE_UNAVAILABLE
        );
      }

      // Queue the request
      this.logger.debug(
        `Queueing request: ${req.method} ${req.path}, queue size: ${this.requestQueue.length + 1}`
      );

      this.requestQueue.push({
        req,
        res,
        next,
        timestamp: Date.now(),
      });

      this.stats.queuedRequests = this.requestQueue.length;
      this.setBackpressureHeaders(res, false);

      // Set timeout for queued request
      setTimeout(() => {
        const index = this.requestQueue.findIndex((item) => item.req === req && item.res === res);
        if (index !== -1) {
          this.requestQueue.splice(index, 1);
          this.stats.queuedRequests = this.requestQueue.length;
          this.stats.totalRejected++;

          if (!res.headersSent) {
            res.status(HttpStatus.REQUEST_TIMEOUT).json({
              statusCode: HttpStatus.REQUEST_TIMEOUT,
              message: 'Request timed out while waiting in queue',
              error: 'Request Timeout',
            });
          }
        }
      }, this.config.requestTimeout);

      return;
    }

    // Process request immediately
    this.activeRequests++;
    this.stats.activeRequests = this.activeRequests;
    this.setBackpressureHeaders(res, false);

    // Track response time
    const originalEnd = res.end.bind(res);
    res.end = (...args: any[]) => {
      const responseTime = Date.now() - startTime;
      this.recordResponseTime(responseTime);

      this.activeRequests--;
      this.stats.activeRequests = this.activeRequests;
      this.stats.totalProcessed++;

      return originalEnd(...args);
    };

    next();
  }

  private startQueueProcessor(): void {
    setInterval(() => {
      this.processQueue();
    }, 100); // Process queue every 100ms
  }

  private processQueue(): void {
    while (
      this.activeRequests < this.config.maxConcurrentRequests &&
      this.requestQueue.length > 0
    ) {
      const item = this.requestQueue.shift();
      if (!item) break;

      const { req, res, next } = item;

      // Check if request hasn't timed out
      if (!res.headersSent) {
        this.activeRequests++;
        this.stats.activeRequests = this.activeRequests;
        this.stats.queuedRequests = this.requestQueue.length;

        const startTime = Date.now();

        // Track response time
        const originalEnd = res.end.bind(res);
        res.end = (...args: any[]) => {
          const responseTime = Date.now() - startTime;
          this.recordResponseTime(responseTime);

          this.activeRequests--;
          this.stats.activeRequests = this.activeRequests;
          this.stats.totalProcessed++;

          return originalEnd(...args);
        };

        next();
      }
    }
  }

  private shouldSkip(req: Request): boolean {
    const skipPaths = ['/health', '/metrics', '/readiness', '/liveness'];
    return skipPaths.some((path) => req.path.startsWith(path));
  }

  private setBackpressureHeaders(res: Response, rejected: boolean): void {
    res.setHeader('X-Backpressure-Active', this.activeRequests.toString());
    res.setHeader('X-Backpressure-Queued', this.requestQueue.length.toString());
    res.setHeader('X-Backpressure-Status', rejected ? 'rejected' : 'accepted');

    if (this.isUnderPressure()) {
      res.setHeader('X-Backpressure-Warning', 'Server is under high load');
    }
  }

  private isUnderPressure(): boolean {
    const utilization = (this.activeRequests / this.config.maxConcurrentRequests) * 100;
    return utilization >= this.config.slowdownThreshold;
  }

  private estimateRetryAfter(): number {
    // Estimate based on average response time and queue size
    const avgResponseTime = this.stats.averageResponseTime || 1000;
    const queueProcessingTime = (this.requestQueue.length * avgResponseTime) / 1000;
    return Math.ceil(queueProcessingTime);
  }

  private recordResponseTime(responseTime: number): void {
    this.responseTimes.push(responseTime);

    if (this.responseTimes.length > this.maxResponseTimeSamples) {
      this.responseTimes.shift();
    }

    // Calculate average
    const sum = this.responseTimes.reduce((acc, time) => acc + time, 0);
    this.stats.averageResponseTime = sum / this.responseTimes.length;
  }

  getStats(): BackpressureStats {
    return { ...this.stats };
  }

  getConfig(): BackpressureConfig {
    return { ...this.config };
  }

  isHealthy(): boolean {
    const utilization = (this.activeRequests / this.config.maxConcurrentRequests) * 100;
    const queueUtilization = (this.requestQueue.length / this.config.maxQueueSize) * 100;

    return utilization < 90 && queueUtilization < 90;
  }
}
