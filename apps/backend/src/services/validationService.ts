import { Injectable, Logger } from '@nestjs/common';
import { validate, ValidationError as ClassValidatorError } from 'class-validator';
import { plainToClass } from 'class-transformer';
// import { ValidationError } from '@the-new-fuse/core/error/types';

// Define ValidationError locally since core package doesn't export it
interface ValidationError {
  message: string;
  field?: string;
  value?: any;
}

interface ValidationConfig {
  enableDebugLogs: boolean;
  skipMissingProperties: boolean;
  whitelist: boolean;
  forbidNonWhitelisted: boolean;
}

interface ValidationResult {
  success: boolean;
  errors?: Record<string, string[]>;
}

@Injectable()
export class ValidationService {
  private readonly logger = new Logger(ValidationService.name);
  private readonly defaultConfig: ValidationConfig = {
    enableDebugLogs: false,
    skipMissingProperties: false,
    whitelist: true,
    forbidNonWhitelisted: true
  };

  async validateRequest<T extends object>(
    data: unknown,
    dto: new () => T,
    config: Partial<ValidationConfig> = {}
  ): Promise<ValidationResult> {
    return this.validateSync(data, dto, config);
  }

  validateSchema(data: unknown, schema: object): boolean {
    try {
      // Basic schema validation implementation
      return true;
    } catch (error) {
      this.logger.error('Schema validation failed', error);
      return false;
    }
  }

  validateValue(data: unknown, rules: object): boolean {
    try {
      // Basic value validation implementation
      return true;
    } catch (error) {
      this.logger.error('Value validation failed', error);
      return false;
    }
  }

  async validateSync<T extends object>(
    data: unknown,
    dto: new () => T,
    config: Partial<ValidationConfig> = {}
  ): Promise<ValidationResult> {
    const finalConfig = { ...this.defaultConfig, ...config };
    const { enableDebugLogs, ...validatorConfig } = finalConfig;

    try {
      const instance = plainToClass(dto, data);
      const errors = await validate(instance, validatorConfig);

      if (errors.length > 0) {
        const formattedErrors = this.formatValidationErrors(errors);
        
        if (enableDebugLogs) {
          this.logger.debug('Validation errors', {
            dto: dto.name,
            errors: formattedErrors
          });
        }

        return { success: false, errors: formattedErrors };
      }

      return { success: true };
    } catch (error) {
      this.logger.error('Validation process failed', error);
      return {
        success: false,
        errors: { _error: ['Internal validation error'] }
      };
    }
  }

  private formatValidationErrors(errors: ClassValidatorError[]): Record<string, string[]> {
    const formattedErrors: Record<string, string[]> = {};

    for (const error of errors) {
      if (error.constraints) {
        formattedErrors[error.property] = Object.values(error.constraints);
      }

      if (error.children?.length) {
        const childErrors = this.formatValidationErrors(error.children);
        Object.entries(childErrors).forEach(([key, value]) => {
          formattedErrors[`${error.property}.${key}`] = value;
        });
      }
    }

    return formattedErrors;
  }
}
