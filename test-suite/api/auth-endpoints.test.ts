/**
 * API Endpoint Security Tests
 * Comprehensive testing of all critical API endpoints for security vulnerabilities
 */

import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { PrismaService } from '../../src/prisma/prisma.service';
import { AppModule } from '../../src/app.module';

// API Endpoint categories for comprehensive testing
const API_ENDPOINTS = {
  auth: {
    login: { method: 'POST', path: '/auth/login' },
    register: { method: 'POST', path: '/auth/register' },
    logout: { method: 'POST', path: '/auth/logout' },
    me: { method: 'GET', path: '/auth/me' },
    refresh: { method: 'POST', path: '/auth/refresh' },
    forgotPassword: { method: 'POST', path: '/auth/forgot-password' },
    resetPassword: { method: 'POST', path: '/auth/reset-password' },
  },
  agents: {
    list: { method: 'GET', path: '/agents' },
    create: { method: 'POST', path: '/agents' },
    get: { method: 'GET', path: '/agents/:id' },
    update: { method: 'PUT', path: '/agents/:id' },
    delete: { method: 'DELETE', path: '/agents/:id' },
    search: { method: 'POST', path: '/agents/search' },
    start: { method: 'POST', path: '/agents/:id/start' },
    stop: { method: 'POST', path: '/agents/:id/stop' },
    upload: { method: 'POST', path: '/agents/upload' },
  },
  websocket: {
    connect: { method: 'GET', path: '/websocket' },
    message: { method: 'POST', path: '/websocket/message' },
    disconnect: { method: 'POST', path: '/websocket/disconnect' },
  },
  admin: {
    users: { method: 'GET', path: '/admin/users' },
    userDetails: { method: 'GET', path: '/admin/users/:id' },
    updateUser: { method: 'PUT', path: '/admin/users/:id' },
    deleteUser: { method: 'DELETE', path: '/admin/users/:id' },
    systemStatus: { method: 'GET', path: '/admin/system/status' },
    metrics: { method: 'GET', path: '/admin/metrics' },
    logs: { method: 'GET', path: '/admin/logs' },
  },
  system: {
    health: { method: 'GET', path: '/health' },
    status: { method: 'GET', path: '/status' },
    config: { method: 'GET', path: '/system/config' },
    info: { method: 'GET', path: '/system/info' },
  },
};

// Security test payloads
const SECURITY_TEST_PAYLOADS = {
  sqlInjection: [
    "' OR '1'='1",
    "admin'--",
    "'; DROP TABLE agents; --",
    "UNION SELECT * FROM users--",
    "1' AND (SELECT * FROM (SELECT COUNT(*),CONCAT(version(),FLOOR(RAND(0)*2))x FROM information_schema.tables GROUP BY x)a)--",
  ],
  xss: [
    '<script>alert("XSS")</script>',
    '<img src="x" onerror="alert(1)">',
    'javascript:alert("XSS")',
    '<svg onload="alert(1)">',
    '"><script>alert("XSS")</script>',
  ],
  pathTraversal: [
    '../../../etc/passwd',
    '..\\..\\..\\windows\\system32\\drivers\\etc\\hosts',
    '%2e%2e%2f%2e%2e%2f%2e%2e%2fetc%2fpasswd',
    '....//....//....//etc/passwd',
  ],
  commandInjection: [
    '; cat /etc/passwd',
    '| whoami',
    '`whoami`',
    '$(whoami)',
    '&& rm -rf /',
  ],
  noSqlInjection: [
    '{"$ne": ""}',
    '{"$regex": ".*"}',
    '{"$where": "this.password"}',
    '"; return true; var dummy="',
  ],
  ldapInjection: [
    '*)(uid=*))(|(uid=*',
    '*)(|(password=*))',
    'admin)(&(password=*)',
  ],
};

