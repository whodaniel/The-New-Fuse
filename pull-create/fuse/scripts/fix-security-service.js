#!/usr/bin/env node

import fs from 'fs';
import path from 'path';

const securityServicePath = path.join(process.cwd(), 'src', 'core', 'security', 'security-service.ts');

// Check if the file exists
if (!fs.existsSync(securityServicePath)) {
  
  process.exit(0);
}

// Read the current file content
const content = fs.readFileSync(securityServicePath, 'utf8');

// Fix the syntax errors by providing a corrected version of the file
const correctedContent = `import { injectable, inject } from 'inversify';
import TYPES from '../di/types.js';
import { Logger } from 'winston';
import { ConfigService } from '../config/config-service.js';
import { ErrorHandler } from '../error/error-handler.js';
import { MetricsCollector } from '../metrics/metrics-collector.js';
import { EventBus } from '../events/event-bus.js';
import { Request, Response, NextFunction } from 'express';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import cors from 'cors';
import { createHash } from 'crypto';

interface SecurityConfig {
  rateLimit: {
    windowMs: number;
    max: number;
  };
  cors: {
    origin: string[];
    methods: string[];
  };
  csrf: {
    enabled: boolean;
    ignoreMethods: string[];
  };
}

@injectable()
export class SecurityService {
  private readonly securityConfig: SecurityConfig;
  private readonly bruteForceProtection: Map<string, { attempts: number; lastAttempt: number }>;
  private readonly metrics: MetricsCollector;

  constructor(
    @inject(TYPES.LoggingService) private logger: Logger,
    @inject(TYPES.ConfigService) private config: ConfigService,
    @inject(TYPES.ErrorHandler) private errorHandler: ErrorHandler,
    @inject(TYPES.MetricsCollector) metrics: MetricsCollector,
    @inject(TYPES.EventBus) private eventBus: EventBus
  ) {
    this.securityConfig = this.config.get('security');
    this.bruteForceProtection = new Map();
    this.metrics = metrics;
  }

  public configureMiddleware(app: any): void {
    // Basic security headers
    app.use(helmet());

    // CORS configuration
    app.use(this.configureCors());

    // Rate limiting
    app.use(this.configureRateLimit());

    // Content security policy
    app.use(this.configureCSP());

    // Brute force protection
    app.use(this.bruteForceProtectionMiddleware.bind(this));

    // Request validation
    app.use(this.requestValidationMiddleware.bind(this));

    // Response security headers
    app.use(this.securityHeadersMiddleware.bind(this));
  }

  private configureCors() {
    return cors({
      origin: this.securityConfig.cors.origin,
      methods: this.securityConfig.cors.methods,
      credentials: true,
      maxAge: 86400 // 24 hours
    });
  }

  private configureRateLimit() {
    return rateLimit({
      windowMs: this.securityConfig.rateLimit.windowMs,
      max: this.securityConfig.rateLimit.max,
      handler: (req: Request, res: Response) => {
        this.metrics.incrementCounter('security_rate_limit_exceeded', {
          ip: req.ip || 'unknown',
          path: req.path
        });
        
        res.status(429).json({
          error: {
            code: 'RATE_LIMIT_EXCEEDED',
            message: 'Too many requests, please try again later.'
          }
        });
      }
    });
  }

  private configureCSP() {
    return helmet.contentSecurityPolicy({
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'", "'unsafe-inline'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        imgSrc: ["'self'", 'data:', 'https:'],
        connectSrc: ["'self'"],
        fontSrc: ["'self'"],
        objectSrc: ["'none'"],
        mediaSrc: ["'self'"],
        frameSrc: ["'none'"]
      }
    });
  }

  private bruteForceProtectionMiddleware(req: Request, res: Response, next: NextFunction): void {
    const ip = req.ip || 'unknown';
    const path = req.path;
    const key = \`\${ip}:\${path}\`;

    const record = this.bruteForceProtection.get(key) || { attempts: 0, lastAttempt: Date.now() };
    const timeSinceLastAttempt = Date.now() - record.lastAttempt;

    // Reset attempts if enough time has passed
    if (timeSinceLastAttempt > 3600000) { // 1 hour
      record.attempts = 0;
    }

    if (record.attempts >= 5) {
      this.metrics.incrementCounter('security_brute_force_blocked', { 
        ip: ip || 'unknown', 
        path 
      });
      
      this.eventBus.publish('security.warning', {
        type: 'brute_force_attempt',
        ip,
        path,
        attempts: record.attempts
      });

      return res.status(403).json({
        error: {
          code: 'TOO_MANY_ATTEMPTS',
          message: 'Access temporarily blocked due to too many attempts.'
        }
      });
    }

    record.attempts++;
    record.lastAttempt = Date.now();
    this.bruteForceProtection.set(key, record);

    next();
  }

  private requestValidationMiddleware(req: Request, res: Response, next: NextFunction): void {
    // Validate content type
    if (req.method !== 'GET' && !req.is('application/json')) {
      return res.status(415).json({
        error: {
          code: 'INVALID_CONTENT_TYPE',
          message: 'Content-Type must be application/json'
        }
      });
    }

    // Validate request size
    const contentLength = parseInt(req.headers['content-length'] || '0', 10);
    if (contentLength > 1024 * 1024) { // 1MB
      return res.status(413).json({
        error: {
          code: 'REQUEST_TOO_LARGE',
          message: 'Request entity too large'
        }
      });
    }

    next();
  }

  private securityHeadersMiddleware(req: Request, res: Response, next: NextFunction): void {
    // Add security headers
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'DENY');
    res.setHeader('X-XSS-Protection', '1; mode=block');
    res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
    
    // Remove sensitive headers
    res.removeHeader('X-Powered-By');
    res.removeHeader('Server');

    next();
  }

  public validateInput(input: any, schema: any): boolean {
    // Implement input validation logic
    return true;
  }

  public sanitizeOutput(data: any): any {
    // Implement output sanitization logic
    return data;
  }

  public hashData(data: string): string {
    return createHash('sha256').update(data).digest('hex');
  }

  validateRequestIP(req: Request, res: Response): Response | void {
    const userInfo = {
      ip: req.ip || "unknown",
    };
    // Implementation...
  }

  blockBruteForceAttempt(req: Request, res: Response, ip: string, path: string): Response | void {
    this.metrics.incrementCounter('security_brute_force_blocked', { 
      ip: ip || "unknown", 
      path 
    });
    // Implementation...
  }

  rejectUnsupportedMediaType(req: Request, res: Response): Response | void {
    // Implementation...
  }

  rejectOversizedPayload(req: Request, res: Response): Response | void {
    // Implementation...
  }
}`;

// Write the corrected content
fs.writeFileSync(securityServicePath, correctedContent);

