import { Injectable, NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { CorrelationIdManager } from '../utils/correlation-id.js';

/**
 * Interceptor to add correlation IDs to all requests
 * This helps track requests across distributed services
 */
@Injectable()
export class CorrelationIdInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    const response = context.switchToHttp().getResponse();
    
    // Get or generate correlation ID
    const correlationId = request.headers['x-correlation-id'] || CorrelationIdManager.generateId();
    
    // Add to request object
    request.correlationId = correlationId;
    
    // Add to response headers
    response.setHeader('x-correlation-id', correlationId);
    
    // Run handler with correlation ID in context
    return CorrelationIdManager.runWithId(correlationId, () => {
      return next.handle().pipe(
        tap(() => {
          // Ensure the header is set even if modified in the handler
          response.setHeader('x-correlation-id', correlationId);
        })
      );
    });
  }
}
