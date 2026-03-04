export interface User {
  id: string;
  username?: string;
  email?: string;
  roles: string[];
  permissions?: string[];
}

export interface SecurityMiddlewareConfig {
  enableRateLimit?: boolean;
  enableCors?: boolean;
  enableSecurityHeaders?: boolean;
  corsOptions?: {
    origin?: string | string[] | boolean;
    methods?: string[];
    allowedHeaders?: string[];
    credentials?: boolean;
  };
  rateLimitOptions?: {
    windowMs?: number;
    max?: number;
    skipSuccessfulRequests?: boolean;
  };
}
