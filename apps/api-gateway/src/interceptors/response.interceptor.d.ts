/**
 * Response Interceptor
 * Standardizes response format across the API Gateway
 */
import { NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common';
import { Observable } from 'rxjs';
export interface StandardResponse<T> {
    success: boolean;
    timestamp: string;
    path: string;
    method: string;
    data?: T;
    message?: string;
}
export declare class ResponseInterceptor<T> implements NestInterceptor<T, StandardResponse<T>> {
    intercept(context: ExecutionContext, next: CallHandler): Observable<StandardResponse<T>>;
}
//# sourceMappingURL=response.interceptor.d.ts.map