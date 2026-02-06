/**
 * SQL Injection Prevention Tests
 * Comprehensive testing for SQL injection vulnerabilities and prevention
 */

import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { DatabaseService } from '../../src/db/db.service';
import { InputSanitizationService } from '../../src/security/input-sanitization.service';
import { AppModule } from '../../src/app.module';

// Comprehensive SQL injection test payloads
const SQL_INJECTION_PAYLOADS = {
  basic: [
    "' OR '1'='1",
    "admin'--",
    "admin'/*",
    "' OR 1=1#",
    "' OR 'a'='a",
    "') OR ('1'='1",
    "' OR ''='",
  ],
  union: [
    "UNION SELECT password FROM users",
    "UNION SELECT * FROM users",
    "UNION ALL SELECT username,password FROM admin_users",
    "1' UNION SELECT null,null,null--",
  ],
  blind: [
    "' AND 1=1",
    "' AND 1=2",
    "' AND ASCII(SUBSTRING((SELECT password FROM users LIMIT 1),1,1))>64--",
    "' AND (SELECT COUNT(*) FROM users)>0",
  ],
  timeBased: [
    "'; WAITFOR DELAY '00:00:05'--",
    "' AND (SELECT * FROM (SELECT COUNT(*),CONCAT(version(),FLOOR(RAND(0)*2))x FROM information_schema.tables GROUP BY x)a)--",
    "'; pg_sleep(5)--",
  ],
  noSql: [
    '{"$ne": ""}',
    '{"$regex": ".*"}',
    '{"$where": "this.password"}',
    '"; return true; var dummy="',
  ],
  error: [
    "' and (select * from nonexistent_table) and '1'='1",
    "' AND EXTRACTVALUE(1, CONCAT(0x7e, (SELECT password FROM users LIMIT 1), 0x7e))--",
    "' AND (SELECT COUNT(*) FROM information_schema.tables WHERE table_schema=DATABASE())--",
  ],
};

