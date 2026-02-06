/**
 * Agent Endpoint Security Tests
 * Focused testing of agent-related API endpoints for security vulnerabilities
 */

import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { DatabaseService } from '../../src/db/db.service';
import { AppModule } from '../../src/app.module';

// Agent-specific security test cases
const AGENT_SECURITY_TESTS = {
  maliciousInputs: {
    name: [
      '<script>alert("XSS")</script>',
      "'; DROP TABLE agents; --",
      '../../../etc/passwd',
      'admin<script>alert(1)</script>',
      'A'.repeat(1000), // Oversized
    ],
    description: [
      '<img src="x" onerror="alert(1)">',
      'javascript:alert("XSS")',
      ' UNION SELECT * FROM users--',
      '<svg onload="alert(1)">',
    ],
    type: [
      'INVALID_TYPE',
      '<script>alert(1)</script>',
      '../../../system',
      '"; DROP TABLE agents; --',
    ],
    config: [
      '{"$ne": null}', // NoSQL injection
      '<script>alert(1)</script>',
      '{"__proto__": {"admin": true}}',
    ],
  },
  authorizationTests: [
    'access_other_user_agent',
    'admin_privilege_escalation',
    'cross_user_operations',
  ],
  dataExposure: [
    'sensitive_metadata_access',
    'internal_config_exposure',
    'user_data_leakage',
  ],
};

