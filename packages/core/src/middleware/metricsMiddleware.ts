import { Request, Response, NextFunction } from 'express';
import { MetricsCollector } from '../monitoring/metricsCollector.js';
import { Logger } from '@the-new-fuse/utils';

const logger = new Logger('MetricsMiddleware');

export function createMetricsMiddleware(metrics: MetricsCollector): any {
  return async (req: Request, res: Response, next: NextFunction) => {
    const startTime = Date.now();
    const originalEnd = res.end;
    const originalWrite = res.write;
    let responseBody = '';

    // Track response size
    res.write = function(chunk: any, ...args: any[]) {
      if (typeof chunk === 'string' || chunk instanceof Buffer) {
        responseBody += chunk;
      }
      return originalWrite.apply(res, [chunk, ...args]);
    };

    // Collect metrics when response ends
    res.end = function(chunk: any, ...args: any[]) {
      const responseTime = Date.now() - startTime;

      if (chunk && (typeof chunk === 'string' || chunk instanceof Buffer)) {
        responseBody += chunk;
      }

      // Record metrics
      try {
        // Record response time
        const tags = {
          method: req.method,
          path: req.route?.path || req.path,
          status: res.statusCode.toString()
        };

        // Store metrics
        Promise.all([
          metrics.recordResponseTime(responseTime, tags),
          metrics.recordRequestSize(Buffer.byteLength(JSON.stringify(req.body)), tags),
          metrics.recordResponseSize(Buffer.byteLength(responseBody), tags)
        ]).catch(error => {
          logger.error('Failed to record metrics:', error);
        });

      } catch (error) {
        logger.error('Error in metrics middleware:', error);
      }

      return originalEnd.apply(res, [chunk, ...args]);
    };

    next();
  };
}