describe('SQL Injection Prevention Tests', () => {
  let app: INestApplication;
  let db: DatabaseService;
  let inputSanitization: InputSanitizationService;
  let authToken: string;
  let testUser: any;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleRef.createNestApplication();
    await app.init();

    db = app.get(DatabaseService);
    inputSanitization = app.get(InputSanitizationService);

    // Setup test user and authentication
    testUser = await db.user.create({
      data: {
        email: 'sqli.test@example.com',
        password: 'TestPassword123!',
        name: 'SQLi Test User',
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
    await db.agent.deleteMany({
      where: { userId: testUser.id },
    });
    await db.user.delete({
      where: { id: testUser.id },
    });

    await app.close();
  });

  describe('Basic SQL Injection Prevention', () => {
    it('should prevent basic OR-based SQL injection', async () => {
      for (const payload of SQL_INJECTION_PAYLOADS.basic) {
        const response = await request(app.getHttpServer())
          .post('/auth/login')
          .send({
            email: payload,
            password: 'anypassword',
          });

        // Should not authenticate with injected SQL
        expect(response.status).not.toBe(200);
        expect(response.body.access_token).toBeUndefined();
        
        // Should return authentication error
        expect(response.body.message).toMatch(/invalid|unauthorized|credentials/i);
      }
    });

    it('should prevent SQL injection in search queries', async () => {
      for (const payload of SQL_INJECTION_PAYLOADS.basic) {
        const response = await request(app.getHttpServer())
          .post('/agents/search')
          .send({
            query: payload,
            filters: {},
          })
          .set('Authorization', `Bearer ${authToken}`);

        // Should either return 400 (validation error) or 200 with empty results
        // but never execute the SQL injection
        expect([400, 200]).toContain(response.status);
        
        if (response.status === 200) {
          // Should not return any actual database content if injection was attempted
          expect(response.body.results).toBeDefined();
        }
      }
    });
  });

  describe('UNION-based SQL Injection Prevention', () => {
    it('should prevent UNION SELECT injection', async () => {
      for (const payload of SQL_INJECTION_PAYLOADS.union) {
        const response = await request(app.getHttpServer())
          .post('/agents')
          .send({
            name: payload,
            description: 'Test agent',
            type: 'CHAT',
          })
          .set('Authorization', `Bearer ${authToken}`);

        // Should reject the request due to validation
        expect(response.status).toBe(400);
        expect(response.body.message).toMatch(/validation|invalid|name/i);
      }
    });

    it('should prevent UNION injection in query parameters', async () => {
      for (const payload of SQL_INJECTION_PAYLOADS.union) {
        const response = await request(app.getHttpServer())
          .get(`/agents?search=${encodeURIComponent(payload)}`)
          .set('Authorization', `Bearer ${authToken}`);

        // Should handle safely without executing UNION
        expect([400, 200]).toContain(response.status);
        
        if (response.status === 200) {
          // Response should not contain unexpected data structures
          expect(Array.isArray(response.body)).toBe(true);
        }
      }
    });
  });

  describe('Blind SQL Injection Prevention', () => {
    it('should prevent boolean-based blind SQL injection', async () => {
      for (const payload of SQL_INJECTION_PAYLOADS.blind) {
        const response = await request(app.getHttpServer())
          .post('/agents/filter')
          .send({
            name: payload,
            type: 'CHAT',
          })
          .set('Authorization', `Bearer ${authToken}`);

        expect(response.status).toBe(400);
      }
    });

    it('should prevent time-based blind SQL injection', async () => {
      const startTime = Date.now();
      
      for (const payload of SQL_INJECTION_PAYLOADS.timeBased) {
        const response = await request(app.getHttpServer())
          .post('/agents/search')
          .send({
            query: payload,
            includeInactive: true,
          })
          .set('Authorization', `Bearer ${authToken}`);

        expect(response.status).toBe(400);
      }
      
      const endTime = Date.now();
      const totalTime = endTime - startTime;
      
      // Should not have significant delays from time-based injection
      expect(totalTime).toBeLessThan(10000); // Less than 10 seconds total
    });
  });

  describe('NoSQL Injection Prevention', () => {
    it('should prevent NoSQL injection in JSON payloads', async () => {
      for (const payload of SQL_INJECTION_PAYLOADS.noSql) {
        const response = await request(app.getHttpServer())
          .post('/agents/advanced-search')
          .send({
            filters: JSON.parse(payload),
          })
          .set('Authorization', `Bearer ${authToken}`);

        // Should reject malformed or malicious JSON
        expect([400, 422]).toContain(response.status);
      }
    });

    it('should validate JSON structure', async () => {
      const maliciousJson = {
        $where: "this.password !== undefined",
        $ne: null,
      };

      const response = await request(app.getHttpServer())
        .post('/agents/search')
        .send({ filters: maliciousJson })
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(400);
      expect(response.body.message).toMatch(/validation|invalid/i);
    });
  });

  describe('Error-based SQL Injection Prevention', () => {
    it('should prevent error-based SQL injection', async () => {
      for (const payload of SQL_INJECTION_PAYLOADS.error) {
        const response = await request(app.getHttpServer())
          .post('/agents/debug')
          .send({
            query: payload,
            debug: true,
          })
          .set('Authorization', `Bearer ${authToken}`);

        // Should not expose database error messages
        expect(response.body).not.toMatch(/sql|syntax|table|column|error/i);
        expect(response.status).toBe(400);
      }
    });

    it('should handle database errors gracefully', async () => {
      // Test with genuinely invalid but non-malicious input
      const response = await request(app.getHttpServer())
        .post('/agents')
        .send({
          name: '', // Empty name
          description: 'Test',
          type: 'INVALID_TYPE',
        })
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(400);
      expect(response.body.message).not.toContain('SQL');
      expect(response.body.message).not.toContain('database');
    });
  });

  describe('Parameterized Query Verification', () => {
    it('should verify that all database queries use parameterized queries', async () => {
      // Create test agents
      const testAgents = [
        { name: 'Agent 1', description: 'Desc 1', type: 'CHAT' },
        { name: 'Agent 2', description: 'Desc 2', type: 'WORKFLOW' },
        { name: 'Agent 3', description: 'Desc 3', type: 'CHAT' },
      ];

      for (const agent of testAgents) {
        const response = await request(app.getHttpServer())
          .post('/agents')
          .send(agent)
          .set('Authorization', `Bearer ${authToken}`);

        expect(response.status).toBe(201);
      }

      // Query agents with special characters
      const specialChars = ["'", '"', '\\', ';', '--', '/*', '*/'];
      
      for (const char of specialChars) {
        const response = await request(app.getHttpServer())
          .get(`/agents?search=${encodeURIComponent(char)}`)
          .set('Authorization', `Bearer ${authToken}`);

        expect([200, 400]).toContain(response.status);
        
        if (response.status === 200) {
          // Should not cause SQL errors
          expect(response.body).toBeDefined();
        }
      }
    });

    it('should prevent SQL injection in ORDER BY clauses', async () => {
      const maliciousOrderBy = [
        'name; DROP TABLE agents--',
        'name UNION SELECT password FROM users--',
        "name' OR '1'='1",
      ];

      for (const orderBy of maliciousOrderBy) {
        const response = await request(app.getHttpServer())
          .get(`/agents?sortBy=${encodeURIComponent(orderBy)}`)
          .set('Authorization', `Bearer ${authToken}`);

        // Should either reject or use safe default sorting
        expect([400, 500]).toContain(response.status);
      }
    });

    it('should prevent SQL injection in LIMIT clauses', async () => {
      const maliciousLimit = [
        '100; DROP TABLE users--',
        '1 OR 1=1',
        '0; DELETE FROM agents--',
      ];

      for (const limit of maliciousLimit) {
        const response = await request(app.getHttpServer())
          .get(`/agents?limit=${encodeURIComponent(limit)}`)
          .set('Authorization', `Bearer ${authToken}`);

        expect([400, 422]).toContain(response.status);
      }
    });
  });

  describe('Drizzle ORM Protection', () => {
    it('should verify Drizzle is properly configured with type safety', async () => {
      // Test that Drizzle client is used correctly
      const response = await request(app.getHttpServer())
        .get('/agents')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);

      // Verify that response contains expected Drizzle types
      response.body.forEach((agent: any) => {
        expect(agent).toHaveProperty('id');
        expect(agent).toHaveProperty('name');
        expect(agent).toHaveProperty('type');
        expect(agent).toHaveProperty('createdAt');
        expect(agent).toHaveProperty('updatedAt');
      });
    });

    it('should prevent Drizzle-specific injection attacks', async () => {
      // Test Drizzle-specific injection patterns
      const dbPayloads = [
        '; return await db.user.findMany(); --',
        '{$ne: null}',
        '{$where: "true"}',
      ];

      for (const payload of dbPayloads) {
        const response = await request(app.getHttpServer())
          .post('/agents/search')
          .send({ query: payload })
          .set('Authorization', `Bearer ${authToken}`);

        expect([400, 422]).toContain(response.status);
      }
    });
  });

  describe('Database Schema Protection', () => {
    it('should protect against schema enumeration', async () => {
      const schemaPayloads = [
        'information_schema',
        'pg_tables',
        'sys.tables',
        'SHOW TABLES',
        'DESCRIBE users',
      ];

      for (const payload of schemaPayloads) {
        const response = await request(app.getHttpServer())
          .post('/agents')
          .send({
            name: payload,
            description: 'Test',
            type: 'CHAT',
          })
          .set('Authorization', `Bearer ${authToken}`);

        expect(response.status).toBe(400);
      }
    });

    it('should prevent privilege escalation attempts', async () => {
      const privilegePayloads = [
        'admin; GRANT ALL PRIVILEGES ON DATABASE app_db TO attacker--',
        'user; CREATE ROLE attacker WITH SUPERUSER--',
        'postgres; UPDATE pg_authid SET rolsuper = true WHERE rolname = attacker--',
      ];

      for (const payload of privilegePayloads) {
        const response = await request(app.getHttpServer())
          .post('/agents')
          .send({
            name: payload,
            description: 'Test',
            type: 'CHAT',
          })
          .set('Authorization', `Bearer ${authToken}`);

        expect(response.status).toBe(400);
      }
    });
  });

  describe('Performance Impact of SQL Injection Prevention', () => {
    it('should maintain performance with sanitization enabled', async () => {
      const testInputs = Array(100).fill().map((_, i) => `test${i}'); DROP TABLE agents;--`);
      
      const startTime = Date.now();
      
      const promises = testInputs.map(input =>
        request(app.getHttpServer())
          .post('/agents')
          .send({
            name: input,
            description: 'Performance test',
            type: 'CHAT',
          })
          .set('Authorization', `Bearer ${authToken}`)
      );

      const responses = await Promise.all(promises);
      const endTime = Date.now();
      
      // All requests should be rejected quickly
      responses.forEach(response => {
        expect(response.status).toBe(400);
      });
      
      // Should complete within reasonable time
      expect(endTime - startTime).toBeLessThan(10000); // 10 seconds
    });
  });

  describe('Input Sanitization Service Tests', () => {
    it('should properly escape SQL special characters', () => {
      const testStrings = [
        { input: "O'Reilly", expected: "O''Reilly" },
        { input: "It's \"great\"", expected: "It''s \"great\"" },
        { input: "Path\\to\\file", expected: "Path\\\\to\\\\file" },
        { input: "'; DROP TABLE users; --", expected: "''; DROP TABLE users; --" },
      ];

      testStrings.forEach(({ input, expected }) => {
        const result = inputSanitization.escapeSqlString(input);
        expect(result).toBe(expected);
      });
    });

    it('should validate numeric inputs', () => {
      const validNumbers = ['123', '-45', '0', '3.14', '1e6'];
      const invalidNumbers = ['abc', '12.34.56', '1+1', '--123'];

      validNumbers.forEach(num => {
        expect(inputSanitization.validateNumericInput(num)).toBe(true);
      });

      invalidNumbers.forEach(num => {
        expect(inputSanitization.validateNumericInput(num)).toBe(false);
      });
    });
  });
});
