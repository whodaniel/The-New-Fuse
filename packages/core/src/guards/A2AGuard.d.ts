import { CanActivate, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { A2AService } from '../services/A2AService';
export declare class A2AGuard implements CanActivate {
    private reflector;
    private readonly a2aService;
    private logger;
    constructor(reflector: Reflector, a2aService: A2AService);
    canActivate(context: ExecutionContext): Promise<boolean>;
}
//# sourceMappingURL=A2AGuard.d.ts.map