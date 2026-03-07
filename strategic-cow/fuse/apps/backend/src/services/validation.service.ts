/**
 * Validation Service
 *
 * Provides validation utilities for request data
 */

import { Injectable } from '@nestjs/common';
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';

export interface ValidationResult {
  success: boolean;
  errors?: string[];
}

@Injectable()
export class ValidationService {
  /**
   * Validate request body against a DTO class
   */
  async validateRequest(body: any, dtoClass: new () => any): Promise<ValidationResult> {
    const dto = plainToInstance(dtoClass, body);
    const errors = await validate(dto);

    if (errors.length > 0) {
      return {
        success: false,
        errors: errors.map((e) => Object.values(e.constraints || {}).join(', ')),
      };
    }

    return { success: true };
  }

  /**
   * Validate data against a JSON schema
   */
  validateSchema(data: any, schema: object): boolean {
    // Basic schema validation
    // In production, use a proper JSON schema validator like ajv
    try {
      if (!data || typeof data !== 'object') {
        return false;
      }

      const schemaObj = schema as any;
      if (schemaObj.required && Array.isArray(schemaObj.required)) {
        for (const field of schemaObj.required) {
          if (!(field in data)) {
            return false;
          }
        }
      }

      return true;
    } catch {
      return false;
    }
  }

  /**
   * Validate data against custom rules
   */
  validateValue(
    data: any,
    rules: { [key: string]: (value: any) => boolean | Promise<boolean> }
  ): boolean {
    for (const [key, validator] of Object.entries(rules)) {
      const value = data[key];
      if (!validator(value)) {
        return false;
      }
    }
    return true;
  }
}
