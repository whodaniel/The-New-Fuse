/**
 * Unified Validation Utilities
 * Consolidates all validation logic across the monorepo
 */

export interface ValidationResult {
  isValid: boolean;
  error?: string;
}

/**
 * Centralized validator class with common validation patterns
 */
export class Validators {
  private static readonly EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  private static readonly UUID_REGEX =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  private static readonly URL_REGEX = /^https?:\/\/.+/;

  /**
   * Validate email address format
   */
  static email(value: string): ValidationResult {
    const isValid = this.EMAIL_REGEX.test(value);
    return {
      isValid,
      error: isValid ? undefined : 'Invalid email address',
    };
  }

  /**
   * Validate URL format
   */
  static url(value: string): ValidationResult {
    try {
      new URL(value);
      return { isValid: true };
    } catch {
      return { isValid: false, error: 'Invalid URL' };
    }
  }

  /**
   * Validate required field
   */
  static required(value: any): ValidationResult {
    const isValid = value !== undefined && value !== null && value !== '';
    return {
      isValid,
      error: isValid ? undefined : 'This field is required',
    };
  }

  /**
   * Validate minimum length
   */
  static minLength(value: string, min: number): ValidationResult {
    const isValid = value.length >= min;
    return {
      isValid,
      error: isValid ? undefined : `Minimum length is ${min} characters`,
    };
  }

  /**
   * Validate maximum length
   */
  static maxLength(value: string, max: number): ValidationResult {
    const isValid = value.length <= max;
    return {
      isValid,
      error: isValid ? undefined : `Maximum length is ${max} characters`,
    };
  }

  /**
   * Validate UUID format
   */
  static uuid(value: string): ValidationResult {
    const isValid = this.UUID_REGEX.test(value);
    return {
      isValid,
      error: isValid ? undefined : 'Invalid UUID format',
    };
  }

  /**
   * Validate numeric value
   */
  static numeric(value: string | number): ValidationResult {
    const num = typeof value === 'string' ? parseFloat(value) : value;
    const isValid = !isNaN(num) && isFinite(num);
    return {
      isValid,
      error: isValid ? undefined : 'Must be a valid number',
    };
  }

  /**
   * Validate integer value
   */
  static integer(value: string | number): ValidationResult {
    const num = typeof value === 'string' ? Number(value) : value;
    const isValid = Number.isInteger(num);
    return {
      isValid,
      error: isValid ? undefined : 'Must be an integer',
    };
  }

  /**
   * Validate minimum value
   */
  static min(value: number, min: number): ValidationResult {
    const isValid = value >= min;
    return {
      isValid,
      error: isValid ? undefined : `Minimum value is ${min}`,
    };
  }

  /**
   * Validate maximum value
   */
  static max(value: number, max: number): ValidationResult {
    const isValid = value <= max;
    return {
      isValid,
      error: isValid ? undefined : `Maximum value is ${max}`,
    };
  }

  /**
   * Validate pattern match
   */
  static pattern(value: string, pattern: RegExp, errorMessage?: string): ValidationResult {
    const isValid = pattern.test(value);
    return {
      isValid,
      error: isValid ? undefined : errorMessage || 'Invalid format',
    };
  }

  /**
   * Validate phone number
   */
  static phone(value: string): ValidationResult {
    const phoneRegex = /^\+?[\d\s\-\(\)]+$/;
    const isValid = phoneRegex.test(value) && value.replace(/\D/g, '').length >= 10;
    return {
      isValid,
      error: isValid ? undefined : 'Invalid phone number',
    };
  }

  /**
   * Validate JSON string
   */
  static json(value: string): ValidationResult {
    try {
      JSON.parse(value);
      return { isValid: true };
    } catch {
      return { isValid: false, error: 'Invalid JSON' };
    }
  }
}

// Convenience functions for backward compatibility
export const isValidEmail = (email: string): boolean => Validators.email(email).isValid;
export const isValidUrl = (url: string): boolean => Validators.url(url).isValid;
export const isValidUuid = (uuid: string): boolean => Validators.uuid(uuid).isValid;
export const isValidPhone = (phone: string): boolean => Validators.phone(phone).isValid;
export const isValidJson = (json: string): boolean => Validators.json(json).isValid;

// Legacy function names for compatibility
export const validateEmail = isValidEmail;
