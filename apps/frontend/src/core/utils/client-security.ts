/**
 * Frontend Input Sanitization and Security Utilities
 * Provides comprehensive client-side security measures
 */

export interface SanitizationOptions {
  maxLength?: number;
  allowedChars?: string;
  stripHtml?: boolean;
  escapeHtml?: boolean;
  validateEmail?: boolean;
  validatePhone?: boolean;
  validateUrl?: boolean;
  trimWhitespace?: boolean;
}

export class ClientSecurityUtils {
  /**
   * Sanitize HTML content to prevent XSS
   */
  static sanitizeHTML(html: string): string {
    if (!html || typeof html !== 'string') {
      return '';
    }

    // Create a div element to safely parse HTML
    const div = document.createElement('div');
    div.textContent = html;
    return div.innerHTML;
  }

  /**
   * Sanitize text input
   */
  static sanitizeText(input: string, options: SanitizationOptions = {}): string {
    if (!input || typeof input !== 'string') {
      return '';
    }

    let sanitized = input;

    // Remove control characters
    sanitized = sanitized.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '');

    // Strip or escape HTML
    if (options.stripHtml) {
      sanitized = sanitized.replace(/<[^>]*>/g, '');
    } else if (options.escapeHtml) {
      sanitized = this.escapeHtml(sanitized);
    }

    // Apply character restrictions
    if (options.allowedChars) {
      const regex = new RegExp(`[^${options.allowedChars}]`, 'g');
      sanitized = sanitized.replace(regex, '');
    }

    // Apply length limit
    if (options.maxLength && sanitized.length > options.maxLength) {
      sanitized = sanitized.substring(0, options.maxLength);
    }

    // Trim whitespace
    if (options.trimWhitespace !== false) {
      sanitized = sanitized.trim();
    }

