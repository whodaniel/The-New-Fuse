import { CallHandler, ExecutionContext, Injectable, Logger, NestInterceptor } from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';

@Injectable()
export class PerformanceInterceptor implements NestInterceptor {
  private readonly logger = new Logger(PerformanceInterceptor.name);

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const start = Date.now();
    const request = context.switchToHttp().getRequest();
    const { method, url } = request;

    return next.handle().pipe(
      tap(() => {
        const duration = Date.now() - start;
        const message = `${method} ${url} - ${duration}ms`;

        if (duration > 1000) {
          this.logger.warn(`Slow request: ${message}`);
        } else if (duration > 500) {
          this.logger.log(`Medium request: ${message}`);
        }

        // In production, you might want to send this to a monitoring service
        if (process.env.NODE_ENV === 'production' && duration > 2000) {
          // Send alert for very slow requests
          this.logger.error(`Very slow request: ${message}`);
        }
      })
    );
  }
}
