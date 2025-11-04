import { Injectable } from '@nestjs/common';
import { InputSanitizationService } from './input-sanitization.service';

export interface ResponseSanitizationOptions {
  excludeFields?: string[]; // Fields to exclude from response
  maskFields?: string[]; // Fields to mask in response
  maskChar?: string; // Character to use for masking
  maxDepth?: number; // Maximum object depth to traverse
  sensitiveDataPatterns?: RegExp[]; // Custom patterns to identify sensitive data
}

@Injectable()
export class ResponseSanitizationService {
  private defaultSensitivePatterns = [
    /password/i,
    /passwd/i,
    /secret/i,
    /key/i,
    /token/i,
    /auth/i,
    /credential/i,
    /private/i,
    /ssn/i,
    /social.*security/i,
    /credit.*card/i,
    /cvv/i,
    /pin/i,
    /api.*key/i,
    /access.*token/i,
    /refresh.*token/i,
  ];

  constructor(private sanitizationService: InputSanitizationService) {}

  /**
   * Sanitize response object to remove sensitive information
   */
  sanitizeResponse<T>(data: T, options: ResponseSanitizationOptions = {}): T {
    const sanitizedOptions = {
      excludeFields: [],
      maskFields: ['password', 'secret', 'token', 'key'],
      maskChar: '*',
      maxDepth: 10,
      sensitiveDataPatterns: this.defaultSensitivePatterns,
      ...options
    };

    return this.sanitizeObject(data, sanitizedOptions, 0) as T;
  }

  /**
   * Sanitize database query results
   */
  sanitizeDatabaseResult<T>(data: T, options: ResponseSanitizationOptions = {}): T {
    const dbOptions: ResponseSanitizationOptions = {
      excludeFields: ['password_hash', 'salt', 'created_at', 'updated_at'],
      maskFields: ['email', 'phone', 'address'],
      maxDepth: 5,
      ...options
    };

    return this.sanitizeResponse(data, dbOptions);
  }

  /**
   * Sanitize user profile data
   */
  sanitizeUserProfile<T>(data: T, isOwner: boolean = false): T {
    const userOptions: ResponseSanitizationOptions = {
      excludeFields: isOwner ? [] : ['phone', 'address', 'date_of_birth', 'ssn'],
      maskFields: isOwner ? ['email'] : ['email', 'first_name', 'last_name'],
      maskChar: '*',
      maxDepth: 3
    };

    return this.sanitizeResponse(data, userOptions);
  }

  /**
   * Sanitize API error responses
   */
  sanitizeError(error: any): any {
    const sanitized = {
      message: this.sanitizeErrorMessage(error.message),
      statusCode: error.statusCode || 500,
      timestamp: new Date().toISOString(),
      path: error.path || '',
    };

    // Only include stack trace in development
    if (process.env.NODE_ENV === 'development' && error.stack) {
      sanitized['stack'] = this.sanitizeStackTrace(error.stack);
    }

    return sanitized;
  }

  /**
   * Sanitize logs to prevent sensitive data leakage
   */
  sanitizeLogData(data: any): any {
    const logOptions: ResponseSanitizationOptions = {
      excludeFields: ['password', 'token', 'secret', 'key'],
      maskFields: ['email', 'user_id', 'session_id', 'ip_address'],
      maxDepth: 5
    };

    return this.sanitizeResponse(data, logOptions);
  }

