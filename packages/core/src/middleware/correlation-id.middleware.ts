import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { CorrelationIdManager } from '../utils/correlation-id.js';

/**
 * Middleware to add correlation IDs to all HTTP requests
 * This helps track requests across distributed services
 */
@Injectable()
export class CorrelationIdMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction) {
    // Check if a correlation ID was provided in the request headers
    const correlationId = req.headers['x-correlation-id'] as string || CorrelationIdManager.generateId();
    
    // Set the correlation ID in the request object for use in controllers
    req['correlationId'] = correlationId;
    
    // Add the correlation ID to the response headers
    res.setHeader('x-correlation-id', correlationId);
    
    // Run the request handler with the correlation ID in context
    CorrelationIdManager.runWithId(correlationId, () => {
      next();
    });
  }
}
