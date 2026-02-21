// filepath: src/utils/validation/validator.ts
export type ValidationRule<T> = (value: T) => boolean | string;

export interface ValidationResult {
  valid: boolean;
  errors: Record<string, string>;
}

export class Validator<T extends Record<string, any>> {
  private rules: Record<keyof T, ValidationRule<any>[]> = {} as Record<
    keyof T,
    ValidationRule<any>[]
  >;

  addRule<K extends keyof T>(field: K, rule: ValidationRule<T[K]>): this {
    if (!this.rules[field]) {
      this.rules[field] = [];
    }
    this.rules[field].push(rule);
    return this;
  }

  validate(data: T): ValidationResult {
    const result: ValidationResult = {
      valid: true,
      errors: {},
    };

    for (const field in this.rules) {
      const value = data[field];
      const rules = this.rules[field];

      for (const rule of rules) {
        const ruleResult = rule(value);
        if (typeof ruleResult === "string") {
          result.valid = false;
          result.errors[field] = ruleResult;
          break;
        } else if (ruleResult === false) {
          result.valid = false;
          result.errors[field] = `Validation failed for ${String(field)}`;
          break;
        }
      }
    }

    return result;
  }
}

export default Validator;
