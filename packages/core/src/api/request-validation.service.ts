import { Injectable, BadRequestException, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Request } from 'express';
import * as z from 'zod';

export enum ErrorCategory {
  VALIDATION = 'validation',
  AUTHENTICATION = 'authentication',
  AUTHORIZATION = 'authorization',
  NOT_FOUND = 'not_found',
  INTERNAL = 'internal'
}

export enum ErrorSeverity {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical'
}

export interface ValidationError {
  field: string;
  message: string;
  code: string;
}

@Injectable()
export class RequestValidationService {
  private readonly logger = new Logger(RequestValidationService.name);

  constructor(private readonly configService: ConfigService) {}

  validateRequest<T>(schema: z.ZodSchema<T>, request: Request): T {
    try {
      const result = schema.parse(request.body, {
        abortEarly: false,
        stripUnknown: true,
        allowUnknown: false
      });
      
      this.logger.debug('Request validation successful');
      return result;
    } catch (error) {
      if (error instanceof z.ZodError) {
        this.logger.warn('Request validation failed', error.errors);
        
        const validationErrors: ValidationError[] = error.errors.map(err => ({
          field: err.path.join('.'),
          message: err.message,
          code: err.code
        }));
        
        throw new BadRequestException({
          category: ErrorCategory.VALIDATION,
          severity: ErrorSeverity.MEDIUM,
          errors: validationErrors
        });
      }
      
      this.logger.error('Unexpected validation error', error);
      throw new BadRequestException('Invalid request format');
    }
  }

  validateQuery<T>(schema: z.ZodSchema<T>, request: Request): T {
    try {
      const result = schema.parse(request.query, {
        abortEarly: false,
        stripUnknown: true
      });
      
      return result;
    } catch (error) {
      if (error instanceof z.ZodError) {
        const validationErrors: ValidationError[] = error.errors.map(err => ({
          field: err.path.join('.'),
          message: err.message,
          code: err.code
        }));
        
        throw new BadRequestException({
          category: ErrorCategory.VALIDATION,
          severity: ErrorSeverity.LOW,
          errors: validationErrors
        });
      }
      
      throw new BadRequestException('Invalid query parameters');
    }
  }
}