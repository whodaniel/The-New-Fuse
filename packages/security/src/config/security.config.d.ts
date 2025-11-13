export interface SecurityConfig {
    jwt: {
        secret: string;
        expiresIn: string;
        refreshSecret: string;
        refreshExpiresIn: string;
    };
    bcrypt: {
        saltRounds: number;
    };
    rateLimiting: {
        windowMs: number;
        max: number;
        skipSuccessfulRequests: boolean;
    };
    mfa: {
        issuer: string;
        window: number;
    };
    audit: {
        enabled: boolean;
        retentionDays: number;
    };
    cors: {
        origin: string[];
        credentials: boolean;
    };
}
export declare const securityConfig: (() => SecurityConfig) & import("@nestjs/config").ConfigFactoryKeyHost<SecurityConfig>;
//# sourceMappingURL=security.config.d.ts.map