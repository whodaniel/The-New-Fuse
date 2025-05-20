import { Injectable, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { CentralizedLoggingService } from '../logging/centralized-logging.service.js';
import { ErrorTrackingService, ErrorCategory, ErrorSeverity } from '../monitoring/ErrorTrackingService.js';
import { z } from 'zod';
import { Request } from 'express';

export interface ValidationOptions {
  abortEarly?: boolean;
  stripUnknown?: boolean;
  allowUnknown?: boolean;
}

export interface ValidationResult<T> {
  success: boolean;
  value?: T;
  errors?: string[];
}

@Injectable()
export class RequestValidationService {
  private readonly logger: any;
  private readonly defaultOptions: ValidationOptions;

  constructor(
    private readonly configService: ConfigService,
    private readonly loggingService: CentralizedLoggingService,
    private readonly errorTrackingService: ErrorTrackingService
  ) {
    this.logger = this.loggingService.createLogger('RequestValidation');
    
    // Load default options
    this.defaultOptions = {
      abortEarly: this.configService.get<boolean>('api.validation.abortEarly', false),
      stripUnknown: this.configService.get<boolean>('api.validation.stripUnknown', true),
      allowUnknown: this.configService.get<boolean>('api.validation.allowUnknown', false)
    };
    
    this.logger.info('Request validation service initialized');
  }

  /**
   * Validate request body against a Zod schema
   */
  validateBody<T>(request: Request, schema: z.ZodType<T>, options?: ValidationOptions): ValidationResult<T> {
    return this.validate(request.body, schema, options);
  }

  /**
   * Validate request query parameters against a Zod schema
   */
  validateQuery<T>(request: Request, schema: z.ZodType<T>, options?: ValidationOptions): ValidationResult<T> {
    return this.validate(request.query, schema, options);
  }

  /**
   * Validate request parameters against a Zod schema
   */
  validateParams<T>(request: Request, schema: z.ZodType<T>, options?: ValidationOptions): ValidationResult<T> {
    return this.validate(request.params, schema, options);
  }

  /**
   * Validate request headers against a Zod schema
   */
  validateHeaders<T>(request: Request, schema: z.ZodType<T>, options?: ValidationOptions): ValidationResult<T> {
    return this.validate(request.headers, schema, options);
  }

  /**
   * Validate data against a Zod schema
   */
  validate<T>(data: any, schema: z.ZodType<T>, options?: ValidationOptions): ValidationResult<T> {
    const opts = { ...this.defaultOptions, ...options };
    
    try {
      const result = schema.safeParse(data);
      
      if (result.success) {
        return {
          success: true,
          value: result.data
        };
      } else {
        const formattedErrors = this.formatZodErrors(result.error);
        
        this.logger.debug('Validation failed', {
          metadata: {
            errors: formattedErrors,
            data: JSON.stringify(data).substring(0, 200)
          }
        });
        
        return {
          success: false,
          errors: formattedErrors
        };
      }
    } catch (error) {
      this.logger.error('Validation error', { error });
      
      this.errorTrackingService.trackError(error, {
        context: { data: JSON.stringify(data).substring(0, 200) },
        category: ErrorCategory.VALIDATION,
        severity: ErrorSeverity.LOW
      });
      
      return {
        success: false,
        errors: ['Internal validation error']
      };
    }
  }

  /**
   * Validate and throw exception if validation fails
   */
  validateAndThrow<T>(data: any, schema: z.ZodType<T>, options?: ValidationOptions): T {
    const result = this.validate(data, schema, options);
    
    if (!result.success) {
      throw new BadRequestException({
        statusCode: 400,
        message: 'Validation failed',
        errors: result.errors
      });
    }
    
    return result.value!;
  }

  /**
   * Format Zod errors into a readable array of strings
   */
  private formatZodErrors(error: z.ZodError): string[] {
    return error.errors.map(err => {
      const path = err.path.join('.');
      return path ? `${path}: ${err.message}` : err.message;
    });
  }
}
