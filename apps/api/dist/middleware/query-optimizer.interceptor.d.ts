import { NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common';
import { Observable } from 'rxjs';
export declare class QueryOptimizerInterceptor implements NestInterceptor {
    private readonly logger;
    private readonly queryStats;
    private readonly N_PLUS_ONE_THRESHOLD;
    intercept(context: ExecutionContext, next: CallHandler): Observable<any>;
    /**
     * Records a database query
     */
    recordQuery(requestId: string, query: string, duration: number): void;
    /**
     * Logs query statistics and detects N+1 patterns
     */
    private logQueryStats;
    /**
     * Extracts a normalized query pattern
     */
    private extractQueryPattern;
    /**
     * Suggests optimization strategies
     */
    private suggestOptimization;
    /**
     * Generates a unique request ID
     */
    private generateRequestId;
}
/**
 * Decorator to enable query optimization monitoring
 */
export declare function MonitorQueries(): (target: any, propertyKey: string, descriptor: PropertyDescriptor) => PropertyDescriptor;
//# sourceMappingURL=query-optimizer.interceptor.d.ts.map