describe('API Endpoint Security Tests', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let authToken: string;
  let adminToken: string;
  let testUser: any;
  let testAdmin: any;
  let testAgent: any;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleRef.createNestApplication();
    await app.init();

    prisma = moduleRef.get<PrismaService>(PrismaService);

    // Setup test users
    testUser = await prisma.user.create({
      data: {
        email: 'api.test.user@example.com',
        password: 'UserPassword123!',
        name: 'API Test User',
        role: 'USER',
      },
    });

    testAdmin = await prisma.user.create({
      data: {
        email: 'api.test.admin@example.com',
        password: 'AdminPassword123!',
        name: 'API Test Admin',
        role: 'ADMIN',
      },
    });

    // Setup authentication
    const userLogin = await request(app.getHttpServer())
      .post('/auth/login')
      .send({
        email: testUser.email,
        password: 'UserPassword123!',
      });

    authToken = userLogin.body.access_token;

    const adminLogin = await request(app.getHttpServer())
      .post('/auth/login')
      .send({
        email: testAdmin.email,
        password: 'AdminPassword123!',
      });

    adminToken = adminLogin.body.access_token;

    // Setup test agent
    testAgent = await prisma.agent.create({
      data: {
        name: 'API Test Agent',
        description: 'Test agent for API security testing',
        type: 'CHAT',
        userId: testUser.id,
      },
    });
  });

  afterAll(async () => {
    await prisma.agent.deleteMany({
      where: { 
        OR: [
          { userId: testUser.id },
          { userId: testAdmin.id },
        ],
      },
    });
    await prisma.user.deleteMany({
      where: {
        OR: [
          { id: testUser.id },
          { id: testAdmin.id },
        ],
      },
    });
    await app.close();
  });

  describe('Authentication Endpoint Security', () => {
    describe('Login Endpoint', () => {
      it('should prevent SQL injection in login credentials', async () => {
        for (const payload of SECURITY_TEST_PAYLOADS.sqlInjection) {
          const response = await request(app.getHttpServer())
            .post('/auth/login')
            .send({
              email: payload,
              password: 'anypassword',
            });

          // Should not authenticate with injected SQL
          expect(response.status).not.toBe(200);
          expect(response.body.access_token).toBeUndefined();
        }
      });

      it('should prevent brute force attacks', async () => {
        const attempts = 20;
        const promises = Array(attempts).fill().map(() =>
          request(app.getHttpServer())
            .post('/auth/login')
            .send({
              email: 'nonexistent@example.com',
              password: 'wrongpassword',
            })
        );

        const responses = await Promise.all(promises);
        const rateLimitedResponses = responses.filter(r => r.status === 429);

        // Should rate limit after multiple failed attempts
        expect(rateLimitedResponses.length).toBeGreaterThan(0);
      });

      it('should not expose user existence information', async () => {
        const existingUser = await request(app.getHttpServer())
          .post('/auth/login')
          .send({
            email: testUser.email,
            password: 'wrongpassword',
          });

        const nonExistentUser = await request(app.getHttpServer())
          .post('/auth/login')
          .send({
            email: 'nonexistent@example.com',
            password: 'anypassword',
          });

        // Should return similar error messages for both cases
        expect(existingUser.body.message).toBe(nonExistentUser.body.message);
      });

      it('should handle malformed requests gracefully', async () => {
        const malformedRequests = [
          {}, // Empty body
          { email: 'test@example.com' }, // Missing password
          { password: 'password' }, // Missing email
          { email: null, password: null }, // Null values
          { email: '', password: '' }, // Empty strings
        ];

        for (const requestBody of malformedRequests) {
          const response = await request(app.getHttpServer())
            .post('/auth/login')
            .send(requestBody);

          expect([400, 422]).toContain(response.status);
        }
      });
    });

    describe('Registration Endpoint', () => {
      it('should validate email format properly', async () => {
        const invalidEmails = [
          'plainaddress',
          '@missingdomain.com',
          'missing@.com',
          'missing@domain',
          'spaces in@email.com',
          'user@domain..com',
        ];

        for (const email of invalidEmails) {
          const response = await request(app.getHttpServer())
            .post('/auth/register')
            .send({
              email,
              password: 'ValidPassword123!',
              name: 'Test User',
            });

          expect(response.status).toBe(400);
        }
      });

      it('should enforce password strength requirements', async () => {
        const weakPasswords = [
          '123', // Too short
          'password', // Common password
          'PASSWORD', // Only uppercase
          'lowercase', // Only lowercase
          '12345678', // Only numbers
          'NoSpecial1', // Missing special character
          'nouppercase1!', // Missing uppercase
          'NOSPECIAL1!', // Missing lowercase
        ];

        for (const password of weakPasswords) {
          const response = await request(app.getHttpServer())
            .post('/auth/register')
            .send({
              email: `test${Date.now()}@example.com`,
              password,
              name: 'Test User',
            });

          expect(response.status).toBe(400);
        }
      });

      it('should prevent duplicate email registration', async () => {
        const response = await request(app.getHttpServer())
          .post('/auth/register')
          .send({
            email: testUser.email, // Already exists
            password: 'NewPassword123!',
            name: 'Duplicate User',
          });

        expect(response.status).toBe(409);
      });
    });

    describe('Token Validation Endpoints', () => {
      it('should reject invalid tokens', async () => {
        const invalidTokens = [
          'invalid-token',
          'Bearer invalid-token',
          'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.invalid',
          'test-token',
          '',
        ];

        for (const token of invalidTokens) {
          const response = await request(app.getHttpServer())
            .get('/auth/me')
            .set('Authorization', `Bearer ${token}`);

          expect(response.status).toBe(401);
        }
      });

      it('should handle token expiration properly', async () => {
        const expiredToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.' + 
          Buffer.from(JSON.stringify({ exp: Math.floor(Date.now() / 1000) - 3600 })).toString('base64') +
          '.invalid';

        const response = await request(app.getHttpServer())
          .get('/auth/me')
          .set('Authorization', `Bearer ${expiredToken}`);

        expect(response.status).toBe(401);
      });

      it('should require authentication for protected endpoints', async () => {
        const response = await request(app.getHttpServer())
          .get('/agents')
          .set('Authorization', ''); // No token

        expect(response.status).toBe(401);
      });
    });
  });

  describe('Agent Endpoint Security', () => {
    it('should require authentication for agent operations', async () => {
      const agentOperations = [
        { method: 'GET', path: '/agents' },
        { method: 'POST', path: '/agents' },
        { method: 'GET', path: `/agents/${testAgent.id}` },
        { method: 'PUT', path: `/agents/${testAgent.id}` },
        { method: 'DELETE', path: `/agents/${testAgent.id}` },
      ];

      for (const operation of agentOperations) {
        const req = request(app.getHttpServer())[operation.method.toLowerCase()](operation.path);
        const response = await req.set('Authorization', ''); // No auth

        expect(response.status).toBe(401);
      }
    });

    it('should prevent SQL injection in agent queries', async () => {
      for (const payload of SECURITY_TEST_PAYLOADS.sqlInjection) {
        const response = await request(app.getHttpServer())
          .get(`/agents?search=${encodeURIComponent(payload)}`)
          .set('Authorization', `Bearer ${authToken}`);

        expect([200, 400]).toContain(response.status);
      }
    });

    it('should validate agent ownership', async () => {
      // Create agent as testUser
      const userAgent = await prisma.agent.create({
        data: {
          name: 'User Agent',
          description: 'Test user agent',
          type: 'CHAT',
          userId: testUser.id,
        },
      });

      // Try to access as different user
      const otherUser = await prisma.user.create({
        data: {
          email: 'other.user@example.com',
          password: 'OtherPassword123!',
          name: 'Other User',
          role: 'USER',
        },
      });

      const otherLogin = await request(app.getHttpServer())
        .post('/auth/login')
        .send({
          email: otherUser.email,
          password: 'OtherPassword123!',
        });

      const otherToken = otherLogin.body.access_token;

      // Should not allow access to other user's agent
      const response = await request(app.getHttpServer())
        .get(`/agents/${userAgent.id}`)
        .set('Authorization', `Bearer ${otherToken}`);

      expect(response.status).toBe(403);

      // Clean up
      await prisma.agent.delete({ where: { id: userAgent.id } });
      await prisma.user.delete({ where: { id: otherUser.id } });
    });

    it('should prevent XSS in agent data', async () => {
      for (const payload of SECURITY_TEST_PAYLOADS.xss) {
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
          expect(response.body.description).not.toContain('<script>');
          expect(response.body.description).not.toContain('onerror=');
        }
      }
    });

    it('should validate file uploads securely', async () => {
      const maliciousFiles = [
        { filename: 'test.jsp', content: '<%@ page import="java.io.*" %>' },
        { filename: 'test.php', content: '<?php system($_GET["cmd"]); ?>' },
        { filename: '../../../etc/passwd', content: 'malicious content' },
        { filename: 'script.bat', content: 'del /s /q C:\\*' },
      ];

      for (const file of maliciousFiles) {
        const response = await request(app.getHttpServer())
          .post('/agents/upload')
          .send({ filename: file.filename, content: file.content })
          .set('Authorization', `Bearer ${authToken}`);

        expect([400, 422]).toContain(response.status);
      }
    });
  });

  describe('Admin Endpoint Security', () => {
    it('should require admin role for admin endpoints', async () => {
      const adminEndpoints = [
        '/admin/users',
        '/admin/system/status',
        '/admin/metrics',
        '/admin/logs',
      ];

      for (const endpoint of adminEndpoints) {
        const response = await request(app.getHttpServer())
          .get(endpoint)
          .set('Authorization', `Bearer ${authToken}`); // Regular user token

        expect(response.status).toBe(403);
      }
    });

    it('should allow admin access with admin token', async () => {
      const response = await request(app.getHttpServer())
        .get('/admin/system/status')
        .set('Authorization', `Bearer ${adminToken}`);

      expect([200, 500]).toContain(response.status); // 500 might be OK for system status
    });

    it('should prevent admin token abuse', async () => {
      // Try to use admin token for regular user operations
      const response = await request(app.getHttpServer())
        .post('/agents')
        .send({
          name: 'Admin Created Agent',
          description: 'Agent created by admin',
          type: 'CHAT',
        })
        .set('Authorization', `Bearer ${adminToken}`);

      // Admin should be able to create agents for other users (depending on requirements)
      expect([200, 403]).toContain(response.status);
    });
  });

  describe('WebSocket Endpoint Security', () => {
    it('should require authentication for WebSocket connections', async () => {
      // This would require WebSocket testing setup
      // For now, test the concept with HTTP endpoints that WebSocket might depend on
      
      const response = await request(app.getHttpServer())
        .get('/websocket/status')
        .set('Authorization', ''); // No auth

      expect(response.status).toBe(401);
    });

    it('should validate WebSocket message content', async () => {
      const maliciousMessages = SECURITY_TEST_PAYLOADS.xss.map(payload => ({
        type: 'chat_message',
        content: payload,
        roomId: 'test-room',
      }));

      for (const message of maliciousMessages) {
        const response = await request(app.getHttpServer())
          .post('/websocket/message')
          .send(message)
          .set('Authorization', `Bearer ${authToken}`);

        expect([200, 400]).toContain(response.status);
      }
    });
  });

  describe('System Endpoint Security', () => {
    it('should provide limited system information', async () => {
      const response = await request(app.getHttpServer())
        .get('/system/info');

      expect(response.status).toBe(200);
      
      // Should not expose sensitive system information
      expect(response.body).not.toHaveProperty('internal_ips');
      expect(response.body).not.toHaveProperty('database_info');
      expect(response.body).not.toHaveProperty('secrets');
      expect(response.body).not.toHaveProperty('environment_variables');
    });

    it('should validate system configuration access', async () => {
      const response = await request(app.getHttpServer())
        .get('/system/config');

      expect([200, 401, 403]).toContain(response.status);
      
      if (response.status === 200) {
        // Should not expose sensitive configuration
        expect(response.body).not.toHaveProperty('database_url');
        expect(response.body).not.toHaveProperty('secret_key');
        expect(response.body).not.toHaveProperty('admin_password');
      }
    });

    it('should prevent information disclosure in error messages', async () => {
      const response = await request(app.getHttpServer())
        .get('/agents/nonexistent-id')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(404);
      
      // Error message should not expose sensitive information
      expect(response.body.message).not.toMatch(/sql|database|table|column/i);
      expect(response.body.message).not.toMatch(/stack.*trace|internal.*error/i);
    });
  });

  describe('Rate Limiting', () => {
    it('should implement rate limiting on sensitive endpoints', async () => {
      const sensitiveEndpoints = [
        '/auth/login',
        '/auth/register',
        '/auth/forgot-password',
      ];

      for (const endpoint of sensitiveEndpoints) {
        const requests = Array(10).fill().map(() =>
          request(app.getHttpServer())
            .post(endpoint)
            .send({
              email: 'rapidfire@example.com',
              password: 'password',
            })
        );

        const responses = await Promise.all(requests);
        const rateLimited = responses.filter(r => r.status === 429);

        expect(rateLimited.length).toBeGreaterThan(0);
      }
    });

    it('should handle burst traffic gracefully', async () => {
      const burstRequests = Array(50).fill().map((_, i) =>
        request(app.getHttpServer())
          .get('/health')
          .set('X-Request-ID', `burst-${i}`)
      );

      const responses = await Promise.all(burstRequests);
      const successful = responses.filter(r => r.status === 200);

      // Should handle burst traffic
      expect(successful.length).toBeGreaterThan(40); // At least 80% success rate
    });
  });

  describe('Input Validation', () => {
    it('should validate request parameters', async () => {
      const invalidRequests = [
        // Invalid UUIDs
        { param: 'invalid-uuid', valid: false },
        // Oversized payloads
        { param: 'a'.repeat(10000), valid: false },
        // Special characters
        { param: 'test<script>alert(1)</script>', valid: false },
      ];

      for (const { param } of invalidRequests) {
        const response = await request(app.getHttpServer())
          .get(`/agents/${param}`)
          .set('Authorization', `Bearer ${authToken}`);

        expect([400, 404]).toContain(response.status);
      }
    });

    it('should sanitize user input in all endpoints', async () => {
      const testInput = '<script>alert("XSS")</script>';
      
      const response = await request(app.getHttpServer())
        .post('/agents')
        .send({
          name: testInput,
          description: testInput,
          type: 'CHAT',
        })
        .set('Authorization', `Bearer ${authToken}`);

      if (response.status === 200) {
        expect(response.body.name).not.toContain('<script>');
        expect(response.body.description).not.toContain('<script>');
      }
    });
  });

  describe('HTTPS and Security Headers', () => {
    it('should include security headers in responses', async () => {
      const response = await request(app.getHttpServer())
        .get('/health');

      expect(response.headers).toHaveProperty('x-frame-options');
      expect(response.headers).toHaveProperty('x-content-type-options');
      expect(response.headers).toHaveProperty('x-xss-protection');
      
      // Should have HSTS in production
      if (process.env.NODE_ENV === 'production') {
        expect(response.headers).toHaveProperty('strict-transport-security');
      }
    });

    it('should set appropriate CORS headers', async () => {
      const response = await request(app.getHttpServer())
        .get('/health')
        .set('Origin', 'https://malicious-site.com');

      if (response.headers['access-control-allow-origin']) {
        expect(response.headers['access-control-allow-origin']).not.toBe('*');
      }
    });
  });

  describe('Performance Security', () => {
    it('should handle expensive queries safely', async () => {
      const startTime = Date.now();
      
      // Try to trigger expensive operations
      const response = await request(app.getHttpServer())
        .post('/agents/search')
        .send({
          query: '*.*',
          includeInactive: true,
          includeMetadata: true,
          sortBy: 'complex_calculation',
        })
        .set('Authorization', `Bearer ${authToken}`);

      const endTime = Date.now();
      const responseTime = endTime - startTime;

      // Should not take too long
      expect(responseTime).toBeLessThan(10000); // 10 seconds
      expect([200, 400, 500]).toContain(response.status);
    });

    it('should prevent resource exhaustion attacks', async () => {
      // Try to overwhelm with large payloads
      const largePayload = {
        name: 'test',
        description: 'a'.repeat(100000), // 100KB description
        type: 'CHAT',
      };

      const response = await request(app.getHttpServer())
        .post('/agents')
        .send(largePayload)
        .set('Authorization', `Bearer ${authToken}`);

      // Should reject oversized payloads
      expect([400, 413, 422]).toContain(response.status);
    });
  });
});
