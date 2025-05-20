import { Logger } from "winston";
import { ConfigService } from '../config/config-service.js';
import { ErrorHandler } from '../error/error-handler.js';
import { MetricsCollector } from '../metrics/metrics-collector.js';
import { EventBus } from '../events/event-bus.js';
import { Request, Response } from "express";
export declare class SecurityService {
  private logger;
  private config;
  private errorHandler;
  private eventBus;
  private readonly securityConfig;
  private readonly bruteForceProtection;
  private readonly metrics;
  constructor(
    logger: Logger,
    config: ConfigService,
    errorHandler: ErrorHandler,
    metrics: MetricsCollector,
    eventBus: EventBus,
  );
  configureMiddleware(app: unknown): void;
  private configureCors;
  private configureRateLimit;
  private configureCSP;
  private bruteForceProtectionMiddleware;
  private requestValidationMiddleware;
  private securityHeadersMiddleware;
  validateInput(input: unknown, schema: unknown): boolean;
  sanitizeOutput(data: unknown): unknown;
  hashData(data: string): string;
  validateRequestIP(req: Request, res: Response): Response | void;
  blockBruteForceAttempt(
    req: Request,
    res: Response,
    ip: string,
    path: string,
  ): Response | void;
  rejectUnsupportedMediaType(req: Request, res: Response): Response | void;
  rejectOversizedPayload(req: Request, res: Response): Response | void;
}
