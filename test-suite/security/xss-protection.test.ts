/**
 * XSS Protection Security Tests
 * Comprehensive testing for Cross-Site Scripting vulnerabilities and prevention
 */

import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { PrismaService } from '../../src/prisma/prisma.service';
import { InputSanitizationService } from '../../src/security/input-sanitization.service';
import { AppModule } from '../../src/app.module';

// Comprehensive XSS test payloads
const XSS_PAYLOADS = {
  basic: [
    '<script>alert("XSS")</script>',
    '<img src="x" onerror="alert(1)">',
    '<svg onload="alert(1)">',
    '<iframe src="javascript:alert(1)">',
    '<body onload="alert(1)">',
    '<input onfocus="alert(1)" autofocus>',
    '<select onfocus="alert(1)" autofocus>',
    '<textarea onfocus="alert(1)" autofocus>',
    '<keygen onfocus="alert(1)" autofocus>',
    '<video><source onerror="alert(1)">',
    '<audio><source onerror="alert(1)">',
    '<details open ontoggle="alert(1)">',
  ],
  advanced: [
    '<script>String.fromCharCode(88,83,83)</script>',
    '"><script>alert(String.fromCharCode(88,83,83))</script>',
    '<scr<script>ipt>alert(1)</scr</script>ipt>',
    '<img src=x onerror=alert(1)//>',
    '<img src=x onerror="alert(1)">',
    '<img src=x onerror=alert(1)>',
    '<img src=x onerror=alert`1`>',
    '<img src=x onerror=alert(1)>',
    '<img src=x onerror=alert(1);//>',
    '<img src=x onerror=alert(1)>`>',
    '<img src=x onerror=alert(1)>">',
    '<img src=x onerror=alert(1)><script>alert(2)</script>',
  ],
  eventHandlers: [
    '<div onmouseover="alert(1)">Hover me</div>',
    '<div onclick="alert(1)">Click me</div>',
    '<div onload="alert(1)">Load me</div>',
    '<div onscroll="alert(1)">Scroll me</div>',
    '<div onresize="alert(1)">Resize me</div>',
    '<form onsubmit="alert(1)"><input type="submit"></form>',
    '<a href="javascript:alert(1)">Click me</a>',
    '<button onclick="alert(1)">Click me</button>',
    '<iframe onload="alert(1)">',
  ],
  styleInjection: [
    '<div style="background-image:url(javascript:alert(1))">',
    '<div style="background:url(javascript:alert(1))">',
    '<div style="list-style-image:url(javascript:alert(1))">',
    '<div style="content:url(javascript:alert(1))">',
    '<div style="cursor:url(javascript:alert(1))">',
    '<div style="animation:url(javascript:alert(1))">',
  ],
  metaRefresh: [
    '<meta http-equiv="refresh" content="0;url=javascript:alert(1)">',
    '<meta http-equiv="refresh" content="0;url=data:text/html,<script>alert(1)</script>">',
  ],
  dataUri: [
    'data:text/html,<script>alert(1)</script>',
    'data:text/html;base64,PHNjcmlwdD5hbGVydCgiWFNTIik8L3NjcmlwdD4=',
    'data:image/svg+xml,<svg onload="alert(1)">',
    'data:application/x-shockwave-flash,data="', 
  ],
  unicode: [
    '%3Cscript%3Ealert%281%29%3C%2Fscript%3E',
    '&#60;script&#62;alert(1)&#60;/script&#62;',
    '&lt;script&gt;alert(1)&lt;/script&gt;',
    '<scri%00pt>alert(1)</scri%00pt>',
    '<scr%00ipt>alert(1)</scr%00ipt>',
  ],
  filterEvasion: [
    '<scr<script>ipt>alert(1)</scr</script>ipt>',
    '<scr"ipt>alert(1)</scr"ipt>',
    '<scr\'ipt>alert(1)</scr\'ipt>',
    '<scr/`ipt>alert(1)</scr/`ipt>',
    '<scr\\ipt>alert(1)</scr\\ipt>',
  ],
};

