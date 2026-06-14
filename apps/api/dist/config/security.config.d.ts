export interface SecurityConfig {
    jwt: {
        secret: string;
        expiresIn: string;
        refreshExpiresIn: string;
        issuer: string;
        audience: string;
    };
    rateLimit: {
        enabled: boolean;
        defaultLimit: number;
        defaultWindow: number;
        tiers: {
            auth: {
                requests: number;
                window: number;
            };
            api: {
                requests: number;
                window: number;
            };
            admin: {
                requests: number;
                window: number;
            };
            public: {
                requests: number;
                window: number;
            };
            health: {
                requests: number;
                window: number;
            };
        };
    };
    cors: {
        allowedOrigins: string[];
        allowedMethods: string[];
        allowedHeaders: string[];
        credentials: boolean;
        maxAge: number;
    };
    securityHeaders: {
        contentSecurityPolicy: string;
        xFrameOptions: string;
        xContentTypeOptions: string;
        xXSSProtection: string;
        referrerPolicy: string;
        permissionsPolicy: string;
        strictTransportSecurity: string;
    };
    inputValidation: {
        maxPayloadSize: number;
        allowedContentTypes: string[];
        sanitizeInput: boolean;
        validateFileUploads: boolean;
        maxFileSize: number;
    };
    sessions: {
        secure: boolean;
        httpOnly: boolean;
        sameSite: 'strict' | 'lax' | 'none';
        maxAge: number;
    };
    monitoring: {
        logLevel: 'error' | 'warn' | 'info' | 'debug';
        enableSecurityLogging: boolean;
        logRetention: number;
        enableMetrics: boolean;
        enableHealthChecks: boolean;
    };
    ssl: {
        required: boolean;
        hstsMaxAge: number;
        includeSubDomains: boolean;
        preload: boolean;
    };
    ipFiltering: {
        enabled: boolean;
        whitelist: string[];
        blacklist: string[];
        maxFailedAttempts: number;
        blockDuration: number;
    };
}
declare const _default: (() => SecurityConfig) & import("@nestjs/config").ConfigFactoryKeyHost<SecurityConfig>;
export default _default;
//# sourceMappingURL=security.config.d.ts.map