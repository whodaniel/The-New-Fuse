import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import createDOMPurify from 'dompurify';
import { JSDOM } from 'jsdom';

@Injectable()
export class InputSanitizationService {
  private window: any;
  private domPurify: any;

  constructor(private configService: ConfigService) {
    // Initialize DOMPurify for server-side HTML sanitization
    this.window = new JSDOM('').window;
    this.domPurify = createDOMPurify(this.window);
  }

  /**
   * Sanitize HTML content to prevent XSS attacks
   */
  sanitizeHTML(html: string): string {
    if (!html || typeof html !== 'string') {
      return '';
    }

    return this.domPurify.sanitize(html, {
      ALLOWED_TAGS: [
        'p', 'br', 'strong', 'em', 'u', 'i', 'b', 'a', 'ul', 'ol', 'li',
        'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'blockquote', 'code', 'pre',
        'div', 'span', 'img', 'table', 'thead', 'tbody', 'tr', 'th', 'td'
      ],
      ALLOWED_ATTR: ['href', 'src', 'alt', 'title', 'class', 'id'],
      ALLOWED_URI_REGEXP: /^(?:(?:https?|mailto|tel|callto):|[^a-z]|[a-z+.-]+(?:[^a-z+.-]|$))/i,
      KEEP_CONTENT: false,
      FORBID_TAGS: ['script', 'style', 'iframe', 'object', 'embed', 'form', 'input', 'button'],
      FORBID_ATTR: ['onload', 'onclick', 'onerror', 'onmouseover', 'onfocus', 'onblur', 'onchange', 'onsubmit']
    });
  }

  /**
   * Sanitize plain text input
   */
  sanitizeText(input: string): string {
    if (!input || typeof input !== 'string') {
      return '';
    }

    // Remove null bytes, control characters, and potential XSS
    return input
      .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '') // Remove control characters
      .replace(/<script[^>]*>.*?<\/script>/gi, '') // Remove script tags
      .replace(/<[^>]*>/g, '') // Remove all HTML tags
      .trim()
      .substring(0, 10000); // Limit length
  }

  /**
   * Sanitize for database insertion (SQL injection prevention)
   */
  sanitizeForDatabase(input: string): string {
    if (!input || typeof input !== 'string') {
      return '';
    }

    // Escape special characters for SQL
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
  sanitizeFileName(fileName: string): string {
    if (!fileName || typeof fileName !== 'string') {
      return 'unnamed_file';
    }

    // Remove or replace dangerous characters
    return fileName
      .replace(/[\/\\?%*:|"<>]/g, '_') // Replace dangerous characters
      .replace(/\.\./g, '_') // Remove path traversal
      .replace(/^\.*/, '') // Remove leading dots
      .substring(0, 255) // Limit length
      .trim() || 'unnamed_file';
  }

  /**
   * Sanitize URLs
   */
  sanitizeUrl(url: string): string {
    if (!url || typeof url !== 'string') {
      return '';
    }

    try {
      const parsed = new URL(url);
      
      // Only allow certain protocols
      const allowedProtocols = ['http:', 'https:', 'mailto:', 'tel:', 'callto:'];
      if (!allowedProtocols.includes(parsed.protocol)) {
        return '';
      }

      // Remove dangerous characters from the URL
      return parsed.toString()
        .replace(/[<>"']/g, '')
        .substring(0, 2048);
    } catch {
      return '';
    }
  }

  /**
   * Sanitize email addresses
   */
  sanitizeEmail(email: string): string {
    if (!email || typeof email !== 'string') {
      return '';
    }

    // Basic email sanitization
    return email
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9@._+-]/g, '') // Only allow valid email characters
      .substring(0, 254); // Email length limit
  }

  /**
   * Sanitize phone numbers
   */
  sanitizePhoneNumber(phone: string): string {
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
   * Sanitize JSON input
   */
  sanitizeJSON(input: string): any {
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
  sanitizeObject(obj: any): any {
    if (obj === null || obj === undefined) {
      return obj;
    }

    if (typeof obj === 'string') {
      return this.sanitizeText(obj);
    }

    if (Array.isArray(obj)) {
      return obj.map(item => this.sanitizeObject(item));
    }

    if (typeof obj === 'object') {
      const sanitized: any = {};
      for (const [key, value] of Object.entries(obj)) {
        // Sanitize keys as well
        const sanitizedKey = this.sanitizeText(key);
        if (sanitizedKey) {
          sanitized[sanitizedKey] = this.sanitizeObject(value);
        }
      }
      return sanitized;
    }

    return obj;
  }

  /**
   * Sanitize search queries
   */
  sanitizeSearchQuery(query: string): string {
    if (!query || typeof query !== 'string') {
      return '';
    }

    return query
      .replace(/[<>]/g, '') // Remove angle brackets
      .replace(/["';\\]/g, '') // Remove quotes and semicolons
      .replace(/\*/g, '%') // Convert wildcards
      .trim()
      .substring(0, 500);
  }

  /**
   * Validate and sanitize color values
   */
  sanitizeColor(color: string): string {
    if (!color || typeof color !== 'string') {
      return '#000000';
    }

    // Allow hex colors, rgb, rgba, hsl, hsla
    const colorPattern = /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$|^(rgb|rgba|hsl|hsla)\(.*\)$/i;
    
    return colorPattern.test(color) ? color : '#000000';
  }

  /**
   * Sanitize IP addresses
   */
  sanitizeIPAddress(ip: string): string {
    if (!ip || typeof ip !== 'string') {
      return '';
    }

    // IPv4 pattern
    const ipv4Pattern = /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;
    
    // IPv6 pattern (simplified)
    const ipv6Pattern = /^(?:[0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}$|^::1$|^::$/;

    if (ipv4Pattern.test(ip) || ipv6Pattern.test(ip)) {
      return ip;
    }

    return '';
  }
}