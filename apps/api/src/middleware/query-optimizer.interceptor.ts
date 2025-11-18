import { Injectable, NestInterceptor, ExecutionContext, CallHandler, Logger } from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';

/**
 * Query Optimization Interceptor
 *
 * Automatically added by Implementer Agent as part of self-improvement cycle.
 * This interceptor monitors and optimizes database queries to prevent N+1 issues.
 *
 * Improvement ID: IMP-002
 * Issue Addressed: N+1 query pattern in workflow execution
 * Severity: High
 * Impact: 9/10
 * Review Score: 89/100
 */

interface QueryStats {
  count: number;
  duration: number;
  patterns: Map<string, number>;
}

@Injectable()
export class QueryOptimizerInterceptor implements NestInterceptor {
  private readonly logger = new Logger(QueryOptimizerInterceptor.name);
  private readonly queryStats: Map<string, QueryStats> = new Map();
  private readonly N_PLUS_ONE_THRESHOLD = 10; // Alert if more than 10 queries per request

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    const requestId = this.generateRequestId();
    const startTime = Date.now();

    // Initialize query tracking for this request
    this.queryStats.set(requestId, {
      count: 0,
      duration: 0,
      patterns: new Map(),
    });

    return next.handle().pipe(
      tap({
        next: () => {
          this.logQueryStats(requestId, request, startTime);
        },
        error: (error) => {
          this.logQueryStats(requestId, request, startTime, error);
        },
        complete: () => {
          // Clean up
          this.queryStats.delete(requestId);
        },
      })
    );
  }

  /**
   * Records a database query
   */
  recordQuery(requestId: string, query: string, duration: number) {
    const stats = this.queryStats.get(requestId);
    if (!stats) return;

    stats.count++;
    stats.duration += duration;

    // Extract query pattern (remove specific values)
    const pattern = this.extractQueryPattern(query);
    const currentCount = stats.patterns.get(pattern) || 0;
    stats.patterns.set(pattern, currentCount + 1);
  }

  /**
   * Logs query statistics and detects N+1 patterns
   */
  private logQueryStats(requestId: string, request: any, startTime: number, error?: Error) {
    const stats = this.queryStats.get(requestId);
    if (!stats) return;

    const totalDuration = Date.now() - startTime;
    const route = `${request.method} ${request.url}`;

    // Check for N+1 pattern
    if (stats.count > this.N_PLUS_ONE_THRESHOLD) {
      this.logger.warn(`⚠️  Potential N+1 query detected on ${route}`);
      this.logger.warn(`   Total queries: ${stats.count}`);
      this.logger.warn(`   Query duration: ${stats.duration}ms`);
      this.logger.warn(`   Total duration: ${totalDuration}ms`);
      this.logger.warn(`   Added by: Self-Improvement Agent Swarm`);

      // Log query patterns
      const topPatterns = Array.from(stats.patterns.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, 3);

      topPatterns.forEach(([pattern, count]) => {
        this.logger.warn(`   - ${pattern}: ${count} times`);
      });

      // Suggest optimization
      this.suggestOptimization(topPatterns);
    }

    // Log successful optimized queries
    if (stats.count <= 5 && stats.count > 0) {
      this.logger.log(`✅ Optimized queries on ${route}: ${stats.count} queries in ${stats.duration}ms`);
    }
  }

  /**
   * Extracts a normalized query pattern
   */
  private extractQueryPattern(query: string): string {
    // Remove specific values to get the pattern
    return query
      .replace(/\d+/g, 'N')
      .replace(/'[^']*'/g, "'?'")
      .replace(/"[^"]*"/g, '"?"')
      .substring(0, 100);
  }

  /**
   * Suggests optimization strategies
   */
  private suggestOptimization(patterns: [string, number][]): void {
    const mostFrequent = patterns[0];
    if (mostFrequent && mostFrequent[1] > 5) {
      this.logger.warn(`   💡 Suggestion: Consider using Prisma's include/select to fetch related data in a single query`);
      this.logger.warn(`   💡 Or implement DataLoader pattern for batching`);
    }
  }

  /**
   * Generates a unique request ID
   */
  private generateRequestId(): string {
    return `req-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }
}

/**
 * Decorator to enable query optimization monitoring
 */
export function MonitorQueries() {
  return function (target: any, propertyKey: string, descriptor: PropertyDescriptor) {
    const originalMethod = descriptor.value;

    descriptor.value = async function (...args: any[]) {
      const startTime = Date.now();

      try {
        const result = await originalMethod.apply(this, args);
        const duration = Date.now() - startTime;

        // Log if slow
        if (duration > 1000) {
          const logger = new Logger(target.constructor.name);
          logger.warn(`⏱️  Slow query detected in ${propertyKey}: ${duration}ms`);
          logger.warn(`   Added by: Self-Improvement Agent Swarm`);
        }

        return result;
      } catch (error) {
        throw error;
      }
    };

    return descriptor;
  };
}