  private sanitizeObject(obj: any, options: ResponseSanitizationOptions, depth: number): any {
    if (obj === null || obj === undefined) {
      return obj;
    }

    if (depth > (options.maxDepth || 10)) {
      return '[Max Depth Exceeded]';
    }

    if (typeof obj === 'string') {
      return this.sanitizeString(obj, options);
    }

    if (typeof obj === 'number' || typeof obj === 'boolean' || typeof obj === 'bigint') {
      return obj;
    }

    if (Array.isArray(obj)) {
      return obj.map(item => this.sanitizeObject(item, options, depth + 1));
    }

    if (typeof obj === 'object') {
      const sanitized: any = {};
      
      for (const [key, value] of Object.entries(obj)) {
        const sanitizedKey = this.sanitizeString(key, options);
        
        if (!sanitizedKey) {
          continue; // Skip invalid keys
        }

        // Check if field should be excluded
        if (options.excludeFields?.some(field => this.matchesPattern(field, sanitizedKey))) {
          continue;
        }

        // Check if field should be masked
        if (options.maskFields?.some(field => this.matchesPattern(field, sanitizedKey))) {
          sanitized[sanitizedKey] = this.maskValue(value, options.maskChar || '*');
          continue;
        }

        // Check if field matches sensitive data patterns
        if (this.isSensitiveField(sanitizedKey, options.sensitiveDataPatterns || [])) {
          sanitized[sanitizedKey] = this.maskValue(value, options.maskChar || '*');
          continue;
        }

        // Recursively sanitize the value
        sanitized[sanitizedKey] = this.sanitizeObject(value, options, depth + 1);
      }
      
      return sanitized;
    }

    return obj;
  }

  private sanitizeString(str: string, options: ResponseSanitizationOptions): string {
    if (typeof str !== 'string') {
      return str;
    }

    // Remove control characters and limit length
    return str
      .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '')
      .substring(0, 10000);
  }

  private maskValue(value: any, maskChar: string): string {
    if (value === null || value === undefined) {
      return '';
    }

    const str = String(value);
    if (str.length <= 4) {
      return maskChar.repeat(str.length);
    }

    return str.substring(0, 2) + maskChar.repeat(str.length - 4) + str.substring(str.length - 2);
  }

  private matchesPattern(pattern: string, value: string): boolean {
    // Exact match
    if (pattern === value) {
      return true;
    }

    // Regex match
    if (pattern.startsWith('/') && pattern.endsWith('/')) {
      const regex = new RegExp(pattern.slice(1, -1), 'i');
      return regex.test(value);
    }

    // Case-insensitive partial match
    return value.toLowerCase().includes(pattern.toLowerCase());
  }

  private isSensitiveField(fieldName: string, patterns: RegExp[]): boolean {
    return patterns.some(pattern => pattern.test(fieldName));
  }

  private sanitizeErrorMessage(message: string): string {
    if (!message || typeof message !== 'string') {
      return 'An error occurred';
    }

    // Remove potential stack traces and internal details
    return message
      .replace(/at\s+[^\n]+\n/g, '') // Remove stack trace lines
      .replace(/File\s+"[^"]+",\s+line\s+\d+/g, '') // Remove file references
      .replace(/\binternal[/\\][^/\n]+/g, '[internal]') // Mask internal paths
      .substring(0, 500); // Limit error message length
  }

  private sanitizeStackTrace(stackTrace: string): string {
    if (!stackTrace || typeof stackTrace !== 'string') {
      return '';
    }

    return stackTrace
      .split('\n')
      .filter(line => !line.includes('node_modules')) // Remove external stack traces
      .map(line => {
        // Mask file paths
        return line.replace(/File\s+"([^"]+)"/g, 'File "[masked]"');
      })
      .join('\n')
      .substring(0, 2000); // Limit stack trace length
  }

  /**
   * Create a sanitized version of an object for logging
   */
  createLogSafeObject(obj: any): any {
    return this.sanitizeLogData(obj);
  }

  /**
   * Remove PII (Personally Identifiable Information) from data
   */
  removePII(data: any): any {
    const piiFields = [
      'ssn', 'social_security_number', 'socialSecurityNumber',
      'credit_card', 'creditCard', 'cvv', 'pin',
      'date_of_birth', 'dateOfBirth', 'dob',
      'passport', 'driver_license', 'driverLicense',
      'bank_account', 'bankAccount', 'routing_number', 'routingNumber'
    ];

    const options: ResponseSanitizationOptions = {
      excludeFields: piiFields,
      maxDepth: 5
    };

    return this.sanitizeResponse(data, options);
  }
}