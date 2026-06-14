export interface SecurityConfig {
    apiKey?: string;
    secret?: string;
    allowedOrigins?: string[];
}
export interface AuthToken {
    token: string;
    expiresAt: Date;
    userId: string;
}
export interface SecurityScheme {
    type: 'bearer' | 'apiKey' | 'basic' | 'oauth2';
    name?: string;
    in?: 'query' | 'header' | 'cookie';
    scheme?: string;
    bearerFormat?: string;
    flows?: unknown;
    openIdConnectUrl?: string;
}
//# sourceMappingURL=security.d.ts.map