describe('Agent Endpoint Security Tests', () => {
  let app: INestApplication;
  let db: DatabaseService;
  let user1Token: string;
  let user2Token: string;
  let adminToken: string;
  let user1: any;
  let user2: any;
  let admin: any;
  let user1Agent: any;
  let user2Agent: any;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleRef.createNestApplication();
    await app.init();

    db = moduleRef.get<DatabaseService>(DatabaseService);

    // Setup test users
    user1 = await db.user.create({
      data: {
        email: 'agent.user1@example.com',
        password: 'User1Password123!',
        name: 'Agent Test User 1',
        role: 'USER',
      },
    });

    user2 = await db.user.create({
      data: {
        email: 'agent.user2@example.com',
        password: 'User2Password123!',
        name: 'Agent Test User 2',
        role: 'USER',
      },
    });

    admin = await db.user.create({
      data: {
        email: 'agent.admin@example.com',
        password: 'AdminPassword123!',
        name: 'Agent Test Admin',
        role: 'ADMIN',
      },
    });

    // Setup authentication
    const user1Login = await request(app.getHttpServer())
      .post('/auth/login')
      .send({
        email: user1.email,
        password: 'User1Password123!',
      });

    user1Token = user1Login.body.access_token;

    const user2Login = await request(app.getHttpServer())
      .post('/auth/login')
      .send({
        email: user2.email,
        password: 'User2Password123!',
      });

    user2Token = user2Login.body.access_token;

    const adminLogin = await request(app.getHttpServer())
      .post('/auth/login')
      .send({
        email: admin.email,
        password: 'AdminPassword123!',
      });

    adminToken = adminLogin.body.access_token;

    // Setup test agents
    user1Agent = await db.agent.create({
      data: {
        name: 'User1 Agent',
        description: 'Agent owned by user1',
        type: 'CHAT',
        userId: user1.id,
        config: { setting1: 'value1' },
      },
    });

    user2Agent = await db.agent.create({
      data: {
        name: 'User2 Agent',
        description: 'Agent owned by user2',
        type: 'WORKFLOW',
        userId: user2.id,
        config: { setting2: 'value2' },
      },
    });
  });

  afterAll(async () => {
    await db.agent.deleteMany({
      where: { 
        OR: [
          { userId: user1.id },
          { userId: user2.id },
          { userId: admin.id },
        ],
      },
    });
    await db.user.deleteMany({
      where: {
        OR: [
          { id: user1.id },
          { id: user2.id },
          { id: admin.id },
        ],
      },
    });
    await app.close();
  });

  describe('Agent CRUD Operation Security', () => {
    describe('Agent Creation Security', () => {
      it('should prevent XSS in agent name', async () => {
        for (const maliciousName of AGENT_SECURITY_TESTS.maliciousInputs.name) {
          const response = await request(app.getHttpServer())
            .post('/agents')
            .send({
              name: maliciousName,
              description: 'Test description',
              type: 'CHAT',
            })
            .set('Authorization', `Bearer ${user1Token}`);

          expect([200, 400]).toContain(response.status);
          
          if (response.status === 200) {
            expect(response.body.name).not.toContain('<script>');
            expect(response.body.name).not.toContain('javascript:');
          }
        }
      });

      it('should prevent XSS in agent description', async () => {
        for (const maliciousDesc of AGENT_SECURITY_TESTS.maliciousInputs.description) {
          const response = await request(app.getHttpServer())
            .post('/agents')
            .send({
              name: 'Test Agent',
              description: maliciousDesc,
              type: 'CHAT',
            })
            .set('Authorization', `Bearer ${user1Token}`);

          expect([200, 400]).toContain(response.status);
          
          if (response.status === 200) {
            expect(response.body.description).not.toContain('<script>');
            expect(response.body.description).not.toContain('onerror=');
          }
        }
      });

      it('should validate agent type securely', async () => {
        for (const maliciousType of AGENT_SECURITY_TESTS.maliciousInputs.type) {
          const response = await request(app.getHttpServer())
            .post('/agents')
            .send({
              name: 'Test Agent',
              description: 'Test description',
              type: maliciousType,
            })
            .set('Authorization', `Bearer ${user1Token}`);

          expect(response.status).toBe(400);
          expect(response.body.message).toMatch(/validation|invalid|type/i);
        }
      });

      it('should sanitize agent configuration', async () => {
        for (const maliciousConfig of AGENT_SECURITY_TESTS.maliciousInputs.config) {
          const response = await request(app.getHttpServer())
            .post('/agents')
            .send({
              name: 'Test Agent',
              description: 'Test description',
              type: 'CHAT',
              config: typeof maliciousConfig === 'string' ? JSON.parse(maliciousConfig) : maliciousConfig,
            })
            .set('Authorization', `Bearer ${user1Token}`);

          expect([200, 400]).toContain(response.status);
          
          if (response.status === 200 && response.body.config) {
            const configStr = JSON.stringify(response.body.config);
            expect(configStr).not.toContain('<script>');
            expect(configStr).not.toContain('__proto__');
          }
        }
      });

      it('should prevent oversized agent creation', async () => {
        const oversizedData = {
          name: 'a'.repeat(1000),
          description: 'b'.repeat(5000),
          type: 'CHAT',
          config: { data: 'c'.repeat(10000) },
        };

        const response = await request(app.getHttpServer())
          .post('/agents')
          .send(oversizedData)
          .set('Authorization', `Bearer ${user1Token}`);

        expect([400, 413, 422]).toContain(response.status);
      });
    });

    describe('Agent Read Security', () => {
      it('should prevent unauthorized agent access', async () => {
        // User1 should not access User2's agent
        const response = await request(app.getHttpServer())
          .get(`/agents/${user2Agent.id}`)
          .set('Authorization', `Bearer ${user1Token}`);

        expect(response.status).toBe(403);
      });

      it('should allow access to own agents', async () => {
        const response = await request(app.getHttpServer())
          .get(`/agents/${user1Agent.id}`)
          .set('Authorization', `Bearer ${user1Token}`);

        expect(response.status).toBe(200);
        expect(response.body.id).toBe(user1Agent.id);
      });

      it('should allow admin access to all agents', async () => {
        const response1 = await request(app.getHttpServer())
          .get(`/agents/${user1Agent.id}`)
          .set('Authorization', `Bearer ${adminToken}`);

        const response2 = await request(app.getHttpServer())
          .get(`/agents/${user2Agent.id}`)
          .set('Authorization', `Bearer ${adminToken}`);

        expect(response1.status).toBe(200);
        expect(response2.status).toBe(200);
      });

      it('should prevent information disclosure in agent details', async () => {
        const response = await request(app.getHttpServer())
          .get(`/agents/${user1Agent.id}`)
          .set('Authorization', `Bearer ${user1Token}`);

        expect(response.status).toBe(200);
        
        // Should not expose sensitive internal data
        expect(response.body).not.toHaveProperty('internal_id');
        expect(response.body).not.toHaveProperty('secrets');
        expect(response.body).not.toHaveProperty('password');
        expect(response.body).not.toHaveProperty('private_config');
      });

      it('should prevent SQL injection in agent ID parameter', async () => {
        const maliciousIds = [
          "1' OR '1'='1",
          '1; DROP TABLE agents; --',
          '../../../etc/passwd',
        ];

        for (const maliciousId of maliciousIds) {
          const response = await request(app.getHttpServer())
            .get(`/agents/${maliciousId}`)
            .set('Authorization', `Bearer ${user1Token}`);

          expect([400, 404]).toContain(response.status);
        }
      });
    });

    describe('Agent Update Security', () => {
      it('should prevent unauthorized agent updates', async () => {
        const updateData = {
          name: 'Updated Agent Name',
          description: 'Updated description',
        };

        // User1 should not update User2's agent
        const response = await request(app.getHttpServer())
          .put(`/agents/${user2Agent.id}`)
          .send(updateData)
          .set('Authorization', `Bearer ${user1Token}`);

        expect(response.status).toBe(403);
      });

      it('should allow users to update their own agents', async () => {
        const updateData = {
          name: 'Updated User1 Agent',
          description: 'Updated description by owner',
        };

        const response = await request(app.getHttpServer())
          .put(`/agents/${user1Agent.id}`)
          .send(updateData)
          .set('Authorization', `Bearer ${user1Token}`);

        expect(response.status).toBe(200);
        expect(response.body.name).toBe(updateData.name);
      });

      it('should prevent XSS in agent updates', async () => {
        const xssData = {
          name: '<script>alert("XSS")</script>',
          description: '<img src="x" onerror="alert(1)">',
        };

        const response = await request(app.getHttpServer())
          .put(`/agents/${user1Agent.id}`)
          .send(xssData)
          .set('Authorization', `Bearer ${user1Token}`);

        expect([200, 400]).toContain(response.status);
        
        if (response.status === 200) {
          expect(response.body.name).not.toContain('<script>');
          expect(response.body.description).not.toContain('onerror=');
        }
      });
    });

    describe('Agent Deletion Security', () => {
      it('should prevent unauthorized agent deletion', async () => {
        // User1 should not delete User2's agent
        const response = await request(app.getHttpServer())
          .delete(`/agents/${user2Agent.id}`)
          .set('Authorization', `Bearer ${user1Token}`);

        expect(response.status).toBe(403);
      });

      it('should allow users to delete their own agents', async () => {
        const newAgent = await db.agent.create({
          data: {
            name: 'Agent to Delete',
            description: 'This agent will be deleted',
            type: 'CHAT',
            userId: user1.id,
          },
        });

        const response = await request(app.getHttpServer())
          .delete(`/agents/${newAgent.id}`)
          .set('Authorization', `Bearer ${user1Token}`);

        expect(response.status).toBe(200);

        // Verify agent was actually deleted
        const getResponse = await request(app.getHttpServer())
          .get(`/agents/${newAgent.id}`)
          .set('Authorization', `Bearer ${user1Token}`);

        expect(getResponse.status).toBe(404);
      });

      it('should allow admin to delete any agent', async () => {
        const newAgent = await db.agent.create({
          data: {
            name: 'Agent for Admin Deletion',
            description: 'This agent will be deleted by admin',
            type: 'WORKFLOW',
            userId: user1.id,
          },
        });

        const response = await request(app.getHttpServer())
          .delete(`/agents/${newAgent.id}`)
          .set('Authorization', `Bearer ${adminToken}`);

        expect(response.status).toBe(200);
      });
    });
  });

  describe('Agent Search Security', () => {
    it('should prevent SQL injection in search queries', async () => {
      const maliciousQueries = [
        "'; DROP TABLE agents; --",
        "admin' OR '1'='1",
        'UNION SELECT * FROM users--',
      ];

      for (const query of maliciousQueries) {
        const response = await request(app.getHttpServer())
          .post('/agents/search')
          .send({
            query,
            filters: {},
          })
          .set('Authorization', `Bearer ${user1Token}`);

        expect([200, 400]).toContain(response.status);
        
        if (response.status === 200) {
          expect(response.body).not.toMatch(/error|exception|sql/i);
        }
      }
    });

    it('should prevent XSS in search results', async () => {
      // First create an agent with XSS in description
      const maliciousAgent = await db.agent.create({
        data: {
          name: 'XSS Agent',
          description: '<script>alert("XSS")</script>',
          type: 'CHAT',
          userId: user1.id,
        },
      });

      const response = await request(app.getHttpServer())
        .post('/agents/search')
        .send({
          query: 'XSS',
          filters: {},
        })
        .set('Authorization', `Bearer ${user1Token}`);

      expect([200, 400]).toContain(response.status);
      
      if (response.status === 200 && response.body.results) {
        response.body.results.forEach((agent: any) => {
          expect(agent.description || '').not.toContain('<script>');
        });
      }

      // Clean up
      await db.agent.delete({ where: { id: maliciousAgent.id } });
    });

    it('should implement search result authorization', async () => {
      // User1 searches for agents
      const response = await request(app.getHttpServer())
        .post('/agents/search')
        .send({
          query: 'Agent',
          filters: {},
        })
        .set('Authorization', `Bearer ${user1Token}`);

      expect(response.status).toBe(200);
      
      if (response.body.results) {
        // User1 should only see their own agents and public ones
        const visibleAgentIds = response.body.results.map((agent: any) => agent.id);
        expect(visibleAgentIds).toContain(user1Agent.id);
        expect(visibleAgentIds).not.toContain(user2Agent.id);
      }
    });
  });

  describe('Agent File Upload Security', () => {
    it('should validate file types securely', async () => {
      const maliciousFiles = [
        { name: 'malicious.php', type: 'application/x-php' },
        { name: 'script.jsp', type: 'application/x-jsp' },
        { name: 'script.asp', type: 'application/x-asp' },
        { name: 'executable.exe', type: 'application/x-executable' },
        { name: 'script.bat', type: 'application/x-msdos-program' },
      ];

      for (const file of maliciousFiles) {
        const response = await request(app.getHttpServer())
          .post('/agents/upload')
          .send({
            agentId: user1Agent.id,
            filename: file.name,
            content: 'malicious content',
            contentType: file.type,
          })
          .set('Authorization', `Bearer ${user1Token}`);

        expect([400, 422]).toContain(response.status);
      }
    });

    it('should prevent path traversal in file uploads', async () => {
      const pathTraversalNames = [
        '../../../etc/passwd',
        '..\\..\\..\\windows\\system32\\config\\sam',
        '%2e%2e%2f%2e%2e%2f%2e%2e%2fetc%2fpasswd',
        '....//....//....//etc/passwd',
      ];

      for (const filename of pathTraversalNames) {
        const response = await request(app.getHttpServer())
          .post('/agents/upload')
          .send({
            agentId: user1Agent.id,
            filename,
            content: 'file content',
            contentType: 'text/plain',
          })
          .set('Authorization', `Bearer ${user1Token}`);

        expect(response.status).toBe(400);
      }
    });

    it('should limit file sizes appropriately', async () => {
      const largeFileContent = 'a'.repeat(10 * 1024 * 1024); // 10MB

      const response = await request(app.getHttpServer())
        .post('/agents/upload')
        .send({
          agentId: user1Agent.id,
          filename: 'large-file.txt',
          content: largeFileContent,
          contentType: 'text/plain',
        })
        .set('Authorization', `Bearer ${user1Token}`);

      expect([400, 413]).toContain(response.status); // Payload too large
    });
  });

  describe('Agent Operation Security', () => {
    it('should validate agent start/stop operations', async () => {
      // Test starting someone else's agent
      const response = await request(app.getHttpServer())
        .post(`/agents/${user2Agent.id}/start`)
        .set('Authorization', `Bearer ${user1Token}`);

      expect(response.status).toBe(403);
    });

    it('should prevent agent privilege escalation', async () => {
      const response = await request(app.getHttpServer())
        .post('/agents')
        .send({
          name: 'Privilege Escalation Test',
          description: 'Testing privilege escalation',
          type: 'ADMIN', // Non-existent type
          userId: admin.id, // Trying to create for admin
        })
        .set('Authorization', `Bearer ${user1Token}`);

      expect(response.status).toBe(400);
    });
  });

  describe('Agent Listing Security', () => {
    it('should implement proper pagination security', async () => {
      // Test negative or invalid pagination parameters
      const invalidPagination = [
        { limit: -1, offset: 0 },
        { limit: 1000000, offset: 0 },
        { limit: 0, offset: 0 },
        { limit: 10, offset: -1 },
      ];

      for (const params of invalidPagination) {
        const response = await request(app.getHttpServer())
          .get('/agents')
          .query(params)
          .set('Authorization', `Bearer ${user1Token}`);

        expect([400, 422]).toContain(response.status);
      }
    });

    it('should limit data exposure in agent lists', async () => {
      const response = await request(app.getHttpServer())
        .get('/agents')
        .set('Authorization', `Bearer ${user1Token}`);

      expect(response.status).toBe(200);
      
      if (response.body) {
        const agents = Array.isArray(response.body) ? response.body : response.body.data || [];
        
        agents.forEach((agent: any) => {
          // Should not expose sensitive data in lists
          expect(agent).not.toHaveProperty('internal_config');
          expect(agent).not.toHaveProperty('secrets');
          expect(agent).not.toHaveProperty('private_metadata');
        });
      }
    });
  });

  describe('Agent Configuration Security', () => {
    it('should validate configuration data', async () => {
      const maliciousConfigs = [
        { config: { __proto__: { admin: true } } },
        { config: { $ne: null } },
        { config: { $where: 'this.password' } },
        { config: { function: 'alert(1)' } },
      ];

      for (const maliciousConfig of maliciousConfigs) {
        const response = await request(app.getHttpServer())
          .post('/agents')
          .send({
            name: 'Config Test Agent',
            description: 'Testing configuration security',
            type: 'CHAT',
            ...maliciousConfig,
          })
          .set('Authorization', `Bearer ${user1Token}`);

        expect([200, 400]).toContain(response.status);
      }
    });

    it('should sanitize configuration values', async () => {
      const response = await request(app.getHttpServer())
        .post('/agents')
        .send({
          name: 'Sanitization Test Agent',
          description: 'Testing configuration sanitization',
          type: 'CHAT',
          config: {
            description: '<script>alert("XSS")</script>',
            command: '; DROP TABLE users; --',
          },
        })
        .set('Authorization', `Bearer ${user1Token}`);

      expect([200, 400]).toContain(response.status);
      
      if (response.status === 200 && response.body.config) {
        const configStr = JSON.stringify(response.body.config);
        expect(configStr).not.toContain('<script>');
        expect(configStr).not.toContain('DROP TABLE');
      }
    });
  });

  describe('Agent Performance and DoS Protection', () => {
    it('should handle expensive operations safely', async () => {
      const startTime = Date.now();
      
      // Try to trigger expensive search
      const response = await request(app.getHttpServer())
        .post('/agents/search')
        .send({
          query: '*.*',
          filters: {
            complex_filter: true,
            nested: {
              deep: {
                filter: 'value',
              },
            },
          },
          sortBy: 'complex_calculation',
        })
        .set('Authorization', `Bearer ${user1Token}`);

      const endTime = Date.now();
      const responseTime = endTime - startTime;

      // Should complete within reasonable time
      expect(responseTime).toBeLessThan(5000);
      expect([200, 400, 500]).toContain(response.status);
    });

    it('should prevent resource exhaustion through large payloads', async () => {
      const largePayload = {
        name: 'Large Payload Test',
        description: 'a'.repeat(100000), // 100KB
        type: 'CHAT',
        config: {
          data: Array(1000).fill().map((_, i) => ({
            key: `key${i}`,
            value: 'x'.repeat(1000),
          })),
        },
      };

      const response = await request(app.getHttpServer())
        .post('/agents')
        .send(largePayload)
        .set('Authorization', `Bearer ${user1Token}`);

      expect([400, 413, 422]).toContain(response.status);
    });
  });

  describe('Agent Audit and Monitoring', () => {
    it('should log security-relevant events', async () => {
      // Attempt unauthorized access
      await request(app.getHttpServer())
        .get(`/agents/${user2Agent.id}`)
        .set('Authorization', `Bearer ${user1Token}`);

      // Attempt malicious input
      await request(app.getHttpServer())
        .post('/agents')
        .send({
          name: '<script>alert("XSS")</script>',
          description: 'XSS test',
          type: 'CHAT',
        })
        .set('Authorization', `Bearer ${user1Token}`);

      // These requests should be logged (implementation depends on logging system)
      // The actual verification would depend on the specific logging implementation
    });
  });
});
