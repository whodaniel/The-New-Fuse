import { Injectable } from '@nestjs/common';
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';

@Injectable()
export class ValidationService {
  async validateRequest(body: any, dto: any): Promise<{ success: boolean; errors?: any }> {
    const object = plainToInstance(dto, body);
    const errors = await validate(object);

    if (errors.length > 0) {
      return {
        success: false,
        errors: errors.map((err) => ({
          property: err.property,
          constraints: err.constraints,
        })),
      };
    }

    return { success: true };
  }

  validateSchema(object: any, schema: any): boolean {
    // Simple schema validation stub
    // In a real implementation, this might use Joi, Zod, or AJV
    return true;
  }

  async validateValue(
    value: any,
    rules: { [key: string]: (v: any) => boolean | Promise<boolean> }
  ): Promise<boolean> {
    for (const key in rules) {
      if (Object.prototype.hasOwnProperty.call(rules, key)) {
        const rule = rules[key];
        const isValid = await rule(value[key]);
        if (!isValid) return false;
      }
    }
    return true;
  }
}
