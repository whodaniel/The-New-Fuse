import { registerAs } from '@nestjs/config';

export interface SecurityConfig {
  // Authentication
  jwt: {
    secret: string;
    expiresIn: string;
    refreshExpiresIn: string;
    issuer: string;
    audience: string;
  };

  // Rate Limiting
  rateLimit: {
    enabled: boolean;
    defaultLimit: number;
    defaultWindow: number;
    tiers: {
      auth: { requests: number; window: number };
      api: { requests: number; window: number };
      admin: { requests: number; window: number };
      public: { requests: number; window: number };
      health: { requests: number; window: number };
    };
  };

  // CORS
  cors: {
    allowedOrigins: string[];
    allowedMethods: string[];
    allowedHeaders: string[];
    credentials: boolean;
    maxAge: number;
  };

  // Security Headers
  securityHeaders: {
    contentSecurityPolicy: string;
    xFrameOptions: string;
    xContentTypeOptions: string;
    xXSSProtection: string;
    referrerPolicy: string;
    permissionsPolicy: string;
    strictTransportSecurity: string;
  };

  // Input Validation
  inputValidation: {
    maxPayloadSize: number;
    allowedContentTypes: string[];
    sanitizeInput: boolean;
    validateFileUploads: boolean;
    maxFileSize: number;
  };

  // Session Management
  sessions: {
    secure: boolean;
    httpOnly: boolean;
    sameSite: 'strict' | 'lax' | 'none';
    maxAge: number;
  };

  // Monitoring
  monitoring: {
    logLevel: 'error' | 'warn' | 'info' | 'debug';
    enableSecurityLogging: boolean;
    logRetention: number; // days
    enableMetrics: boolean;
    enableHealthChecks: boolean;
  };

  // SSL/HTTPS
  ssl: {
    required: boolean;
    hstsMaxAge: number;
    includeSubDomains: boolean;
    preload: boolean;
  };

  // IP Filtering
  ipFiltering: {
    enabled: boolean;
    whitelist: string[];
    blacklist: string[];
    maxFailedAttempts: number;
    blockDuration: number; // minutes
  };
}

export default registerAs('security', (): SecurityConfig => {
  const isProduction = process.env.NODE_ENV === 'production';

  return {
    // Authentication Configuration
    jwt: {
      secret: process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-in-production',
      expiresIn: process.env.JWT_EXPIRES_IN || '15m',
      refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
      issuer: process.env.JWT_ISSUER || 'the-new-fuse-api',
      audience: process.env.JWT_AUDIENCE || 'the-new-fuse-clients',
    },

    // Rate Limiting Configuration
    rateLimit: {
      enabled: true,
      defaultLimit: parseInt(process.env.RATE_LIMIT_DEFAULT || '') || 100,
      defaultWindow: parseInt(process.env.RATE_LIMIT_WINDOW || '') || 60000, // 1 minute
      tiers: {
        auth: {
          requests: parseInt(process.env.RATE_LIMIT_AUTH || '') || 5,
          window: 60000, // 1 minute
        },
        api: {
          requests: parseInt(process.env.RATE_LIMIT_API || '') || 100,
          window: 60000, // 1 minute
        },
        admin: {
          requests: parseInt(process.env.RATE_LIMIT_ADMIN || '') || 20,
          window: 60000, // 1 minute
        },
        public: {
          requests: parseInt(process.env.RATE_LIMIT_PUBLIC || '') || 200,
          window: 60000, // 1 minute
        },
        health: {
          requests: parseInt(process.env.RATE_LIMIT_HEALTH || '') || 10,
          window: 60000, // 1 minute
        },
      },
    },

    // CORS Configuration
    cors: {
      allowedOrigins: [
        ...(process.env.ALLOWED_ORIGINS?.split(',') ||
          (isProduction
            ? ['https://yourdomain.com']
            : ['http://localhost:3000', 'http://localhost:3001', 'http://localhost:5173'])),
        'chrome-extension://kddfgejmbblgadkdmalfnagbiefbcdmi',
      ],
      allowedMethods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
      allowedHeaders: [
        'Content-Type',
        'Authorization',
        'X-Requested-With',
        'X-CSRF-Token',
        'X-Request-ID',
        'X-Client-IP',
      ],
      credentials: true,
      maxAge: 86400, // 24 hours
    },

    // Security Headers Configuration
    securityHeaders: {
      contentSecurityPolicy:
        "default-src 'self'; " +
        "script-src 'self' 'unsafe-inline' 'unsafe-eval'; " +
        "style-src 'self' 'unsafe-inline'; " +
        "img-src 'self' data: https:; " +
        "font-src 'self'; " +
        "connect-src 'self' wss: https:; " +
        "frame-src 'none'; " +
        "object-src 'none'; " +
        "base-uri 'self'; " +
        "form-action 'self'; " +
        'upgrade-insecure-requests;',

      xFrameOptions: 'DENY',
      xContentTypeOptions: 'nosniff',
      xXSSProtection: '1; mode=block',
      referrerPolicy: 'strict-origin-when-cross-origin',
      permissionsPolicy: 'geolocation=(), microphone=(), camera=(), payment=(), fullscreen=(*)',
      strictTransportSecurity: isProduction
        ? 'max-age=31536000; includeSubDomains; preload'
        : 'max-age=31536000; includeSubDomains',
    },

    // Input Validation Configuration
    inputValidation: {
      maxPayloadSize: parseInt(process.env.MAX_PAYLOAD_SIZE || '') || 10 * 1024 * 1024, // 10MB
      allowedContentTypes: [
        'application/json',
        'application/x-www-form-urlencoded',
        'multipart/form-data',
        'text/plain',
      ],
      sanitizeInput: true,
      validateFileUploads: true,
      maxFileSize: 5 * 1024 * 1024, // 5MB
    },

    // Session Management
    sessions: {
      secure: isProduction,
      httpOnly: true,
      sameSite: isProduction ? 'strict' : 'lax',
      maxAge: 24 * 60 * 60 * 1000, // 24 hours
    },

    // Monitoring Configuration
    monitoring: {
      logLevel: (process.env.LOG_LEVEL as any) || (isProduction ? 'warn' : 'info'),
      enableSecurityLogging: true,
      logRetention: parseInt(process.env.LOG_RETENTION_DAYS || '') || 30,
      enableMetrics: true,
      enableHealthChecks: true,
    },

    // SSL/HTTPS Configuration
    ssl: {
      required: isProduction,
      hstsMaxAge: 31536000, // 1 year
      includeSubDomains: true,
      preload: true,
    },

    // IP Filtering Configuration
    ipFiltering: {
      enabled: true,
      whitelist: process.env.IP_WHITELIST?.split(',') || [],
      blacklist: process.env.IP_BLACKLIST?.split(',') || [],
      maxFailedAttempts: 5,
      blockDuration: 60, // 60 minutes
    },
  };
});
