import { validate } from 'class-validator';
import { plainToClass } from 'class-transformer';
import { Type } from '@nestjs/common';

export class SchemaValidator {
  /**
   * Validates a request/response object against its TypeScript interface
   * @param schema The class/interface to validate against
   * @param data The data to validate
   */
  static async validateSchema<T extends object>(schema: Type<T>, data: any): Promise<{ isValid: boolean; errors: string[] }> {
    try {
      // Convert plain object to class instance
      const instance = plainToClass(schema, data);
      
      // Validate the instance
      const errors = await validate(instance);
      
      if (errors.length > 0) {
        return {
          isValid: false,
          errors: errors.map(error => 
            Object.values(error.constraints || {}).join(', ')
          )
        };
      }

      return { isValid: true, errors: [] };
    } catch (error) {
      return {
        isValid: false,
        errors: [(error as Error).message]
      };
    }
  }

  /**
   * Validates nested objects and arrays recursively
   * @param schema The schema to validate against
   * @param data The data to validate
   */
  static async validateNested<T extends object>(schema: Type<T>, data: any): Promise<{ isValid: boolean; errors: string[] }> {
    const errors: string[] = [];
    
    if (Array.isArray(data)) {
      for (const item of data) {
        const result = await this.validateSchema(schema, item);
        errors.push(...result.errors);
      }
    } else if (typeof data === 'object') {
      const result = await this.validateSchema(schema, data);
      errors.push(...result.errors);
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }
}