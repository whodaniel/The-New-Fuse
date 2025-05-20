export type ValidationRule = (value: any) => boolean | string;

export interface ValidationOptions {
  required?: boolean;
  minLength?: number;
  maxLength?: number;
  pattern?: RegExp;
  email?: boolean;
  url?: boolean;
  min?: number;
  max?: number;
  custom?: ValidationRule;
}

export function validateRequired(value: any): boolean | string {
  return value !== undefined && value !== null && value !== '' 
    ? true 
    : 'This field is required';
}

export function validateEmail(email: string): boolean | string {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email) ? true : 'Invalid email address';
}

export function validateUrl(url: string): boolean | string {
  try {
    new URL(url);
    return true;
  } catch {
    return 'Invalid URL';
  }
}

export function validateMinLength(value: string, min: number): boolean | string {
  return value.length >= min ? true : `Minimum length is ${min} characters`;
}

export function validateMaxLength(value: string, max: number): boolean | string {
  return value.length <= max ? true : `Maximum length is ${max} characters`;
}

export function validatePattern(value: string, pattern: RegExp): boolean | string {
  return pattern.test(value) ? true : 'Invalid format';
}

export function validateMin(value: number, min: number): boolean | string {
  return value >= min ? true : `Minimum value is ${min}`;
}

export function validateMax(value: number, max: number): boolean | string {
  return value <= max ? true : `Maximum value is ${max}`;
}

export function validate(value: any, options: ValidationOptions): string[] {
  const errors: string[] = [];

  if (options.required && !validateRequired(value)) {
    errors.push('This field is required');
  }

  if (value) {
    if (options.email && typeof value === 'string') {
      const result = validateEmail(value);
      if (typeof result === 'string') errors.push(result);
    }

    if (options.url && typeof value === 'string') {
      const result = validateUrl(value);
      if (typeof result === 'string') errors.push(result);
    }

    if (options.minLength !== undefined && typeof value === 'string') {
      const result = validateMinLength(value, options.minLength);
      if (typeof result === 'string') errors.push(result);
    }

    if (options.maxLength !== undefined && typeof value === 'string') {
      const result = validateMaxLength(value, options.maxLength);
      if (typeof result === 'string') errors.push(result);
    }

    if (options.pattern && typeof value === 'string') {
      const result = validatePattern(value, options.pattern);
      if (typeof result === 'string') errors.push(result);
    }

    if (options.min !== undefined && typeof value === 'number') {
      const result = validateMin(value, options.min);
      if (typeof result === 'string') errors.push(result);
    }

    if (options.max !== undefined && typeof value === 'number') {
      const result = validateMax(value, options.max);
      if (typeof result === 'string') errors.push(result);
    }

    if (options.custom) {
      const result = options.custom(value);
      if (typeof result === 'string') errors.push(result);
    }
  }

  return errors;
}

export function validateForm(values: Record<string, any>, rules: Record<string, ValidationOptions>): Record<string, string[]> {
  const errors: Record<string, string[]> = {};

  Object.entries(rules).forEach(([field, options]) => {
    const fieldErrors = validate(values[field], options);
    if (fieldErrors.length > 0) {
      errors[field] = fieldErrors;
    }
  });

  return errors;
}

export function hasErrors(errors: Record<string, string[]>): boolean {
  return Object.keys(errors).length > 0;
}

export function getFirstError(fieldErrors: string[]): string {
  return fieldErrors[0] || '';
}

export interface ValidationRule<T> {
  validate: (value: T) => boolean;
  message: string;
}

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
}

export function validate<T>(
  value: T,
  rules: ValidationRule<T>[]
): ValidationResult {
  const errors = rules
    .filter(rul(e: any) => !rule.validate(value))
    .map(rul(e: any) => rule.message);

  return {
    isValid: errors.length === 0,
    errors
  };
}

// Common validation rules
export const required = (message = 'This field is required'): ValidationRule<any> => ({
  validate: (value: any) => {
    if (value === null || value === undefined) return false;
    if (typeof value === 'string') return value.trim().length > 0;
    if (Array.isArray(value)) return value.length > 0;
    return true;
  },
  message
});

export const minLength = (min: number, message?: string): ValidationRule<string> => ({
  validate: (value: string) => value.length >= min,
  message: message || `Must be at least ${min} characters`
});

export const maxLength = (max: number, message?: string): ValidationRule<string> => ({
  validate: (value: string) => value.length <= max,
  message: message || `Must be no more than ${max} characters`
});

export const email = (message = 'Must be a valid email address'): ValidationRule<string> => ({
  validate: (value: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(value);
  },
  message
});

export const url = (message = 'Must be a valid URL'): ValidationRule<string> => ({
  validate: (value: string) => {
    try {
      new URL(value);
      return true;
    } catch {
      return false;
    }
  },
  message
});

export const numeric = (message = 'Must be a number'): ValidationRule<string> => ({
  validate: (value: string) => !isNaN(Number(value)),
  message
});

export const integer = (message = 'Must be an integer'): ValidationRule<string | number> => ({
  validate: (value: string | number) => {
    const num = typeof value === 'string' ? Number(value) : value;
    return Number.isInteger(num);
  },
  message
});

export const min = (min: number, message?: string): ValidationRule<number> => ({
  validate: (value: number) => value >= min,
  message: message || `Must be at least ${min}`
});

export const max = (max: number, message?: string): ValidationRule<number> => ({
  validate: (value: number) => value <= max,
  message: message || `Must be no more than ${max}`
});

export const pattern = (regex: RegExp, message: string): ValidationRule<string> => ({
  validate: (value: string) => regex.test(value),
  message
});

export const matchValue = (matchTo: any, message?: string): ValidationRule<any> => ({
  validate: (value: any) => value === matchTo,
  message: message || 'Values must match'
});

// Form validation
export interface FormValidationRule<T> {
  field: keyof T;
  rules: ValidationRule<any>[];
}

export interface FormValidationResult<T> {
  isValid: boolean;
  errors: Partial<Record<keyof T, string[]>>;
}

export function validateForm<T extends Record<string, any>>(
  values: T,
  validationRules: FormValidationRule<T>[]
): FormValidationResult<T> {
  const errors: Partial<Record<keyof T, string[]>> = {};
  let isValid = true;

  validationRules.forEach(({ field, rules }) => {
    const result = validate(values[field], rules);
    if (!result.isValid) {
      errors[field] = result.errors;
      isValid = false;
    }
  });

  return { isValid, errors };
}

// Async validation
export interface AsyncValidationRule<T> {
  validate: (value: T) => Promise<boolean>;
  message: string;
}

export async function validateAsync<T>(
  value: T,
  rules: AsyncValidationRule<T>[]
): Promise<ValidationResult> {
  const results = await Promise.all(
    rules.map(async rul(e: any) => ({
      isValid: await rule.validate(value),
      message: rule.message
    }))
  );

  const errors = results
    .filter(result => !result.isValid)
    .map(result => result.message);

  return {
    isValid: errors.length === 0,
    errors
  };
}