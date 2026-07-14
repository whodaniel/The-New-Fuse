import { CanActivate, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { InputSanitizationService } from '../security/input-sanitization.service';
import { ResponseSanitizationService } from '../security/response-sanitization.service';
export declare class SecurityGuard implements CanActivate {
    private reflector;
    private sanitizationService;
    private responseSanitization;
    constructor(reflector: Reflector, sanitizationService: InputSanitizationService, responseSanitization: ResponseSanitizationService);
    canActivate(context: ExecutionContext): Promise<boolean>;
    private getSecurityOptions;
    private checkRateLimit;
    private normalizeRequestPath;
    private isAuthBootstrapPath;
    private checkAuthBootstrapRateLimit;
    private resolvePositiveInteger;
    private pruneRateLimitData;
    private validateAndSanitizeInput;
    private addSecurityHeaders;
    private addRequestTracking;
    private prepareForResponse;
    private isAuthenticated;
    private validateJWT;
    private validateAuthorization;
    private validateCSRFToken;
    private isStateChangingRequest;
    private getClientIP;
    private generateRequestId;
}
export declare function RequireAuth(): (target: any, propertyKey: string, descriptor: PropertyDescriptor) => void;
export declare function RequireRole(...roles: string[]): (target: any, propertyKey: string, descriptor: PropertyDescriptor) => void;
export declare function RequirePermission(...permissions: string[]): (target: any, propertyKey: string, descriptor: PropertyDescriptor) => void;
export declare function RateLimit(requests: number, window: number): (target: any, propertyKey: string, descriptor: PropertyDescriptor) => void;
export declare function SanitizeInput(): (target: any, propertyKey: string, descriptor: PropertyDescriptor) => void;
export declare function ValidateCSRF(): (target: any, propertyKey: string, descriptor: PropertyDescriptor) => void;
export declare function StrictMode(): (target: any, propertyKey: string, descriptor: PropertyDescriptor) => void;
//# sourceMappingURL=security.guard.d.ts.map