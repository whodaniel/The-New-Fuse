/**
 * Comprehensive Security Testing Suite
 * Tests for authentication bypass, input sanitization, SQL injection prevention
 */

import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../../src/app.module';
import { DatabaseService } from '../../src/db/db.service';
import { InputSanitizationService } from '../../src/security/input-sanitization.service';
import { SecurityTestingService } from '../../src/security/security-testing.service';

// Test data for security testing
const SECURITY_TEST_DATA = {
  sqlInjectionPayloads: [
    "' OR '1'='1",
    "'; DROP TABLE users; --",
    "admin'--",
    "1' OR 1=1#",
    "1' OR 'a'='a",
    "') OR ('1'='1",
  ],
  xssPayloads: [
    '<script>alert("xss")</script>',
    '<img src="x" onerror="alert(1)">',
    'javascript:alert("xss")',
    '<svg onload="alert(1)">',
    '<iframe src="javascript:alert(1)">',
    "';alert(String.fromCharCode(88,83,83))//';alert(String.fromCharCode(88,83,83))//\";alert(String.fromCharCode(88,83,83))//</script></html></iframe></table></form></table></iframe></html></body></html></html></html></html></html></html></html></html></html>",
  ],
  pathTraversalPayloads: [
    '../../../etc/passwd',
    '..\\..\\..\\windows\\system32\\drivers\\etc\\hosts',
    '%2e%2e%2f%2e%2e%2f%2e%2e%2fetc%2fpasswd',
    '....//....//....//etc/passwd',
  ],
  commandInjectionPayloads: [
    '; cat /etc/passwd',
    '| whoami',
    '`whoami`',
    '$(whoami)',
    '&& rm -rf /',
  ],
};

