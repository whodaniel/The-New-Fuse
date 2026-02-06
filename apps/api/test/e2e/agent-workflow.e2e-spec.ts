import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import * as request from 'supertest';
import { AppModule } from '../../src/app.module';
import { DatabaseService } from '../../src/db/db.service';
import { setupApp } from '../../src/setup';
import { createTestAgent, createTestUser } from '../utils/test-helpers';

describe('Agent Workflow (e2e)', () => {
  let app: INestApplication;
  let db: DatabaseService;
  let authToken: string;
  let testAgent: any;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleRef.createNestApplication();
    setupApp(app);
    await app.init();

    db = app.get(DatabaseService);

    // Setup test data
    const user = await createTestUser(db);
    const loginResponse = await request(app.getHttpServer()).post('/auth/login').send({
      email: user.email,
      password: 'testpassword',
    });

    authToken = loginResponse.body.access_token;
    testAgent = await createTestAgent(db, user.id);
  });

  afterAll(async () => {
    await db.cleanDatabase();
    await app.close();
  });

  describe('Agent Communication Flow', () => {
    it('should create a new conversation', async () => {
      const response = await request(app.getHttpServer())
        .post('/conversations')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          agentId: testAgent.id,
          message: 'Hello, agent!',
        });

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('id');
      expect(response.body.messages).toHaveLength(1);
    });

    it('should process agent response', async () => {
      const conversation = await request(app.getHttpServer())
        .post('/conversations')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          agentId: testAgent.id,
          message: 'What can you do?',
        });

      const response = await request(app.getHttpServer())
        .get(`/conversations/${conversation.body.id}/messages`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveLength(2); // Initial message + agent response
      expect(response.body[1].role).toBe('agent');
    });

    it('should handle concurrent conversations', async () => {
      const conversationPromises = Array(5)
        .fill(null)
        .map(() =>
          request(app.getHttpServer())
            .post('/conversations')
            .set('Authorization', `Bearer ${authToken}`)
            .send({
              agentId: testAgent.id,
              message: 'Concurrent test',
            })
        );

      const responses = await Promise.all(conversationPromises);

      responses.forEach((response) => {
        expect(response.status).toBe(201);
        expect(response.body).toHaveProperty('id');
      });

      const uniqueIds = new Set(responses.map((r) => r.body.id));
      expect(uniqueIds.size).toBe(5); // All conversations should have unique IDs
    });
  });

  describe('Error Handling', () => {
    it('should handle invalid agent ID', async () => {
      const response = await request(app.getHttpServer())
        .post('/conversations')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          agentId: 'invalid-id',
          message: 'Hello',
        });

      expect(response.status).toBe(404);
    });

    it('should handle agent timeout', async () => {
      // Simulate slow agent by setting a very short timeout
      const response = await request(app.getHttpServer())
        .post('/conversations')
        .set('Authorization', `Bearer ${authToken}`)
        .set('X-Timeout', '1') // 1ms timeout
        .send({
          agentId: testAgent.id,
          message: 'Slow response test',
        });

      expect(response.status).toBe(504);
    });
  });
});
