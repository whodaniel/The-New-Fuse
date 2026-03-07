export interface ValidationRule<T> {
  validate(value: T): boolean;
  message: string;
  code: string;
}

export interface ValidationResult {
  isValid: boolean;
  errors: Array<{
    field: string;
    code: string;
    message: string;
  }>;
}

export interface Validator<T> {
  validate(data: T): ValidationResult;
  addRule(field: keyof T, rule: ValidationRule<T[keyof T]>): void;
  removeRule(field: keyof T, code: string): void;
}