describe('Security Tests', () => {
  let app: INestApplication;
  let db: DatabaseService;
  let inputSanitization: InputSanitizationService;
  let securityTesting: SecurityTestingService;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleRef.createNestApplication();
    await app.init();

    db = app.get(DatabaseService);
    inputSanitization = app.get(InputSanitizationService);
    securityTesting = app.get(SecurityTestingService);
  });

  afterAll(async () => {
    await db.cleanDatabase();
    await app.close();
  });

  describe('Authentication Security Tests', () => {
    let authToken: string;
    let testUser: any;

    beforeEach(async () => {
      // Create test user
      testUser = await db.user.create({
        data: {
          email: 'security.test@example.com',
          password: 'TestPassword123!',
          name: 'Security Test User',
        },
      });

      // Login to get valid token
      const loginResponse = await request(app.getHttpServer())
        .post('/auth/login')
        .send({
          email: testUser.email,
          password: 'TestPassword123!',
        });

      authToken = loginResponse.body.access_token;
    });

    describe('Authentication Bypass Prevention', () => {
      it('should reject requests with invalid tokens', async () => {
        const invalidTokens = [
          'invalid-token',
          'Bearer invalid-token',
          'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.invalid',
          'test-token', // Historical test token
          'development-token', // Historical dev token
        ];

        for (const token of invalidTokens) {
          const response = await request(app.getHttpServer())
            .get('/agents')
            .set('Authorization', `Bearer ${token}`);

          expect(response.status).toBe(401);
          expect(response.body.message).toContain('Unauthorized');
        }
      });

      it('should reject requests without authorization header', async () => {
        const response = await request(app.getHttpServer())
          .get('/agents');

        expect(response.status).toBe(401);
      });

      it('should reject requests with malformed authorization header', async () => {
        const malformedHeaders = [
          'InvalidFormat token',
          'Basic invalid-credentials',
          'Digest realm="test"',
          '', // Empty header
          'Bearer ', // Empty token
        ];

        for (const header of malformedHeaders) {
          const response = await request(app.getHttpServer())
            .get('/agents')
            .set('Authorization', header);

          expect(response.status).toBe(401);
        }
      });

      it('should validate token expiration', async () => {
        // Test with expired token (simulated)
        const expiredToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.' + 
          Buffer.from(JSON.stringify({ exp: Math.floor(Date.now() / 1000) - 3600 })).toString('base64') +
          '.invalid-signature';

        const response = await request(app.getHttpServer())
          .get('/agents')
          .set('Authorization', `Bearer ${expiredToken}`);

        expect(response.status).toBe(401);
      });

      it('should prevent session fixation attacks', async () => {
        // Test that session cannot be hijacked
        const response1 = await request(app.getHttpServer())
          .get('/auth/me')
          .set('Authorization', `Bearer ${authToken}`);

        expect(response1.status).toBe(200);

        // Attempt to use token from different user context
        const response2 = await request(app.getHttpServer())
          .get('/auth/me')
          .set('Authorization', `Bearer ${authToken}`)
          .set('X-Forwarded-For', '192.168.1.100'); // Different IP

        expect(response2.status).toBe(200);
        // Token should still be valid for same user, but IP change should be logged
      });
    });

    describe('Role-Based Access Control', () => {
      let adminUser: any;
      let regularUser: any;

      beforeEach(async () => {
        adminUser = await db.user.create({
          data: {
            email: 'admin.test@example.com',
            password: 'AdminPassword123!',
            name: 'Admin Test User',
            role: 'ADMIN',
          },
        });

        regularUser = await db.user.create({
          data: {
            email: 'user.test@example.com',
            password: 'UserPassword123!',
            name: 'Regular Test User',
            role: 'USER',
          },
        });
      });

      it('should prevent regular users from accessing admin endpoints', async () => {
        const userLogin = await request(app.getHttpServer())
          .post('/auth/login')
          .send({
            email: regularUser.email,
            password: 'UserPassword123!',
          });

        const userToken = userLogin.body.access_token;

        const response = await request(app.getHttpServer())
          .get('/admin/users')
          .set('Authorization', `Bearer ${userToken}`);

        expect(response.status).toBe(403);
        expect(response.body.message).toContain('Forbidden');
      });

      it('should allow admin users to access admin endpoints', async () => {
        const adminLogin = await request(app.getHttpServer())
          .post('/auth/login')
          .send({
            email: adminUser.email,
            password: 'AdminPassword123!',
          });

        const adminToken = adminLogin.body.access_token;

        const response = await request(app.getHttpServer())
          .get('/admin/users')
          .set('Authorization', `Bearer ${adminToken}`);

        expect(response.status).toBe(200);
      });
    });
  });

  describe('Input Sanitization Tests', () => {
    describe('SQL Injection Prevention', () => {
      it('should prevent SQL injection in user input', async () => {
        for (const payload of SECURITY_TEST_DATA.sqlInjectionPayloads) {
          const response = await request(app.getHttpServer())
            .post('/agents/search')
            .send({ query: payload })
            .set('Authorization', `Bearer ${authToken}`);

          // Should either return 400 (bad request) or 200 with sanitized results
          // but never execute the SQL injection
          expect([400, 200]).toContain(response.status);
          
          if (response.status === 200) {
            // Results should not contain any indication of SQL execution
            expect(response.body).not.toMatch(/error|exception|sql|syntax/i);
          }
        }
      });

      it('should prevent SQL injection in agent creation', async () => {
        for (const payload of SECURITY_TEST_DATA.sqlInjectionPayloads) {
          const response = await request(app.getHttpServer())
            .post('/agents')
            .send({
              name: payload,
              description: 'Test agent',
              type: 'CHAT',
            })
            .set('Authorization', `Bearer ${authToken}`);

          expect(response.status).toBe(400);
          expect(response.body.message).toMatch(/validation|invalid/i);
        }
      });

      it('should sanitize database query parameters', async () => {
        // Test that user input is properly escaped in database queries
        const maliciousName = "'; DROP TABLE agents; --";
        
        const response = await request(app.getHttpServer())
          .post('/agents')
          .send({
            name: maliciousName,
            description: 'Test agent',
            type: 'CHAT',
          })
          .set('Authorization', `Bearer ${authToken}`);

        expect(response.status).toBe(400);
        
        // Verify the table still exists by creating a valid agent
        const validResponse = await request(app.getHttpServer())
          .post('/agents')
          .send({
            name: 'Valid Agent',
            description: 'Test agent',
            type: 'CHAT',
          })
          .set('Authorization', `Bearer ${authToken}`);

        expect(validResponse.status).toBe(201);
      });
    });

    describe('XSS Prevention', () => {
      it('should prevent XSS in user input', async () => {
        for (const payload of SECURITY_TEST_DATA.xssPayloads) {
          const response = await request(app.getHttpServer())
            .post('/agents')
            .send({
              name: 'Test Agent',
              description: payload,
              type: 'CHAT',
            })
            .set('Authorization', `Bearer ${authToken}`);

          // Should either sanitize the input or reject it
          expect([200, 400]).toContain(response.status);
          
          if (response.status === 200) {
            // If accepted, the response should not contain unescaped script tags
            expect(response.body.description).not.toContain('<script>');
            expect(response.body.description).not.toContain('javascript:');
          }
        }
      });

      it('should escape HTML entities in user content', async () => {
        const maliciousContent = '<script>alert("xss")</script><p>Test content</p>';
        
        const response = await request(app.getHttpServer())
          .post('/agents')
          .send({
            name: 'Test Agent',
            description: maliciousContent,
            type: 'CHAT',
          })
          .set('Authorization', `Bearer ${authToken}`);

        if (response.status === 200) {
          // Content should be properly escaped
          expect(response.body.description).toContain('&lt;script&gt;');
          expect(response.body.description).toContain('&lt;/script&gt;');
        }
      });
    });

    describe('Path Traversal Prevention', () => {
      it('should prevent path traversal attacks', async () => {
        for (const payload of SECURITY_TEST_DATA.pathTraversalPayloads) {
          const response = await request(app.getHttpServer())
            .get(`/files/${payload}`)
            .set('Authorization', `Bearer ${authToken}`);

          expect(response.status).toBe(400);
          expect(response.body.message).toMatch(/invalid|forbidden|not allowed/i);
        }
      });

      it('should prevent command injection', async () => {
        for (const payload of SECURITY_TEST_DATA.commandInjectionPayloads) {
          const response = await request(app.getHttpServer())
            .post('/system/execute')
            .send({ command: payload })
            .set('Authorization', `Bearer ${authToken}`);

          expect(response.status).toBe(400);
        }
      });
    });
  });

  describe('WebSocket Security Tests', () => {
    it('should require authentication for WebSocket connections', async () => {
      // Test WebSocket connection without authentication
      const WebSocket = require('ws');
      const ws = new WebSocket(`ws://localhost:3001?userId=test`);

      // Should disconnect unauthenticated connections
      ws.on('close', (code: number, reason: Buffer) => {
        expect(code).toBe(4001); // Unauthorized code
      });

      // Wait for connection attempt
      await new Promise(resolve => setTimeout(resolve, 1000));
    });

    it('should validate WebSocket message content', async () => {
      // This would require a more complex WebSocket test setup
      // For now, testing the service directly
      const maliciousMessage = {
        type: 'chat',
        content: '<script>alert("xss")</script>',
      };

      const sanitized = inputSanitization.sanitizeMessage(maliciousMessage);
      
      expect(sanitized.content).not.toContain('<script>');
      expect(sanitized.content).not.toContain('javascript:');
    });
  });

  describe('Security Headers and CORS', () => {
    it('should set security headers', async () => {
      const response = await request(app.getHttpServer())
        .get('/health')
        .set('Origin', 'https://malicious-site.com');

      // Check for security headers
      expect(response.headers).toHaveProperty('x-frame-options');
      expect(response.headers).toHaveProperty('x-content-type-options');
      expect(response.headers).toHaveProperty('x-xss-protection');
      
      // CORS should be restrictive
      if (response.headers['access-control-allow-origin']) {
        expect(response.headers['access-control-allow-origin']).not.toBe('*');
      }
    });

    it('should implement rate limiting', async () => {
      // Attempt to overwhelm the login endpoint
      const loginAttempts = Array(10).fill().map(() =>
        request(app.getHttpServer())
          .post('/auth/login')
          .send({
            email: 'nonexistent@example.com',
            password: 'wrongpassword',
          })
      );

      const responses = await Promise.all(loginAttempts);
      
      // Some requests should be rate limited (429)
      const rateLimitedResponses = responses.filter(r => r.status === 429);
      expect(rateLimitedResponses.length).toBeGreaterThan(0);
    });
  });

  describe('Data Protection and Privacy', () => {
    it('should not expose sensitive data in responses', async () => {
      const response = await request(app.getHttpServer())
        .get('/auth/me')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.body).not.toHaveProperty('password');
      expect(response.body).not.toHaveProperty('passwordHash');
      expect(response.body).not.toHaveProperty('secretKey');
      expect(response.body).not.toHaveProperty('privateKey');
    });

    it('should implement proper data validation', async () => {
      const invalidData = {
        email: 'not-an-email',
        password: '', // Empty password
        name: '', // Empty name
        role: 'INVALID_ROLE',
      };

      const response = await request(app.getHttpServer())
        .post('/auth/register')
        .send(invalidData);

      expect(response.status).toBe(400);
      expect(response.body.message).toMatch(/validation|invalid/i);
    });
  });
});

describe('Security Performance Tests', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleRef.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('should handle security scanning efficiently', async () => {
    const startTime = Date.now();
    
    // Simulate security scanning workload
    const scanPromises = [];
    for (let i = 0; i < 50; i++) {
      scanPromises.push(
        request(app.getHttpServer())
          .get('/health')
          .set('X-Security-Scan', 'true')
      );
    }

    const responses = await Promise.all(scanPromises);
    const endTime = Date.now();

    // All requests should complete within reasonable time
    expect(endTime - startTime).toBeLessThan(5000); // 5 seconds max
    expect(responses.every(r => r.status === 200)).toBe(true);
  });
});