    return sanitized;
  }

  /**
   * Sanitize input for database use
   */
  static sanitizeForDatabase(input: string): string {
    if (!input || typeof input !== 'string') {
      return '';
    }

    return input
      .replace(/'/g, "''") // Escape single quotes
      .replace(/"/g, '""') // Escape double quotes
      .replace(/\\/g, '\\\\') // Escape backslashes
      .replace(/\x00/g, '') // Remove null bytes
      .replace(/[\x0D\x0A]/g, '') // Remove CR/LF
      .trim()
      .substring(0, 10000);
  }

  /**
   * Sanitize file names
   */
  static sanitizeFileName(fileName: string): string {
    if (!fileName || typeof fileName !== 'string') {
      return 'unnamed_file';
    }

    return (
      fileName
        .replace(/[\/\\?%*:|"<>]/g, '_') // Replace dangerous characters
        .replace(/\.\./g, '_') // Remove path traversal
        .replace(/^\.*/, '') // Remove leading dots
        .substring(0, 255) // Limit length
        .trim() || 'unnamed_file'
    );
  }

  /**
   * Sanitize URLs
   */
  static sanitizeUrl(url: string): string {
    if (!url || typeof url !== 'string') {
      return '';
    }

    try {
      const parsed = new URL(url);

      // Only allow certain protocols
      const allowedProtocols = ['http:', 'https:', 'mailto:', 'tel:'];
      if (!allowedProtocols.includes(parsed.protocol)) {
        return '';
      }

      // Remove dangerous characters
      return parsed
        .toString()
        .replace(/[<>"']/g, '')
        .substring(0, 2048);
    } catch {
      return '';
    }
  }

  /**
   * Sanitize email addresses
   */
  static sanitizeEmail(email: string): string {
    if (!email || typeof email !== 'string') {
      return '';
    }

    return email
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9@._+-]/g, '') // Only allow valid email characters
      .substring(0, 254); // Email length limit
  }

  /**
   * Sanitize phone numbers
   */
  static sanitizePhoneNumber(phone: string): string {
    if (!phone || typeof phone !== 'string') {
      return '';
    }

    return phone
      .replace(/[^\d+\-().\s]/g, '') // Only allow digits and phone symbols
      .replace(/\s+/g, ' ') // Normalize spaces
      .trim()
      .substring(0, 20);
  }

  /**
   * Validate and sanitize JSON
   */
  static sanitizeJSON(input: string): any {
    if (!input || typeof input !== 'string') {
      return null;
    }

    try {
      const parsed = JSON.parse(input);
      return this.sanitizeObject(parsed);
    } catch {
      return null;
    }
  }

  /**
   * Recursively sanitize object properties
   */
  static sanitizeObject(obj: any): any {
    if (obj === null || obj === undefined) {
      return obj;
    }

    if (typeof obj === 'string') {
      return this.sanitizeText(obj);
    }

    if (Array.isArray(obj)) {
      return obj.map((item) => this.sanitizeObject(item));
    }

    if (typeof obj === 'object') {
      const sanitized: any = {};
      for (const [key, value] of Object.entries(obj)) {
        const sanitizedKey = this.sanitizeText(key, { maxLength: 100 });
        if (sanitizedKey) {
          sanitized[sanitizedKey] = this.sanitizeObject(value);
        }
      }
      return sanitized;
    }

    return obj;
  }

  /**
   * Escape HTML characters
   */
  private static escapeHtml(text: string): string {
    const map: { [key: string]: string } = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#39;',
      '/': '&#x2F;',
    };
    return text.replace(/[&<>"'/]/g, (m) => map[m]);
  }

  /**
   * Generate CSRF token
   */
  static generateCSRFToken(): string {
    const array = new Uint8Array(32);
    crypto.getRandomValues(array);
    return Array.from(array, (byte) => byte.toString(16).padStart(2, '0')).join('');
  }

  /**
   * Validate CSRF token
   */
  static validateCSRFToken(token: string): boolean {
    return typeof token === 'string' && token.length >= 32 && /^[a-f0-9]+$/i.test(token);
  }

  /**
   * Create secure form data
   */
  static createSecureFormData(data: Record<string, any>): FormData {
    const formData = new FormData();

    for (const [key, value] of Object.entries(data)) {
      const sanitizedKey = this.sanitizeText(key, { maxLength: 100 });
      if (sanitizedKey && value !== undefined && value !== null) {
        if (value instanceof File) {
          formData.append(sanitizedKey, value);
        } else {
          formData.append(sanitizedKey, this.sanitizeText(String(value)));
        }
      }
    }

    return formData;
  }

  /**
   * Sanitize query parameters
   */
  static sanitizeQueryParams(params: Record<string, string>): Record<string, string> {
    const sanitized: Record<string, string> = {};

    for (const [key, value] of Object.entries(params)) {
      const sanitizedKey = this.sanitizeText(key, { maxLength: 100 });
      const sanitizedValue = this.sanitizeText(value, { maxLength: 1000 });

      if (sanitizedKey && sanitizedValue) {
        sanitized[sanitizedKey] = sanitizedValue;
      }
    }

    return sanitized;
  }

  /**
   * Secure local storage
   */
  static setSecureItem(key: string, value: any): void {
    try {
      const sanitizedKey = this.sanitizeText(key, { maxLength: 100 });
      const serialized = JSON.stringify(value);
      const encoded = btoa(encoded); // Basic encoding (use encryption in production)
      localStorage.setItem(sanitizedKey, encoded);
    } catch (error) {
      console.warn('Failed to store item securely:', error);
    }
  }

  static getSecureItem<T>(key: string): T | null {
    try {
      const sanitizedKey = this.sanitizeText(key, { maxLength: 100 });
      const encoded = localStorage.getItem(sanitizedKey);
      if (!encoded) return null;

      const decoded = atob(encoded);
      return JSON.parse(decoded);
    } catch (error) {
      console.warn('Failed to retrieve item securely:', error);
      return null;
    }
  }

  static removeSecureItem(key: string): void {
    const sanitizedKey = this.sanitizeText(key, { maxLength: 100 });
    localStorage.removeItem(sanitizedKey);
  }

  /**
   * Content Security Policy utilities
   */
  static applyCSP(): void {
    const meta = document.createElement('meta');
    meta.httpEquiv = 'Content-Security-Policy';
    meta.content = [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
      "style-src 'self' 'unsafe-inline'",
      "img-src 'self' data: https:",
      "font-src 'self'",
      "connect-src 'self' wss: https:",
      "frame-src 'none'",
      "object-src 'none'",
      "base-uri 'self'",
      "form-action 'self'",
    ].join('; ');
    document.head.appendChild(meta);
  }

  /**
   * Secure random string generation
   */
  static generateSecureRandom(length: number = 32): string {
    const array = new Uint8Array(length);
    crypto.getRandomValues(array);
    return Array.from(
      array,
      (byte) => 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'[byte % 62]
    ).join('');
  }

  /**
   * Password strength validation
   */
  static validatePasswordStrength(password: string): {
    isValid: boolean;
    score: number;
    feedback: string[];
  } {
    const feedback: string[] = [];
    let score = 0;

    // Length check
    if (password.length < 8) {
      feedback.push('Password must be at least 8 characters long');
    } else if (password.length >= 12) {
      score += 2;
    } else {
      score += 1;
    }

    // Character variety checks
    if (/[a-z]/.test(password)) score += 1;
    else feedback.push('Add lowercase letters');

    if (/[A-Z]/.test(password)) score += 1;
    else feedback.push('Add uppercase letters');

    if (/\d/.test(password)) score += 1;
    else feedback.push('Add numbers');

    if (/[!@#$%^&*(),.?":{}|<>]/.test(password)) score += 1;
    else feedback.push('Add special characters');

    // Common password check
    const commonPasswords = [
      'password',
      '123456',
      'qwerty',
      'admin',
      'letmein',
      'welcome',
      'monkey',
      'dragon',
      'master',
      'shadow',
    ];

    if (commonPasswords.includes(password.toLowerCase())) {
      feedback.push('Avoid common passwords');
      score = 0;
    }

    // Repetition check
    if (/(.)\1{2,}/.test(password)) {
      feedback.push('Avoid repeated characters');
      score = Math.max(0, score - 1);
    }

    return {
      isValid: score >= 4 && feedback.length === 0,
      score: Math.min(score, 5),
      feedback,
    };
  }
}

// React hook for secure input handling
export function useSecureInput(initialValue: string = '', options: SanitizationOptions = {}) {
  const [value, setValue] = React.useState<string>(initialValue);

  const handleChange = (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const sanitized = ClientSecurityUtils.sanitizeText(event.target.value, options);
    setValue(sanitized);
  };

  return {
    value,
    setValue,
    handleChange,
    reset: () => setValue(initialValue),
  };
}

// Secure component wrapper
export function withInputSanitization<P extends object>(
  Component: React.ComponentType<P>
): React.ComponentType<P> {
  return function SanitizedComponent(props: P) {
    // Apply CSP
    React.useEffect(() => {
      ClientSecurityUtils.applyCSP();
    }, []);

    return React.createElement(Component, props);
  };
}