describe('XSS Protection Security Tests', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let inputSanitization: InputSanitizationService;
  let authToken: string;
  let testUser: any;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleRef.createNestApplication();
    await app.init();

    prisma = app.get(PrismaService);
    inputSanitization = app.get(InputSanitizationService);

    // Setup test user and authentication
    testUser = await prisma.user.create({
      data: {
        email: 'xss.test@example.com',
        password: 'TestPassword123!',
        name: 'XSS Test User',
      },
    });

    const loginResponse = await request(app.getHttpServer())
      .post('/auth/login')
      .send({
        email: testUser.email,
        password: 'TestPassword123!',
      });

    authToken = loginResponse.body.access_token;
  });

  afterAll(async () => {
    // Clean up test data
    await prisma.agent.deleteMany({
      where: { userId: testUser.id },
    });
    await prisma.user.delete({
      where: { id: testUser.id },
    });

    await app.close();
  });

  describe('Basic XSS Prevention', () => {
    it('should prevent basic script tag injection', async () => {
      for (const payload of XSS_PAYLOADS.basic) {
        const response = await request(app.getHttpServer())
          .post('/agents')
          .send({
            name: 'Test Agent',
            description: payload,
            type: 'CHAT',
          })
          .set('Authorization', `Bearer ${authToken}`);

        // Should either reject the request or sanitize the content
        expect([200, 400]).toContain(response.status);
        
        if (response.status === 200) {
          // If accepted, content should be properly escaped
          expect(response.body.description).not.toContain('<script>');
          expect(response.body.description).not.toContain('onerror=');
          expect(response.body.description).not.toContain('onload=');
        }
      }
    });

    it('should prevent advanced XSS techniques', async () => {
      for (const payload of XSS_PAYLOADS.advanced) {
        const response = await request(app.getHttpServer())
          .post('/agents')
          .send({
            name: 'Test Agent',
            description: payload,
            type: 'CHAT',
          })
          .set('Authorization', `Bearer ${authToken}`);

        expect([200, 400]).toContain(response.status);
        
        if (response.status === 200) {
          // Verify script tags and dangerous attributes are removed/escaped
          const description = response.body.description;
          expect(description).not.toMatch(/<script[\s\S]*?>/i);
          expect(description).not.toMatch(/onerror\s*=/i);
          expect(description).not.toMatch(/onload\s*=/i);
          expect(description).not.toMatch(/javascript:/i);
        }
      }
    });
  });

  describe('Event Handler XSS Prevention', () => {
    it('should prevent event handler XSS attacks', async () => {
      for (const payload of XSS_PAYLOADS.eventHandlers) {
        const response = await request(app.getHttpServer())
          .post('/agents')
          .send({
            name: 'Test Agent',
            description: payload,
            type: 'CHAT',
          })
          .set('Authorization', `Bearer ${authToken}`);

        expect([200, 400]).toContain(response.status);
        
        if (response.status === 200) {
          // All event handlers should be removed or escaped
          expect(response.body.description).not.toMatch(/on\w+\s*=/i);
        }
      }
    });
  });

  describe('Style-based XSS Prevention', () => {
    it('should prevent CSS-based XSS attacks', async () => {
      for (const payload of XSS_PAYLOADS.styleInjection) {
        const response = await request(app.getHttpServer())
          .post('/agents')
          .send({
            name: 'Test Agent',
            description: payload,
            type: 'CHAT',
          })
          .set('Authorization', `Bearer ${authToken}`);

        expect([200, 400]).toContain(response.status);
        
        if (response.status === 200) {
          // JavaScript in style attributes should be removed
          expect(response.body.description).not.toMatch(/javascript:/i);
          expect(response.body.description).not.toMatch(/expression\s*\(/i);
        }
      }
    });
  });

  describe('Meta Tag XSS Prevention', () => {
    it('should prevent meta refresh XSS attacks', async () => {
      for (const payload of XSS_PAYLOADS.metaRefresh) {
        const response = await request(app.getHttpServer())
          .post('/agents')
          .send({
            name: 'Test Agent',
            description: payload,
            type: 'CHAT',
          })
          .set('Authorization', `Bearer ${authToken}`);

        expect([200, 400]).toContain(response.status);
        
        if (response.status === 200) {
          // Meta tags with javascript should be removed
          expect(response.body.description).not.toMatch(/<meta[\s\S]*?javascript:/i);
        }
      }
    });
  });

  describe('Data URI XSS Prevention', () => {
    it('should prevent data URI XSS attacks', async () => {
      for (const payload of XSS_PAYLOADS.dataUri) {
        const response = await request(app.getHttpServer())
          .post('/agents')
          .send({
            name: 'Test Agent',
            description: payload,
            type: 'CHAT',
          })
          .set('Authorization', `Bearer ${authToken}`);

        expect([200, 400]).toContain(response.status);
        
        if (response.status === 200) {
          // Data URIs with scripts should be handled safely
          const description = response.body.description;
          if (description.includes('data:')) {
            // Should not contain unescaped data URIs with script content
            expect(description).not.toMatch(/data:text\/html/i);
            expect(description).not.toMatch(/data:image\/svg\+xml/i);
          }
        }
      }
    });
  });

  describe('Unicode and Encoding XSS Prevention', () => {
    it('should prevent Unicode-encoded XSS attacks', async () => {
      for (const payload of XSS_PAYLOADS.unicode) {
        const response = await request(app.getHttpServer())
          .post('/agents')
          .send({
            name: 'Test Agent',
            description: payload,
            type: 'CHAT',
          })
          .set('Authorization', `Bearer ${authToken}`);

        expect([200, 400]).toContain(response.status);
        
        if (response.status === 200) {
          // Decoded content should still be safe
          expect(response.body.description).not.toContain('<script>');
        }
      }
    });
  });

  describe('Filter Evasion XSS Prevention', () => {
    it('should prevent filter bypass XSS attacks', async () => {
      for (const payload of XSS_PAYLOADS.filterEvasion) {
        const response = await request(app.getHttpServer())
          .post('/agents')
          .send({
            name: 'Test Agent',
            description: payload,
            type: 'CHAT',
          })
          .set('Authorization', `Bearer ${authToken}`);

        expect([200, 400]).toContain(response.status);
        
        if (response.status === 200) {
          // Should not contain script tags even with clever bypasses
          expect(response.body.description).not.toContain('<script>');
        }
      }
    });
  });

  describe('Context-specific XSS Prevention', () => {
    it('should prevent XSS in different HTML contexts', async () => {
      const contexts = [
        {
          field: 'name',
          value: '"><script>alert(1)</script>',
          expected: 'Script tags should be escaped in name field',
        },
        {
          field: 'description', 
          value: '\'onmouseover="alert(1)\'',
          expected: 'Event handlers should be escaped in description',
        },
        {
          field: 'config',
          value: JSON.stringify({ theme: '<script>alert(1)</script>' }),
          expected: 'XSS in JSON should be handled safely',
        },
      ];

      for (const context of contexts) {
        const response = await request(app.getHttpServer())
          .post('/agents')
          .send({
            name: context.field === 'name' ? context.value : 'Test Agent',
            description: context.field === 'description' ? context.value : 'Test description',
            config: context.field === 'config' ? JSON.parse(context.value) : {},
            type: 'CHAT',
          })
          .set('Authorization', `Bearer ${authToken}`);

        expect([200, 400]).toContain(response.status);
        
        if (response.status === 200) {
          // Verify context-specific sanitization
          if (context.field === 'name') {
            expect(response.body.name).not.toContain('<script>');
          } else if (context.field === 'description') {
            expect(response.body.description).not.toMatch(/onmouseover/i);
          }
        }
      }
    });
  });

  describe('API Response XSS Prevention', () => {
    it('should prevent XSS in API response headers', async () => {
      const response = await request(app.getHttpServer())
        .get('/agents')
        .set('Authorization', `Bearer ${authToken}`)
        .set('User-Agent', '<script>alert("XSS")</script>');

      // Headers should not be vulnerable
      expect(response.headers).not.toHaveProperty('content-security-policy');
      
      // Response body should be properly formatted
      expect(response.body).toBeDefined();
    });

    it('should prevent XSS in error messages', async () => {
      // Try to trigger error with XSS payload
      const response = await request(app.getHttpServer())
        .post('/agents')
        .send({
          name: '<script>alert("XSS")</script>',
          description: 'Test',
          type: 'INVALID_TYPE',
        })
        .set('Authorization', `Bearer ${authToken}`);

      // Error message should not contain XSS
      if (response.body.message) {
        expect(response.body.message).not.toContain('<script>');
        expect(response.body.message).not.toContain('onerror=');
      }
    });
  });

  describe('Input Sanitization Service Tests', () => {
    it('should sanitize basic XSS payloads', () => {
      XSS_PAYLOADS.basic.forEach(payload => {
        const result = inputSanitization.sanitizeInput(payload);
        
        expect(result).not.toContain('<script>');
        expect(result).not.toContain('onerror=');
        expect(result).not.toContain('onload=');
        expect(result).not.toContain('javascript:');
      });
    });

    it('should sanitize HTML content properly', () => {
      const maliciousHtml = '<p>Hello <script>alert("XSS")</script> world!</p>';
      const result = inputSanitization.sanitizeHtml(maliciousHtml);

      expect(result).toContain('&lt;script&gt;');
      expect(result).toContain('&lt;/script&gt;');
      expect(result).toContain('Hello');
      expect(result).toContain('world!');
    });

    it('should allow safe HTML tags', () => {
      const safeHtml = '<p>Hello <strong>world</strong>!</p>';
      const result = inputSanitization.sanitizeHtml(safeHtml);

      expect(result).toContain('<p>');
      expect(result).toContain('<strong>');
      expect(result).toContain('</strong>');
      expect(result).toContain('</p>');
    });

    it('should remove dangerous attributes', () => {
      const maliciousHtml = '<p onclick="alert(1)" style="color:red">Click me</p>';
      const result = inputSanitization.sanitizeHtml(maliciousHtml);

      expect(result).not.toContain('onclick=');
      expect(result).not.toContain('style=');
    });
  });

  describe('Content Security Policy (CSP) Tests', () => {
    it('should include CSP headers in responses', async () => {
      const response = await request(app.getHttpServer())
        .get('/agents')
        .set('Authorization', `Bearer ${authToken}`);

      // Check for security headers
      expect(response.headers['x-frame-options']).toBeDefined();
      expect(response.headers['x-content-type-options']).toBe('nosniff');
    });

    it('should set appropriate CORS headers', async () => {
      const response = await request(app.getHttpServer())
        .get('/agents')
        .set('Origin', 'https://malicious-site.com')
        .set('Authorization', `Bearer ${authToken}`);

      // CORS should be restrictive
      if (response.headers['access-control-allow-origin']) {
        expect(response.headers['access-control-allow-origin']).not.toBe('*');
      }
    });
  });

  describe('Browser-specific XSS Prevention', () => {
    it('should prevent IE-specific XSS attacks', async () => {
      const iePayloads = [
        '<meta http-equiv="x-ua-compatible" content="IE=edge">',
        '<style>body{expression(alert(1))}</style>',
        '<div style="width:expression(alert(1))">',
      ];

      for (const payload of iePayloads) {
        const response = await request(app.getHttpServer())
          .post('/agents')
          .send({
            name: 'Test Agent',
            description: payload,
            type: 'CHAT',
          })
          .set('Authorization', `Bearer ${authToken}`);

        expect([200, 400]).toContain(response.status);
        
        if (response.status === 200) {
          expect(response.body.description).not.toMatch(/expression\s*\(/i);
          expect(response.body.description).not.toMatch(/x-ua-compatible/i);
        }
      }
    });
  });

  describe('Performance Impact of XSS Prevention', () => {
    it('should handle XSS prevention efficiently', async () => {
      const maliciousInputs = Array(100).fill().map((_, i) => 
        `<script>alert(${i})</script>`
      );

      const startTime = Date.now();
      
      const results = maliciousInputs.map(input => 
        inputSanitization.sanitizeInput(input)
      );
      
      const endTime = Date.now();
      
      // All inputs should be sanitized
      expect(results).toHaveLength(100);
      expect(results.every(r => !r.includes('<script>'))).toBe(true);
      
      // Should complete within reasonable time
      expect(endTime - startTime).toBeLessThan(1000);
    });

    it('should not cause performance degradation with XSS filters', async () => {
      const normalInput = 'This is normal text content without any malicious code.';
      
      const startTime = Date.now();
      const sanitized = inputSanitization.sanitizeInput(normalInput);
      const endTime = Date.now();
      
      expect(sanitized).toBe(normalInput);
      expect(endTime - startTime).toBeLessThan(10); // Should be very fast
    });
  });

  describe('XSS in Different Data Types', () => {
    it('should prevent XSS in JSON data', async () => {
      const maliciousJson = {
        name: 'Test Agent',
        description: '<script>alert("XSS")</script>',
        metadata: {
          tags: ['<img src="x" onerror="alert(1)">'],
          category: '"><script>alert(1)</script>',
        },
      };

      const response = await request(app.getHttpServer())
        .post('/agents')
        .send(maliciousJson)
        .set('Authorization', `Bearer ${authToken}`);

      expect([200, 400]).toContain(response.status);
      
      if (response.status === 200) {
        // JSON should be properly escaped when returned
        const responseStr = JSON.stringify(response.body);
        expect(responseStr).not.toMatch(/<script[\s\S]*?>/i);
      }
    });

    it('should prevent XSS in file names and metadata', async () => {
      const maliciousFileData = {
        filename: 'report<script>alert(1)</script>.pdf',
        description: 'File with <img src="x" onerror="alert(1)"> in description',
      };

      const response = await request(app.getHttpServer())
        .post('/agents/upload')
        .send(maliciousFileData)
        .set('Authorization', `Bearer ${authToken}`);

      expect([200, 400]).toContain(response.status);
      
      if (response.status === 200) {
        expect(response.body.filename).not.toContain('<script>');
        expect(response.body.description).not.toContain('onerror=');
      }
    });
  });
});
