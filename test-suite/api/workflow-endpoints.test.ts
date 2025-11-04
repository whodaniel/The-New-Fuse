import request from 'supertest';
import { Test } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { getAuthToken, setupTestApp, cleanupTestData } from '../test-utils/test-helpers';
import { WorkflowController } from '../../../apps/api/src/controllers/workflow.controller';
import { WorkflowService } from '../../../apps/api/src/services/workflow.service';
import { PrismaService } from '../../../apps/api/src/services/prisma.service';
import { EventEmitter2 } from '@nestjs/event-emitter';

describe('Workflow Endpoints', () => {
  let app: INestApplication;
  let workflowController: WorkflowController;
  let prismaService: PrismaService;
  let authToken: string;
  let userId: string;

  beforeAll(async () => {
    app = await setupTestApp();
    workflowController = app.get(WorkflowController);
    prismaService = app.get(PrismaService);
    authToken = await getAuthToken(app, 'testuser@example.com', 'password123');
    userId = 'test-user-123';
  });

  afterAll(async () => {
    await cleanupTestData(app);
    await app.close();
  });

  describe('POST /workflows', () => {
    it('should create a new workflow with valid data', async () => {
      const workflowData = {
        name: 'Test Workflow',
        description: 'A test workflow for validation',
        steps: [
          {
            id: 'step-1',
            type: 'input',
            config: {
              prompt: 'What is your name?',
              inputType: 'text'
            }
          },
          {
            id: 'step-2',
            type: 'process',
            config: {
              action: 'generate_response',
              model: 'gpt-3.5-turbo'
            }
          }
        ],
        triggers: [
          {
            type: 'manual',
            conditions: []
          }
        ]
      };

      const response = await request(app.getHttpServer())
        .post('/workflows')
        .set('Authorization', `Bearer ${authToken}`)
        .send(workflowData)
        .expect(201);

      expect(response.body).toMatchObject({
        id: expect.any(String),
        name: workflowData.name,
        description: workflowData.description,
        userId: userId,
        status: 'active',
        createdAt: expect.any(String),
        updatedAt: expect.any(String)
      });

      // Verify steps are stored correctly
      expect(response.body.steps).toHaveLength(2);
      expect(response.body.steps[0]).toMatchObject({
        id: 'step-1',
        type: 'input',
        config: expect.objectContaining({
          prompt: 'What is your name?',
          inputType: 'text'
        })
      });
    });

    it('should reject workflow creation without authentication', async () => {
      const workflowData = {
        name: 'Unauthorized Workflow',
        description: 'This should fail',
        steps: [],
        triggers: []
      };

      await request(app.getHttpServer())
        .post('/workflows')
        .send(workflowData)
        .expect(401);
    });

    it('should reject workflow with invalid step configuration', async () => {
      const invalidWorkflowData = {
        name: 'Invalid Workflow',
        description: 'Invalid step config',
        steps: [
          {
            id: 'invalid-step',
            type: 'unknown_type',
            config: {}
          }
        ],
        triggers: []
      };

      const response = await request(app.getHttpServer())
        .post('/workflows')
        .set('Authorization', `Bearer ${authToken}`)
        .send(invalidWorkflowData)
        .expect(400);

      expect(response.body.message).toContain('Invalid step type');
    });

    it('should reject workflow without required fields', async () => {
      const incompleteWorkflow = {
        name: 'Incomplete',
        // missing description, steps, triggers
      };

      await request(app.getHttpServer())
        .post('/workflows')
        .set('Authorization', `Bearer ${authToken}`)
        .send(incompleteWorkflow)
        .expect(400);
    });

    it('should validate step configuration schema', async () => {
      const workflowWithInvalidStep = {
        name: 'Schema Invalid Workflow',
        description: 'Testing schema validation',
        steps: [
          {
            id: 'step-1',
            type: 'input',
            config: {
              prompt: 123, // should be string
              inputType: true // should be string
            }
          }
        ],
        triggers: []
      };

      const response = await request(app.getHttpServer())
        .post('/workflows')
        .set('Authorization', `Bearer ${authToken}`)
        .send(workflowWithInvalidStep)
        .expect(400);

      expect(response.body.message).toContain('validation failed');
    });

    it('should create workflow with conditional triggers', async () => {
      const workflowWithTriggers = {
        name: 'Conditional Workflow',
        description: 'Workflow with conditional triggers',
        steps: [
          {
            id: 'step-1',
            type: 'input',
            config: {
              prompt: 'Enter your preference',
              inputType: 'select',
              options: ['option1', 'option2']
            }
          }
        ],
        triggers: [
          {
            type: 'webhook',
            conditions: [
              {
                field: 'event',
                operator: 'equals',
                value: 'user_action'
              }
            ]
          }
        ]
      };

      const response = await request(app.getHttpServer())
        .post('/workflows')
        .set('Authorization', `Bearer ${authToken}`)
        .send(workflowWithTriggers)
        .expect(201);

      expect(response.body.triggers).toHaveLength(1);
      expect(response.body.triggers[0].type).toBe('webhook');
    });
  });

  describe('GET /workflows', () => {
    let createdWorkflowId: string;

    beforeEach(async () => {
      // Create a test workflow
      const workflowData = {
        name: 'List Test Workflow',
        description: 'For testing list functionality',
        steps: [
          {
            id: 'step-1',
            type: 'input',
            config: {
              prompt: 'Test prompt',
              inputType: 'text'
            }
          }
        ],
        triggers: [
          {
            type: 'manual',
            conditions: []
          }
        ]
      };

      const response = await request(app.getHttpServer())
        .post('/workflows')
        .set('Authorization', `Bearer ${authToken}`)
        .send(workflowData);
      
      createdWorkflowId = response.body.id;
    });

    it('should return paginated list of workflows', async () => {
      const response = await request(app.getHttpServer())
        .get('/workflows?page=1&limit=10')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body).toMatchObject({
        data: expect.any(Array),
        pagination: {
          page: 1,
          limit: 10,
          total: expect.any(Number),
          pages: expect.any(Number)
        }
      });

      expect(response.body.data).toHaveLength(expect.any(Number));
    });

    it('should filter workflows by status', async () => {
      const response = await request(app.getHttpServer())
        .get('/workflows?status=active')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.data.every(w => w.status === 'active')).toBe(true);
    });

    it('should search workflows by name', async () => {
      const response = await request(app.getHttpServer())
        .get('/workflows?search=List Test')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      const matchingWorkflows = response.body.data.filter(
        w => w.name.includes('List Test')
      );
      expect(matchingWorkflows.length).toBeGreaterThan(0);
    });

    it('should return empty list for unauthorized user', async () => {
      const otherUserToken = await getAuthToken(app, 'otheruser@example.com', 'password123');
      
      const response = await request(app.getHttpServer())
        .get('/workflows')
        .set('Authorization', `Bearer ${otherUserToken}`)
        .expect(200);

      // Should not include workflows from other users
      expect(response.body.data.every(w => w.userId !== userId)).toBe(true);
    });

    it('should sort workflows by creation date', async () => {
      const response = await request(app.getHttpServer())
        .get('/workflows?sort=createdAt&order=desc')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      const workflows = response.body.data;
      if (workflows.length > 1) {
        for (let i = 0; i < workflows.length - 1; i++) {
          expect(new Date(workflows[i].createdAt)).toBeGreaterThanOrEqual(
            new Date(workflows[i + 1].createdAt)
          );
        }
      }
    });
  });

  describe('GET /workflows/:id', () => {
    let workflowId: string;

    beforeEach(async () => {
      const workflowData = {
        name: 'Detail Test Workflow',
        description: 'For testing detail endpoint',
        steps: [
          {
            id: 'step-1',
            type: 'input',
            config: {
              prompt: 'Test prompt',
              inputType: 'text'
            }
          },
          {
            id: 'step-2',
            type: 'process',
            config: {
              action: 'generate_response',
              model: 'gpt-3.5-turbo'
            }
          }
        ],
        triggers: [
          {
            type: 'manual',
            conditions: []
          }
        ]
      };

      const response = await request(app.getHttpServer())
        .post('/workflows')
        .set('Authorization', `Bearer ${authToken}`)
        .send(workflowData);
      
      workflowId = response.body.id;
    });

    it('should return workflow details with all fields', async () => {
      const response = await request(app.getHttpServer())
        .get(`/workflows/${workflowId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body).toMatchObject({
        id: workflowId,
        name: 'Detail Test Workflow',
        description: 'For testing detail endpoint',
        userId: userId,
        status: 'active',
        steps: expect.any(Array),
        triggers: expect.any(Array),
        createdAt: expect.any(String),
        updatedAt: expect.any(String)
      });

      expect(response.body.steps).toHaveLength(2);
      expect(response.body.triggers).toHaveLength(1);
    });

    it('should return 404 for non-existent workflow', async () => {
      const nonExistentId = 'non-existent-workflow-id';
      
      await request(app.getHttpServer())
        .get(`/workflows/${nonExistentId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404);
    });

    it('should return 403 for workflow owned by another user', async () => {
      const otherUserToken = await getAuthToken(app, 'otheruser@example.com', 'password123');
      
      await request(app.getHttpServer())
        .get(`/workflows/${workflowId}`)
        .set('Authorization', `Bearer ${otherUserToken}`)
        .expect(403);
    });

    it('should include execution history if available', async () => {
      const response = await request(app.getHttpServer())
        .get(`/workflows/${workflowId}?includeHistory=true`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      if (response.body.executionHistory) {
        expect(response.body.executionHistory).toBeInstanceOf(Array);
      }
    });
  });

  describe('PUT /workflows/:id', () => {
    let workflowId: string;

    beforeEach(async () => {
      const workflowData = {
        name: 'Update Test Workflow',
        description: 'Original description',
        steps: [
          {
            id: 'step-1',
            type: 'input',
            config: {
              prompt: 'Original prompt',
              inputType: 'text'
            }
          }
        ],
        triggers: [
          {
            type: 'manual',
            conditions: []
          }
        ]
      };

      const response = await request(app.getHttpServer())
        .post('/workflows')
        .set('Authorization', `Bearer ${authToken}`)
        .send(workflowData);
      
      workflowId = response.body.id;
    });

    it('should update workflow metadata', async () => {
      const updateData = {
        name: 'Updated Test Workflow',
        description: 'Updated description'
      };

      const response = await request(app.getHttpServer())
        .put(`/workflows/${workflowId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(updateData)
        .expect(200);

      expect(response.body).toMatchObject({
        id: workflowId,
        name: updateData.name,
        description: updateData.description,
        userId: userId,
        updatedAt: expect.any(String)
      });

      expect(new Date(response.body.updatedAt)).toBeGreaterThan(
        new Date(response.body.createdAt)
      );
    });

    it('should update workflow steps', async () => {
      const updateData = {
        steps: [
          {
            id: 'step-1',
            type: 'input',
            config: {
              prompt: 'Updated prompt',
              inputType: 'textarea'
            }
          },
          {
            id: 'step-2',
            type: 'output',
            config: {
              format: 'json',
              template: 'Result: {{input}}'
            }
          }
        ]
      };

      const response = await request(app.getHttpServer())
        .put(`/workflows/${workflowId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(updateData)
        .expect(200);

      expect(response.body.steps).toHaveLength(2);
      expect(response.body.steps[0].config.prompt).toBe('Updated prompt');
    });

    it('should not allow updating workflow owned by another user', async () => {
      const otherUserToken = await getAuthToken(app, 'otheruser@example.com', 'password123');
      const updateData = { name: 'Unauthorized Update' };

      await request(app.getHttpServer())
        .put(`/workflows/${workflowId}`)
        .set('Authorization', `Bearer ${otherUserToken}`)
        .send(updateData)
        .expect(403);
    });

    it('should validate step configuration on update', async () => {
      const invalidUpdateData = {
        steps: [
          {
            id: 'invalid-step',
            type: 'invalid_type',
            config: {}
          }
        ]
      };

      const response = await request(app.getHttpServer())
        .put(`/workflows/${workflowId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(invalidUpdateData)
        .expect(400);

      expect(response.body.message).toContain('Invalid step type');
    });

    it('should maintain workflow status during updates', async () => {
      const updateData = {
        name: 'Status Test Workflow',
        description: 'Testing status maintenance'
      };

      const response = await request(app.getHttpServer())
        .put(`/workflows/${workflowId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(updateData)
        .expect(200);

      expect(response.body.status).toBe('active');
    });
  });

  describe('DELETE /workflows/:id', () => {
    let workflowId: string;

    beforeEach(async () => {
      const workflowData = {
        name: 'Delete Test Workflow',
        description: 'For testing delete functionality',
        steps: [
          {
            id: 'step-1',
            type: 'input',
            config: {
              prompt: 'Delete test prompt',
              inputType: 'text'
            }
          }
        ],
        triggers: [
          {
            type: 'manual',
            conditions: []
          }
        ]
      };

      const response = await request(app.getHttpServer())
        .post('/workflows')
        .set('Authorization', `Bearer ${authToken}`)
        .send(workflowData);
      
      workflowId = response.body.id;
    });

    it('should soft delete workflow', async () => {
      const response = await request(app.getHttpServer())
        .delete(`/workflows/${workflowId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.message).toBe('Workflow deleted successfully');

      // Verify workflow is marked as deleted but not actually removed
      const getResponse = await request(app.getHttpServer())
        .get(`/workflows/${workflowId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404);

      // Should not appear in list
      const listResponse = await request(app.getHttpServer())
        .get('/workflows')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      const deletedWorkflow = listResponse.body.data.find(w => w.id === workflowId);
      expect(deletedWorkflow).toBeUndefined();
    });

    it('should not allow deleting workflow owned by another user', async () => {
      const otherUserToken = await getAuthToken(app, 'otheruser@example.com', 'password123');

      await request(app.getHttpServer())
        .delete(`/workflows/${workflowId}`)
        .set('Authorization', `Bearer ${otherUserToken}`)
        .expect(403);
    });

    it('should return 404 for non-existent workflow', async () => {
      const nonExistentId = 'non-existent-workflow-id';

      await request(app.getHttpServer())
        .delete(`/workflows/${nonExistentId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404);
    });

    it('should prevent deletion of workflows with active executions', async () => {
      // First, create an execution for the workflow
      await prismaService.workflowExecution.create({
        data: {
          workflowId: workflowId,
          status: 'running',
          currentStep: 0,
          inputData: {},
          outputData: {},
          startedAt: new Date(),
          userId: userId
        }
      });

      const response = await request(app.getHttpServer())
        .delete(`/workflows/${workflowId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(400);

      expect(response.body.message).toContain('active executions');
    });
  });

  describe('POST /workflows/:id/execute', () => {
    let workflowId: string;

    beforeEach(async () => {
      const workflowData = {
        name: 'Execute Test Workflow',
        description: 'For testing execution',
        steps: [
          {
            id: 'step-1',
            type: 'input',
            config: {
              prompt: 'What is your name?',
              inputType: 'text'
            }
          },
          {
            id: 'step-2',
            type: 'process',
            config: {
              action: 'generate_response',
              model: 'gpt-3.5-turbo',
              prompt: 'Hello {{step1}}!'
            }
          }
        ],
        triggers: [
          {
            type: 'manual',
            conditions: []
          }
        ]
      };

      const response = await request(app.getHttpServer())
        .post('/workflows')
        .set('Authorization', `Bearer ${authToken}`)
        .send(workflowData);
      
      workflowId = response.body.id;
    });

    it('should start workflow execution', async () => {
      const executionData = {
        input: {
          step1: 'John Doe'
        }
      };

      const response = await request(app.getHttpServer())
        .post(`/workflows/${workflowId}/execute`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(executionData)
        .expect(201);

      expect(response.body).toMatchObject({
        id: expect.any(String),
        workflowId: workflowId,
        status: 'pending',
        currentStep: 0,
        userId: userId,
        inputData: executionData.input,
        outputData: {},
        startedAt: expect.any(String)
      });
    });

    it('should validate input data against workflow schema', async () => {
      const invalidExecutionData = {
        input: {
          // missing required step1 input
          step2: 'invalid'
        }
      };

      const response = await request(app.getHttpServer())
        .post(`/workflows/${workflowId}/execute`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(invalidExecutionData)
        .expect(400);

      expect(response.body.message).toContain('Missing required input');
    });

    it('should not allow executing deleted workflows', async () => {
      // Delete the workflow
      await request(app.getHttpServer())
        .delete(`/workflows/${workflowId}`)
        .set('Authorization', `Bearer ${authToken}`);

      const executionData = {
        input: {
          step1: 'Test'
        }
      };

      await request(app.getHttpServer())
        .post(`/workflows/${workflowId}/execute`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(executionData)
        .expect(404);
    });

    it('should rate limit workflow executions', async () => {
      const executionData = {
        input: {
          step1: 'Test'
        }
      };

      // Make multiple requests quickly
      const requests = Array(10).fill(null).map(() =>
        request(app.getHttpServer())
          .post(`/workflows/${workflowId}/execute`)
          .set('Authorization', `Bearer ${authToken}`)
          .send(executionData)
      );

      const responses = await Promise.all(requests);
      
      // At least some should be rate limited
      const rateLimitedResponses = responses.filter(r => r.status === 429);
      expect(rateLimitedResponses.length).toBeGreaterThan(0);
    });
  });

  describe('GET /workflows/:id/executions', () => {
    let workflowId: string;
    let executionId: string;

    beforeEach(async () => {
      const workflowData = {
        name: 'Executions List Test',
        description: 'For testing executions list',
        steps: [
          {
            id: 'step-1',
            type: 'input',
            config: {
              prompt: 'Test input',
              inputType: 'text'
            }
          }
        ],
        triggers: [
          {
            type: 'manual',
            conditions: []
          }
        ]
      };

      const workflowResponse = await request(app.getHttpServer())
        .post('/workflows')
        .set('Authorization', `Bearer ${authToken}`)
        .send(workflowData);
      
      workflowId = workflowResponse.body.id;

      // Create an execution
      const executionResponse = await request(app.getHttpServer())
        .post(`/workflows/${workflowId}/execute`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ input: { step1: 'test' } });

      executionId = executionResponse.body.id;
    });

    it('should return paginated list of workflow executions', async () => {
      const response = await request(app.getHttpServer())
        .get(`/workflows/${workflowId}/executions?page=1&limit=10`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body).toMatchObject({
        data: expect.any(Array),
        pagination: {
          page: 1,
          limit: 10,
          total: expect.any(Number),
          pages: expect.any(Number)
        }
      });

      if (response.body.data.length > 0) {
        expect(response.body.data[0]).toMatchObject({
          id: expect.any(String),
          workflowId: workflowId,
          status: expect.any(String),
          currentStep: expect.any(Number),
          userId: userId,
          startedAt: expect.any(String)
        });
      }
    });

    it('should filter executions by status', async () => {
      const response = await request(app.getHttpServer())
        .get(`/workflows/${workflowId}/executions?status=pending`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.data.every(e => e.status === 'pending')).toBe(true);
    });

    it('should not return executions for workflow owned by another user', async () => {
      const otherUserToken = await getAuthToken(app, 'otheruser@example.com', 'password123');

      const response = await request(app.getHttpServer())
        .get(`/workflows/${workflowId}/executions`)
        .set('Authorization', `Bearer ${otherUserToken}`)
        .expect(403);
    });
  });

  describe('GET /workflows/executions/:executionId', () => {
    let workflowId: string;
    let executionId: string;

    beforeEach(async () => {
      const workflowData = {
        name: 'Execution Detail Test',
        description: 'For testing execution details',
        steps: [
          {
            id: 'step-1',
            type: 'input',
            config: {
              prompt: 'Test input',
              inputType: 'text'
            }
          }
        ],
        triggers: [
          {
            type: 'manual',
            conditions: []
          }
        ]
      };

      const workflowResponse = await request(app.getHttpServer())
        .post('/workflows')
        .set('Authorization', `Bearer ${authToken}`)
        .send(workflowData);
      
      workflowId = workflowResponse.body.id;

      const executionResponse = await request(app.getHttpServer())
        .post(`/workflows/${workflowId}/execute`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ input: { step1: 'test' } });

      executionId = executionResponse.body.id;
    });

    it('should return execution details', async () => {
      const response = await request(app.getHttpServer())
        .get(`/workflows/executions/${executionId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body).toMatchObject({
        id: executionId,
        workflowId: workflowId,
        status: expect.any(String),
        currentStep: expect.any(Number),
        userId: userId,
        inputData: expect.any(Object),
        outputData: expect.any(Object),
        startedAt: expect.any(String)
      });
    });

    it('should include step execution history', async () => {
      const response = await request(app.getHttpServer())
        .get(`/workflows/executions/${executionId}?includeHistory=true`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      if (response.body.stepHistory) {
        expect(response.body.stepHistory).toBeInstanceOf(Array);
      }
    });

    it('should return 404 for non-existent execution', async () => {
      const nonExistentId = 'non-existent-execution-id';

      await request(app.getHttpServer())
        .get(`/workflows/executions/${nonExistentId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404);
    });

    it('should not allow viewing execution of another user', async () => {
      const otherUserToken = await getAuthToken(app, 'otheruser@example.com', 'password123');

      await request(app.getHttpServer())
        .get(`/workflows/executions/${executionId}`)
        .set('Authorization', `Bearer ${otherUserToken}`)
        .expect(403);
    });
  });

  describe('Error Handling and Edge Cases', () => {
    it('should handle database connection errors gracefully', async () => {
      // Mock database error
      jest.spyOn(prismaService.workflow, 'create').mockRejectedValue(
        new Error('Database connection failed')
      );

      const workflowData = {
        name: 'DB Error Test',
        description: 'Testing database error handling',
        steps: [],
        triggers: []
      };

      const response = await request(app.getHttpServer())
        .post('/workflows')
        .set('Authorization', `Bearer ${authToken}`)
        .send(workflowData)
        .expect(500);

      expect(response.body.message).toContain('Internal server error');
    });

    it('should handle concurrent workflow creation', async () => {
      const workflowData = {
        name: 'Concurrent Test',
        description: 'Testing concurrent operations',
        steps: [],
        triggers: []
      };

      // Create multiple concurrent requests
      const requests = Array(5).fill(null).map(() =>
        request(app.getHttpServer())
          .post('/workflows')
          .set('Authorization', `Bearer ${authToken}`)
          .send(workflowData)
      );

      const responses = await Promise.all(requests);
      
      // All should succeed
      expect(responses.every(r => r.status === 201)).toBe(true);
      
      // All should have unique IDs
      const ids = responses.map(r => r.body.id);
      expect(new Set(ids).size).toBe(5);
    });

    it('should handle malformed JSON requests', async () => {
      const malformedJson = '{ "name": "test", "description": }';

      await request(app.getHttpServer())
        .post('/workflows')
        .set('Authorization', `Bearer ${authToken}`)
        .set('Content-Type', 'application/json')
        .send(malformedJson)
        .expect(400);
    });

    it('should validate request size limits', async () => {
      const largeWorkflowData = {
        name: 'Large Workflow Test',
        description: 'A'.repeat(10000), // Large description
        steps: Array(1000).fill(null).map((_, i) => ({
          id: `step-${i}`,
          type: 'input',
          config: {
            prompt: 'Test prompt',
            inputType: 'text'
          }
        })),
        triggers: []
      };

      const response = await request(app.getHttpServer())
        .post('/workflows')
        .set('Authorization', `Bearer ${authToken}`)
        .send(largeWorkflowData)
        .expect(413); // Payload too large

      expect(response.body.message).toContain('Payload too large');
    });
  });

  describe('Performance Tests', () => {
    it('should handle large workflow creation within performance threshold', async () => {
      const startTime = Date.now();
      
      const workflowData = {
        name: 'Performance Test Workflow',
        description: 'Testing performance with moderate size workflow',
        steps: Array(50).fill(null).map((_, i) => ({
          id: `step-${i}`,
          type: i % 2 === 0 ? 'input' : 'process',
          config: {
            prompt: `Test prompt for step ${i}`,
            inputType: 'text',
            action: i % 2 === 0 ? undefined : 'generate_response'
          }
        })),
        triggers: [
          {
            type: 'manual',
            conditions: []
          },
          {
            type: 'webhook',
            conditions: [
              {
                field: 'event',
                operator: 'equals',
                value: 'test_event'
              }
            ]
          }
        ]
      };

      const response = await request(app.getHttpServer())
        .post('/workflows')
        .set('Authorization', `Bearer ${authToken}`)
        .send(workflowData)
        .expect(201);

      const endTime = Date.now();
      const duration = endTime - startTime;

      expect(duration).toBeLessThan(5000); // Should complete within 5 seconds
      expect(response.body.steps).toHaveLength(50);
    });

    it('should handle workflow listing with many records efficiently', async () => {
      // Create multiple workflows
      const workflows = Array(20).fill(null).map((_, i) => ({
        name: `Performance Test ${i}`,
        description: `Test workflow ${i}`,
        steps: [],
        triggers: []
      }));

      const createRequests = workflows.map(workflow =>
        request(app.getHttpServer())
          .post('/workflows')
          .set('Authorization', `Bearer ${authToken}`)
          .send(workflow)
      );

      await Promise.all(createRequests);

      const startTime = Date.now();
      const response = await request(app.getHttpServer())
        .get('/workflows?limit=50')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      const endTime = Date.now();
      const duration = endTime - startTime;

      expect(duration).toBeLessThan(2000); // Should complete within 2 seconds
      expect(response.body.data.length).toBeGreaterThanOrEqual(20);
    });
  });
});