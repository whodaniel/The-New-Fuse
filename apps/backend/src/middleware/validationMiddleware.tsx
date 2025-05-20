import { Injectable, NestMiddleware, BadRequestException } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { ValidationService } from '../services/validationService.js';
import { LoggingService } from '../services/loggingService.js';

export interface ValidationOptions {
  dto?: new () => any;
  schema?: object;
  rules?: { [key: string]: (value: any) => boolean | Promise<boolean> };
  validateQuery?: boolean;
  validateBody?: boolean;
  validateParams?: boolean;
}

@Injectable()
export class ValidationMiddleware implements NestMiddleware {
  constructor(
    private readonly validationService: ValidationService,
    private readonly logger: LoggingService
  ) {}

  use(options: ValidationOptions) {
    return async (req: Request, res: Response, next: NextFunction) => {
      try {
        const validationPromises: Promise<boolean>[] = [];

        // Validate request body
        if (options.validateBody && req.body) {
          if (options.dto) {
            const result = await this.validationService.validateRequest(req.body, options.dto);
            if (!result.isValid) {
              throw new BadRequestException({
                message: 'Validation failed',
                errors: result.errors
              });
            }
          }

          if (options.schema) {
            const isValid = this.validationService.validateSchema(req.body, options.schema);
            if (!isValid) {
              throw new BadRequestException('Request body does not match schema');
            }
          }

          if (options.rules) {
            validationPromises.push(
              this.validationService.validateValue(req.body, options.rules)
            );
          }
        }

        // Validate query parameters
        if (options.validateQuery && req.query) {
          if (options.schema) {
            const isValid = this.validationService.validateSchema(req.query, options.schema);
            if (!isValid) {
              throw new BadRequestException('Query parameters do not match schema');
            }
          }

          if (options.rules) {
            validationPromises.push(
              this.validationService.validateValue(req.query, options.rules)
            );
          }
        }

        // Validate route parameters
        if (options.validateParams && req.params) {
          if (options.schema) {
            const isValid = this.validationService.validateSchema(req.params, options.schema);
            if (!isValid) {
              throw new BadRequestException('Route parameters do not match schema');
            }
          }

          if (options.rules) {
            validationPromises.push(
              this.validationService.validateValue(req.params, options.rules)
            );
          }
        }

        // Wait for all validation promises to resolve
        const results = await Promise.all(validationPromises);
        if (results.some(result => !result)) {
          throw new BadRequestException('Validation rules failed');
        }

        next();
      } catch (error) {
        this.logger.error('Request validation failed', {
          path: req.path,
          method: req.method,
          error
        });

        if (error instanceof BadRequestException) {
          throw error;
        }

        throw new BadRequestException('Request validation failed');
      }
    };
  }
} 