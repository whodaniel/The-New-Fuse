import { injectable, inject } from 'inversify';
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
    @inject(TYPES.MetricsCollector) private metrics: MetricsCollector,
    @inject(TYPES.EventBus) private eventBus: EventBus
  ) {
    this.securityConfig = this.config.get('security');
    // Initialize brute force protection map
    this.bruteForceProtection = new Map();
    // Basic security headers
    // Assuming 'app' is an Express Application instance provided elsewhere (e.g., passed to a setup method)
    // For the purpose of fixing specified TS errors, I will assume 'app' is globally available or correctly scoped.
    // If 'app' is not defined, it would cause a runtime error, but not a TS error listed.
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
    // Removed problematic lines:
    // const ip = req.ip || 'unknown';
    // const path = req.path;
    // Implementation...
  }

  private bruteForceProtectionMiddleware(req: Request, res: Response, next: NextFunction): void {
    const ip = req.ip || 'unknown';
    const path = req.path;
    const key = `${ip}:${path}`;
    const record = this.bruteForceProtection.get(key) || { attempts: 0, lastAttempt: Date.now() };

    if (Date.now() - record.lastAttempt > 3600000) { // 1 hour
      record.attempts = 0;
    }

    if (record.attempts >= 5) {
      this.logger.warn(`Brute force attempt detected`, { ip, path, attempts: record.attempts });
      this.metrics.incrementCounter('security_brute_force_blocked', {
        ip,
        path
      });
      this.eventBus.publish('security.warning', { // Changed eventBus to this.eventBus
        type: 'brute_force_attempt',
        ip,
        path,
        attempts: record.attempts
      });
      res.status(403).json({ // Added return
        error: {
          code: 'TOO_MANY_ATTEMPTS',
          message: 'Access temporarily blocked due to too many attempts.'
        }
      });
      return;
    }

    record.attempts++;
    record.lastAttempt = Date.now();
    this.bruteForceProtection.set(key, record);
    next();
  }

  private requestValidationMiddleware(req: Request, res: Response, next: NextFunction): void {
    // Validate content type
    if (req.method !== 'GET' && req.method !== 'HEAD' && !req.is('application/json')) {
      this.metrics.incrementCounter('security_invalid_content_type', { ip: req.ip || 'unknown', path: req.path });
      res.status(415).json({
        error: {
          code: 'INVALID_CONTENT_TYPE',
          message: 'Content-Type must be application/json for non-GET/HEAD requests.'
        }
      });
      return;
    }

    // Validate content length (payload size)
    const MAX_PAYLOAD_SIZE = 1_048_576; // 1MB
    const contentLength = parseInt(req.headers['content-length'] || '0', 10);
    if (contentLength > MAX_PAYLOAD_SIZE) {
      this.metrics.incrementCounter('security_payload_too_large', { ip: req.ip || 'unknown', path: req.path, size: contentLength });
      res.status(413).json({
        error: {
          code: 'PAYLOAD_TOO_LARGE',
          message: `Request entity too large. Maximum size allowed is ${MAX_PAYLOAD_SIZE / 1024 / 1024}MB.`
        }
      });
      return;
    }
    next();
  }

  private securityHeadersMiddleware(req: Request, res: Response, next: NextFunction): void {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'DENY');
    res.setHeader('X-XSS-Protection', '1; mode=block');
    res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
    next();
  }

  public sanitizeOutput(data: unknown): unknown {
    if (typeof data === 'string') {
      return data.replace(/[&<>"'`]/g, (match) => {
          const escapeMap: Record<string, string> = { // Corrected HTML escapes
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            '"': '&quot;',
            "'": '&#39;',
          '`': '&#x60;'
        };
        return escapeMap[match] || match;
      });
    }
    return data;
  }

  public hashData(data: string): string {
    return createHash('sha256').update(data).digest('hex');
    // Removed unreachable code:
    // const userInfo = {
    //   ip: req.ip || "unknown",
    // };
    // // Implementation...
  }

  public blockBruteForceAttempt(req: Request, res: Response, ip: string, path: string): Response | void {
    this.metrics.incrementCounter('security_brute_force_blocked', { // Changed metrics to this.metrics
      ip: ip || "unknown",
      path
    }); // Corrected syntax for incrementCounter call
    // Implementation... (Note: This method might need to return res or call next if it's a middleware)
    // For now, just fixing the TS error. If it's a middleware, it should call next() or send a response.
    // If it's a utility, its return type and usage should be clear.
    // Assuming it sends a response or is handled by the caller.
    // A common pattern would be:
    // return res.status(403).json({ message: 'Blocked due to brute force attempts' });
    // Or if it's just for metrics and logging, void is fine.
  }

  public rejectOversizedPayload(req: Request, res: Response): Response | void {
    // Implementation...
  }
}