import { NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common';
import { Observable } from 'rxjs';
import { A2AService } from '../services/A2AService';
export declare class A2AInterceptor implements NestInterceptor {
    private readonly a2aService;
    private logger;
    constructor(a2aService: A2AService);
    intercept(context: ExecutionContext, next: CallHandler): Observable<any>;
}
export declare function LogA2AInteraction(options?: {
    interactionType?: string;
    logPayload?: boolean;
}): (target: any, propertyKey: string, descriptor: PropertyDescriptor) => PropertyDescriptor;
//# sourceMappingURL=A2AInterceptor.d.ts.map