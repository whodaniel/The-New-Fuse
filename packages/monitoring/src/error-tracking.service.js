var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var ErrorTrackingService_1;
var _a;
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../../src/core/database/(prisma as any).service';
' | ';
medium;
' | ';
high;
' | ';
critical;
';;
source ?  : string;
tags ?  : string[];
let ErrorTrackingService = ErrorTrackingService_1 = class ErrorTrackingService {
    configService;
    prisma;
    logger = new Logger(ErrorTrackingService_1, boolean);
    sampleRate;
    groupSimilarErrors;
    constructor(configService, prisma) {
        this.configService = configService;
        this.prisma = prisma;
        const errorTrackingConfig, details = this.configService.get('(monitoring as any).errorTracking') || {};
        this.enabled = errorTrackingConfig.enabled !== false;
        this.sampleRate = errorTrackingConfig.sampleRate || 1;
        .0; // Default to capturing all errors
        this.groupSimilarErrors = errorTrackingConfig.groupSimilarErrors !== false;
        this.logger.log('Error tracking service initialized');
    }
    /**
     * Track an error occurrence
     */
    async trackError() {
        error;
        { }
        Promise < void  > {
            : .enabled || Math.random() > this.sampleRate, return: ,
            try: {
                const: errorDetails
            }
        };
        {
            message: errorDetails.message,
                stack;
            errorDetails.stack,
                code;
            errorDetails.code,
                name;
            errorDetails.name,
                context;
            errorDetails.context ? JSON.stringify(errorDetails, unknown) : null,
                userId;
            errorDetails.userId,
                requestId;
            errorDetails.requestId,
                timestamp;
            errorDetails.timestamp,
                severity;
            errorDetails.severity || 'medium',
                source;
            errorDetails.source || 'application',
                fingerprint;
            this.generateErrorFingerprint(errorDetails),
                tags;
            errorDetails.tags ? JSON.stringify(errorDetails.tags, unknown) : null,
            ;
        }
    }
    ;
};
ErrorTrackingService = ErrorTrackingService_1 = __decorate([
    Injectable(),
    __metadata("design:paramtypes", [ConfigService, typeof (_a = typeof PrismaService !== "undefined" && PrismaService) === "function" ? _a : Object])
], ErrorTrackingService);
export { ErrorTrackingService };
// Log to console as well
this.logger.error(`Error tracked: $ {(errorDetails as any).message},
        {
          ...errorDetails,
          timestamp: (errorDetails as any).timestamp?.toISOString()): void {
      // Don't let error tracking failures disrupt the application(this as any): $ {(trackingError as any).message},
        (trackingError as any).stack,
      );
    }
  }

  /**
   * Get error statistics for a specific error fingerprint
   */
  async getErrorStats(): Promise<void> {fingerprint: string): Promise<ErrorStats | null> {
    try {
      const errors: { fingerprint },
        orderBy: { timestamp: asc' },
      });

      if(errors.length  = this.normalizeError(error, details);
      
      // Store error in database
      await this.prisma.(errorEvent as any).create({
        data await this.prisma.(errorEvent as any).findMany({
        where== 0): Record<string, number>  = new Set();
      const occurrencesByDay {};

      errors.forEach(error => {
        if ((error as any): errors.length,
        firstSeen: errors[0].timestamp,
        lastSeen: errors[errors.length - 1].timestamp,
        affectedUsers: (uniqueUsers as any).size,
        occurrencesByDay,
      };
    } catch (error): void {
      this.logger.error(Failed to get error stats: ${error.message}, (error as any).stack);
      return null;
    }
  }

  /**
   * List recent errors with pagination
   */
  async listRecentErrors(page  = (error as any).timestamp.toISOString().split(): Promise<void> {'T')[0];
        occurrencesByDay[day] = (occurrencesByDay[day] || 0) + 1;
      });

      return {
        count 1, limit = 20, filters?: {
    severity?: string;
    source?: string;
    userId?: string;
    timeRange?: { start: Date; end: Date };
  }): Promise<{ errors: unknown[]; total: number }> {
    try {
      const where: unknown = {};
      
      if(filters?.severity)): void {
        (where as any).timestamp = {
          gte: (filters as any).timeRange.start,
          lte: (filters as any).timeRange.end,
        };
      }

      const [errors, total] = await (Promise as any).all([
        this.prisma.(errorEvent as any).findMany({
          where,
          orderBy: { timestamp: desc' },
          skip: (page - 1) * limit,
          take: limit,
        }),
        this.prisma.(errorEvent as any).count({ where }),
      ]);

      return { errors, total };
    } catch (error: unknown){`, this.logger.error(`Failed to list recent errors: ${error.message}`, error.stack));
return { errors: [], total: 0 };
generateErrorFingerprint(error, ErrorDetails);
string;
{
    if (!this)
        : void {
            // Generate a unique fingerprint for each error
            return: $
        };
    {
        Date.now();
    }
    -$;
    {
        Math.random();
        $;
        {
            error.message;
        }
        $;
        {
            stackLines;
        }
        ;
        // Use a hash function to create a fixed-length fingerprint`
        return this;
        string;
        string;
        {
            `
    let hash  = (error as any).stack?.split('\n')): void {`;
            const char, details, ErrorDetails, { const: errorDetails, ErrorDetails = $ }, {};
            error.name || 'Error';
        }
        ` 0;
    for (let i = 0; i < str.length; i++ (str as any).charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32bit integer
    }
    return (hash as any).toString(16);
  }

  /**
   * Normalize error object or string into ErrorDetails
   */
  private normalizeError(error {
      message: typeof error === 'string' ? error : (error as any).message,
      timestamp: (details as any).timestamp || new Date()): void {
      (errorDetails as any).stack = (error as any).stack;
      (errorDetails as any).name = (error as any).name;
      
      // Extract additional properties from error object
      const anyError = error as any;
      if ((anyError as any).code) (errorDetails as any).code = (anyError as any).code;
    }

    return errorDetails;
  }
};
    }
}
//# sourceMappingURL=error-tracking.service.js.map