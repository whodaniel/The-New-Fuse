/**
 * DrizzleWorkflowRepository Integration Tests
 * Tests all 32 methods of the workflow repository
 */

import { drizzleWorkflowRepository } from '../../src/drizzle/repositories/workflow.repository';
import { drizzleUserRepository } from '../../src/drizzle/repositories/user.repository';
import { drizzleAgentRepository } from '../../src/drizzle/repositories/agent.repository';
import { UserFactory, AgentFactory, WorkflowFactory } from '../utils/factories';
import {
  expectDatabaseRow,
  expectSoftDeleted,
  expectNotNull,
  expectArrayLength,
  expectNotDeleted,
} from '../utils/assertions';
import type { NewWorkflowStep, NewWorkflowExecution, NewWorkflowTemplate } from '../../src/drizzle/types';

describe('DrizzleWorkflowRepository', () => {
  let testUserId: string;
  let testAgentId: string;

  beforeEach(async () => {
    // Create test user
    const userData = await UserFactory.build();
    const user = await drizzleUserRepository.create(userData);
    testUserId = user.id;

    // Create test agent
    const agentData = AgentFactory.build({ userId: testUserId });
    const agent = await drizzleAgentRepository.create(agentData);
    testAgentId = agent.id;
  });

  describe('Workflow Operations', () => {
    describe('createWorkflow', () => {
      it('should create a new workflow', async () => {
        const workflowData = WorkflowFactory.build({ userId: testUserId });

        const workflow = await drizzleWorkflowRepository.createWorkflow(workflowData);

        expectDatabaseRow(workflow, {
          name: workflowData.name,
          userId: testUserId,
          status: workflowData.status,
        });
        expect(workflow.description).toBe(workflowData.description);
        expectNotDeleted(workflow);
      });

      it('should create workflow with agent ID', async () => {
        const workflowData = WorkflowFactory.build({ userId: testUserId, agentId: testAgentId });

        const workflow = await drizzleWorkflowRepository.createWorkflow(workflowData);

        expect(workflow.agentId).toBe(testAgentId);
      });
    });

    describe('findWorkflowById', () => {
      it('should find workflow by ID', async () => {
        const workflowData = WorkflowFactory.build({ userId: testUserId });
        const created = await drizzleWorkflowRepository.createWorkflow(workflowData);

        const found = await drizzleWorkflowRepository.findWorkflowById(created.id);

        expectNotNull(found);
        expect(found.id).toBe(created.id);
        expect(found.name).toBe(created.name);
      });

      it('should return null for non-existent ID', async () => {
        const found = await drizzleWorkflowRepository.findWorkflowById('non-existent-id');

        expect(found).toBeNull();
      });

      it('should not return soft-deleted workflows', async () => {
        const workflowData = WorkflowFactory.build({ userId: testUserId });
        const created = await drizzleWorkflowRepository.createWorkflow(workflowData);
        await drizzleWorkflowRepository.softDeleteWorkflow(created.id);

        const found = await drizzleWorkflowRepository.findWorkflowById(created.id);

        expectSoftDeleted(found);
      });
    });

    describe('findWorkflowWithSteps', () => {
      it('should find workflow with its steps', async () => {
        const workflowData = WorkflowFactory.build({ userId: testUserId });
        const workflow = await drizzleWorkflowRepository.createWorkflow(workflowData);

        // Create steps
        const step1Data: NewWorkflowStep = {
          workflowId: workflow.id,
          name: 'Step 1',
          type: 'ACTION',
          order: 0,
          config: {},
          isActive: true,
        };
        const step2Data: NewWorkflowStep = {
          workflowId: workflow.id,
          name: 'Step 2',
          type: 'CONDITION',
          order: 1,
          config: {},
          isActive: true,
        };
        await drizzleWorkflowRepository.createStep(step1Data);
        await drizzleWorkflowRepository.createStep(step2Data);

        const found = await drizzleWorkflowRepository.findWorkflowWithSteps(workflow.id);

        expectNotNull(found);
        expect(found.id).toBe(workflow.id);
        expectArrayLength(found.steps, 2);
        expect(found.steps[0].order).toBe(0);
        expect(found.steps[1].order).toBe(1);
      });

      it('should return null for non-existent workflow', async () => {
        const found = await drizzleWorkflowRepository.findWorkflowWithSteps('non-existent-id');

        expect(found).toBeNull();
      });
    });

    describe('findWorkflowsByCreatorId', () => {
      it('should find all workflows for creator', async () => {
        await drizzleWorkflowRepository.createWorkflow(WorkflowFactory.build({ userId: testUserId }));
        await drizzleWorkflowRepository.createWorkflow(WorkflowFactory.build({ userId: testUserId }));

        const workflows = await drizzleWorkflowRepository.findWorkflowsByCreatorId(testUserId);

        expectArrayLength(workflows, 2);
        expect(workflows.every((w) => w.userId === testUserId)).toBe(true);
      });

      it('should return empty array for creator with no workflows', async () => {
        const workflows = await drizzleWorkflowRepository.findWorkflowsByCreatorId('non-existent-user');

        expect(workflows).toEqual([]);
      });
    });

    describe('findActiveWorkflows', () => {
      it('should find only active workflows', async () => {
        const activeData = WorkflowFactory.build({ userId: testUserId, isActive: true });
        const inactiveData = WorkflowFactory.build({ userId: testUserId, isActive: false });

        await drizzleWorkflowRepository.createWorkflow(activeData);
        await drizzleWorkflowRepository.createWorkflow(inactiveData);

        const active = await drizzleWorkflowRepository.findActiveWorkflows();

        expect(active.length).toBeGreaterThanOrEqual(1);
        expect(active.every((w) => w.isActive === true)).toBe(true);
      });
    });

    describe('findWorkflowsByStatus', () => {
      it('should find workflows by status', async () => {
        await drizzleWorkflowRepository.createWorkflow(WorkflowFactory.build({ userId: testUserId, status: 'DRAFT' }));
        await drizzleWorkflowRepository.createWorkflow(WorkflowFactory.build({ userId: testUserId, status: 'ACTIVE' }));
        await drizzleWorkflowRepository.createWorkflow(WorkflowFactory.build({ userId: testUserId, status: 'DRAFT' }));

        const drafts = await drizzleWorkflowRepository.findWorkflowsByStatus('DRAFT');

        expectArrayLength(drafts, 2);
        expect(drafts.every((w) => w.status === 'DRAFT')).toBe(true);
      });
    });

    describe('findWorkflowsByAgentId', () => {
      it('should find workflows for agent', async () => {
        await drizzleWorkflowRepository.createWorkflow(
          WorkflowFactory.build({ userId: testUserId, agentId: testAgentId })
        );
        await drizzleWorkflowRepository.createWorkflow(
          WorkflowFactory.build({ userId: testUserId, agentId: testAgentId })
        );

        const workflows = await drizzleWorkflowRepository.findWorkflowsByAgentId(testAgentId);

        expectArrayLength(workflows, 2);
        expect(workflows.every((w) => w.agentId === testAgentId)).toBe(true);
      });

      it('should return empty array for agent with no workflows', async () => {
        const workflows = await drizzleWorkflowRepository.findWorkflowsByAgentId('non-existent-agent');

        expect(workflows).toEqual([]);
      });
    });

    describe('updateWorkflow', () => {
      it('should update workflow fields', async () => {
        const workflowData = WorkflowFactory.build({ userId: testUserId });
        const created = await drizzleWorkflowRepository.createWorkflow(workflowData);

        const updated = await drizzleWorkflowRepository.updateWorkflow(created.id, {
          name: 'Updated Workflow',
          description: 'Updated Description',
        });

        expectNotNull(updated);
        expect(updated.name).toBe('Updated Workflow');
        expect(updated.description).toBe('Updated Description');
        expect(updated.updatedAt.getTime()).toBeGreaterThan(created.updatedAt.getTime());
      });

      it('should return null for non-existent workflow', async () => {
        const updated = await drizzleWorkflowRepository.updateWorkflow('non-existent-id', { name: 'New Name' });

        expect(updated).toBeNull();
      });
    });

    describe('incrementExecutionCount', () => {
      it('should increment execution count and update lastExecutedAt', async () => {
        const workflowData = WorkflowFactory.build({ userId: testUserId });
        const created = await drizzleWorkflowRepository.createWorkflow(workflowData);
        const initialCount = created.executionCount || 0;

        await drizzleWorkflowRepository.incrementExecutionCount(created.id);

        const updated = await drizzleWorkflowRepository.findWorkflowById(created.id);
        expectNotNull(updated);
        expect(updated.executionCount).toBe(initialCount + 1);
        expect(updated.lastExecutedAt).toBeInstanceOf(Date);
      });
    });

    describe('activateWorkflow', () => {
      it('should activate workflow', async () => {
        const workflowData = WorkflowFactory.build({ userId: testUserId, isActive: false, status: 'DRAFT' });
        const created = await drizzleWorkflowRepository.createWorkflow(workflowData);

        const activated = await drizzleWorkflowRepository.activateWorkflow(created.id);

        expectNotNull(activated);
        expect(activated.isActive).toBe(true);
        expect(activated.status).toBe('ACTIVE');
      });

      it('should return null for non-existent workflow', async () => {
        const activated = await drizzleWorkflowRepository.activateWorkflow('non-existent-id');

        expect(activated).toBeNull();
      });
    });

    describe('deactivateWorkflow', () => {
      it('should deactivate workflow', async () => {
        const workflowData = WorkflowFactory.build({ userId: testUserId, isActive: true, status: 'ACTIVE' });
        const created = await drizzleWorkflowRepository.createWorkflow(workflowData);

        const deactivated = await drizzleWorkflowRepository.deactivateWorkflow(created.id);

        expectNotNull(deactivated);
        expect(deactivated.isActive).toBe(false);
        expect(deactivated.status).toBe('INACTIVE');
      });

      it('should return null for non-existent workflow', async () => {
        const deactivated = await drizzleWorkflowRepository.deactivateWorkflow('non-existent-id');

        expect(deactivated).toBeNull();
      });
    });

    describe('softDeleteWorkflow', () => {
      it('should soft delete workflow and deactivate it', async () => {
        const workflowData = WorkflowFactory.build({ userId: testUserId, isActive: true });
        const created = await drizzleWorkflowRepository.createWorkflow(workflowData);

        const result = await drizzleWorkflowRepository.softDeleteWorkflow(created.id);

        expect(result).toBe(true);

        // Workflow should not be found by normal queries
        const found = await drizzleWorkflowRepository.findWorkflowById(created.id);
        expectSoftDeleted(found);
      });

      it('should return false for non-existent workflow', async () => {
        const result = await drizzleWorkflowRepository.softDeleteWorkflow('non-existent-id');

        expect(result).toBe(false);
      });
    });
  });

  describe('Workflow Step Operations', () => {
    let testWorkflowId: string;

    beforeEach(async () => {
      const workflowData = WorkflowFactory.build({ userId: testUserId });
      const workflow = await drizzleWorkflowRepository.createWorkflow(workflowData);
      testWorkflowId = workflow.id;
    });

    describe('createStep', () => {
      it('should create workflow step', async () => {
        const stepData: NewWorkflowStep = {
          workflowId: testWorkflowId,
          name: 'Test Step',
          type: 'ACTION',
          order: 0,
          config: { action: 'send_email' },
          isActive: true,
        };

        const step = await drizzleWorkflowRepository.createStep(stepData);

        expectDatabaseRow(step, {
          workflowId: testWorkflowId,
          name: 'Test Step',
          type: 'ACTION',
          order: 0,
        });
        expect(step.config).toEqual({ action: 'send_email' });
      });

      it('should create step with dependencies', async () => {
        const step1 = await drizzleWorkflowRepository.createStep({
          workflowId: testWorkflowId,
          name: 'Step 1',
          type: 'ACTION',
          order: 0,
          config: {},
          isActive: true,
        });

        const stepData: NewWorkflowStep = {
          workflowId: testWorkflowId,
          name: 'Step 2',
          type: 'ACTION',
          order: 1,
          config: {},
          dependencies: [step1.id],
          isActive: true,
        };

        const step = await drizzleWorkflowRepository.createStep(stepData);

        expect(step.dependencies).toEqual([step1.id]);
      });
    });

    describe('findStepById', () => {
      it('should find step by ID', async () => {
        const stepData: NewWorkflowStep = {
          workflowId: testWorkflowId,
          name: 'Find Me',
          type: 'ACTION',
          order: 0,
          config: {},
          isActive: true,
        };
        const created = await drizzleWorkflowRepository.createStep(stepData);

        const found = await drizzleWorkflowRepository.findStepById(created.id);

        expectNotNull(found);
        expect(found.id).toBe(created.id);
        expect(found.name).toBe('Find Me');
      });

      it('should return null for non-existent ID', async () => {
        const found = await drizzleWorkflowRepository.findStepById('non-existent-id');

        expect(found).toBeNull();
      });
    });

    describe('findStepsByWorkflowId', () => {
      it('should find all active steps for workflow in order', async () => {
        await drizzleWorkflowRepository.createStep({
          workflowId: testWorkflowId,
          name: 'Step 2',
          type: 'ACTION',
          order: 1,
          config: {},
          isActive: true,
        });
        await drizzleWorkflowRepository.createStep({
          workflowId: testWorkflowId,
          name: 'Step 1',
          type: 'ACTION',
          order: 0,
          config: {},
          isActive: true,
        });

        const steps = await drizzleWorkflowRepository.findStepsByWorkflowId(testWorkflowId);

        expectArrayLength(steps, 2);
        expect(steps[0].order).toBe(0);
        expect(steps[1].order).toBe(1);
      });

      it('should not return inactive steps', async () => {
        await drizzleWorkflowRepository.createStep({
          workflowId: testWorkflowId,
          name: 'Active Step',
          type: 'ACTION',
          order: 0,
          config: {},
          isActive: true,
        });
        await drizzleWorkflowRepository.createStep({
          workflowId: testWorkflowId,
          name: 'Inactive Step',
          type: 'ACTION',
          order: 1,
          config: {},
          isActive: false,
        });

        const steps = await drizzleWorkflowRepository.findStepsByWorkflowId(testWorkflowId);

        expectArrayLength(steps, 1);
        expect(steps[0].name).toBe('Active Step');
      });
    });

    describe('updateStep', () => {
      it('should update step fields', async () => {
        const stepData: NewWorkflowStep = {
          workflowId: testWorkflowId,
          name: 'Original Name',
          type: 'ACTION',
          order: 0,
          config: {},
          isActive: true,
        };
        const created = await drizzleWorkflowRepository.createStep(stepData);

        const updated = await drizzleWorkflowRepository.updateStep(created.id, {
          name: 'Updated Name',
          config: { newConfig: true },
        });

        expectNotNull(updated);
        expect(updated.name).toBe('Updated Name');
        expect(updated.config).toEqual({ newConfig: true });
      });

      it('should return null for non-existent step', async () => {
        const updated = await drizzleWorkflowRepository.updateStep('non-existent-id', { name: 'New Name' });

        expect(updated).toBeNull();
      });
    });

    describe('deleteStep', () => {
      it('should hard delete step', async () => {
        const stepData: NewWorkflowStep = {
          workflowId: testWorkflowId,
          name: 'Delete Me',
          type: 'ACTION',
          order: 0,
          config: {},
          isActive: true,
        };
        const created = await drizzleWorkflowRepository.createStep(stepData);

        const result = await drizzleWorkflowRepository.deleteStep(created.id);

        expect(result).toBe(true);

        const found = await drizzleWorkflowRepository.findStepById(created.id);
        expect(found).toBeNull();
      });

      it('should return false for non-existent step', async () => {
        const result = await drizzleWorkflowRepository.deleteStep('non-existent-id');

        expect(result).toBe(false);
      });
    });

    describe('reorderSteps', () => {
      it('should reorder steps correctly', async () => {
        const step1 = await drizzleWorkflowRepository.createStep({
          workflowId: testWorkflowId,
          name: 'Step 1',
          type: 'ACTION',
          order: 0,
          config: {},
          isActive: true,
        });
        const step2 = await drizzleWorkflowRepository.createStep({
          workflowId: testWorkflowId,
          name: 'Step 2',
          type: 'ACTION',
          order: 1,
          config: {},
          isActive: true,
        });
        const step3 = await drizzleWorkflowRepository.createStep({
          workflowId: testWorkflowId,
          name: 'Step 3',
          type: 'ACTION',
          order: 2,
          config: {},
          isActive: true,
        });

        // Reorder: step2 first, then step1, then step3
        await drizzleWorkflowRepository.reorderSteps(testWorkflowId, [step2.id, step1.id, step3.id]);

        const updated1 = await drizzleWorkflowRepository.findStepById(step1.id);
        const updated2 = await drizzleWorkflowRepository.findStepById(step2.id);
        const updated3 = await drizzleWorkflowRepository.findStepById(step3.id);

        expectNotNull(updated1);
        expectNotNull(updated2);
        expectNotNull(updated3);
        expect(updated2.order).toBe(0);
        expect(updated1.order).toBe(1);
        expect(updated3.order).toBe(2);
      });
    });
  });

  describe('Workflow Execution Operations', () => {
    let testWorkflowId: string;

    beforeEach(async () => {
      const workflowData = WorkflowFactory.build({ userId: testUserId });
      const workflow = await drizzleWorkflowRepository.createWorkflow(workflowData);
      testWorkflowId = workflow.id;
    });

    describe('createExecution', () => {
      it('should create workflow execution', async () => {
        const executionData: NewWorkflowExecution = {
          workflowId: testWorkflowId,
          status: 'PENDING',
          triggeredBy: testUserId,
          input: { test: 'data' },
        };

        const execution = await drizzleWorkflowRepository.createExecution(executionData);

        expectDatabaseRow(execution, {
          workflowId: testWorkflowId,
          status: 'PENDING',
          triggeredBy: testUserId,
        });
        expect(execution.input).toEqual({ test: 'data' });
      });
    });

    describe('findExecutionById', () => {
      it('should find execution by ID', async () => {
        const executionData: NewWorkflowExecution = {
          workflowId: testWorkflowId,
          status: 'PENDING',
          triggeredBy: testUserId,
        };
        const created = await drizzleWorkflowRepository.createExecution(executionData);

        const found = await drizzleWorkflowRepository.findExecutionById(created.id);

        expectNotNull(found);
        expect(found.id).toBe(created.id);
        expect(found.workflowId).toBe(testWorkflowId);
      });

      it('should return null for non-existent ID', async () => {
        const found = await drizzleWorkflowRepository.findExecutionById('non-existent-id');

        expect(found).toBeNull();
      });
    });

    describe('findExecutionsByWorkflowId', () => {
      it('should find executions for workflow', async () => {
        await drizzleWorkflowRepository.createExecution({
          workflowId: testWorkflowId,
          status: 'COMPLETED',
          triggeredBy: testUserId,
        });
        await drizzleWorkflowRepository.createExecution({
          workflowId: testWorkflowId,
          status: 'FAILED',
          triggeredBy: testUserId,
        });

        const executions = await drizzleWorkflowRepository.findExecutionsByWorkflowId(testWorkflowId);

        expectArrayLength(executions, 2);
        expect(executions.every((e) => e.workflowId === testWorkflowId)).toBe(true);
      });

      it('should respect limit parameter', async () => {
        for (let i = 0; i < 5; i++) {
          await drizzleWorkflowRepository.createExecution({
            workflowId: testWorkflowId,
            status: 'COMPLETED',
            triggeredBy: testUserId,
          });
        }

        const executions = await drizzleWorkflowRepository.findExecutionsByWorkflowId(testWorkflowId, 3);

        expectArrayLength(executions, 3);
      });
    });

    describe('findExecutionsByStatus', () => {
      it('should find executions by status', async () => {
        await drizzleWorkflowRepository.createExecution({
          workflowId: testWorkflowId,
          status: 'RUNNING',
          triggeredBy: testUserId,
        });
        await drizzleWorkflowRepository.createExecution({
          workflowId: testWorkflowId,
          status: 'COMPLETED',
          triggeredBy: testUserId,
        });

        const running = await drizzleWorkflowRepository.findExecutionsByStatus('RUNNING');

        expect(running.length).toBeGreaterThanOrEqual(1);
        expect(running.every((e) => e.status === 'RUNNING')).toBe(true);
      });
    });

    describe('updateExecution', () => {
      it('should update execution fields', async () => {
        const executionData: NewWorkflowExecution = {
          workflowId: testWorkflowId,
          status: 'PENDING',
          triggeredBy: testUserId,
        };
        const created = await drizzleWorkflowRepository.createExecution(executionData);

        const updated = await drizzleWorkflowRepository.updateExecution(created.id, {
          status: 'RUNNING',
          output: { progress: 50 },
        });

        expectNotNull(updated);
        expect(updated.status).toBe('RUNNING');
        expect(updated.output).toEqual({ progress: 50 });
      });

      it('should return null for non-existent execution', async () => {
        const updated = await drizzleWorkflowRepository.updateExecution('non-existent-id', { status: 'RUNNING' });

        expect(updated).toBeNull();
      });
    });

    describe('completeExecution', () => {
      it('should complete execution with output', async () => {
        const executionData: NewWorkflowExecution = {
          workflowId: testWorkflowId,
          status: 'RUNNING',
          triggeredBy: testUserId,
        };
        const created = await drizzleWorkflowRepository.createExecution(executionData);
        const output = { result: 'success', data: { count: 42 } };

        const completed = await drizzleWorkflowRepository.completeExecution(created.id, output);

        expectNotNull(completed);
        expect(completed.status).toBe('COMPLETED');
        expect(completed.output).toEqual(output);
        expect(completed.completedAt).toBeInstanceOf(Date);
      });

      it('should return null for non-existent execution', async () => {
        const completed = await drizzleWorkflowRepository.completeExecution('non-existent-id', { result: 'done' });

        expect(completed).toBeNull();
      });
    });

    describe('failExecution', () => {
      it('should fail execution with error', async () => {
        const executionData: NewWorkflowExecution = {
          workflowId: testWorkflowId,
          status: 'RUNNING',
          triggeredBy: testUserId,
        };
        const created = await drizzleWorkflowRepository.createExecution(executionData);
        const error = 'Step 3 failed: Network timeout';

        const failed = await drizzleWorkflowRepository.failExecution(created.id, error);

        expectNotNull(failed);
        expect(failed.status).toBe('FAILED');
        expect(failed.error).toBe(error);
        expect(failed.completedAt).toBeInstanceOf(Date);
      });

      it('should return null for non-existent execution', async () => {
        const failed = await drizzleWorkflowRepository.failExecution('non-existent-id', 'error');

        expect(failed).toBeNull();
      });
    });

    describe('countExecutionsByStatus', () => {
      it('should count executions by status', async () => {
        await drizzleWorkflowRepository.createExecution({
          workflowId: testWorkflowId,
          status: 'COMPLETED',
          triggeredBy: testUserId,
        });
        await drizzleWorkflowRepository.createExecution({
          workflowId: testWorkflowId,
          status: 'COMPLETED',
          triggeredBy: testUserId,
        });
        await drizzleWorkflowRepository.createExecution({
          workflowId: testWorkflowId,
          status: 'FAILED',
          triggeredBy: testUserId,
        });

        const counts = await drizzleWorkflowRepository.countExecutionsByStatus(testWorkflowId);

        expect(counts.find((c) => c.status === 'COMPLETED')?.count).toBe(2);
        expect(counts.find((c) => c.status === 'FAILED')?.count).toBe(1);
      });

      it('should return empty array for workflow with no executions', async () => {
        const counts = await drizzleWorkflowRepository.countExecutionsByStatus('non-existent-workflow');

        expect(counts).toEqual([]);
      });
    });
  });

  describe('Workflow Template Operations', () => {
    describe('createTemplate', () => {
      it('should create workflow template', async () => {
        const templateData: NewWorkflowTemplate = {
          name: 'Email Automation Template',
          description: 'Template for email workflows',
          category: 'automation',
          config: { maxRetries: 3 },
          steps: [
            { name: 'Send Email', type: 'ACTION', order: 0, config: {} },
          ],
          creatorId: testUserId,
          isPublic: false,
          usageCount: 0,
        };

        const template = await drizzleWorkflowRepository.createTemplate(templateData);

        expectDatabaseRow(template, {
          name: 'Email Automation Template',
          category: 'automation',
          creatorId: testUserId,
        });
        expect(template.steps).toEqual(templateData.steps);
      });

      it('should create public template', async () => {
        const templateData: NewWorkflowTemplate = {
          name: 'Public Template',
          description: 'A public template',
          category: 'general',
          config: {},
          steps: [],
          creatorId: testUserId,
          isPublic: true,
          usageCount: 0,
        };

        const template = await drizzleWorkflowRepository.createTemplate(templateData);

        expect(template.isPublic).toBe(true);
      });
    });

    describe('findTemplateById', () => {
      it('should find template by ID', async () => {
        const templateData: NewWorkflowTemplate = {
          name: 'Find Me Template',
          description: 'Template to find',
          category: 'test',
          config: {},
          steps: [],
          creatorId: testUserId,
          isPublic: false,
          usageCount: 0,
        };
        const created = await drizzleWorkflowRepository.createTemplate(templateData);

        const found = await drizzleWorkflowRepository.findTemplateById(created.id);

        expectNotNull(found);
        expect(found.id).toBe(created.id);
        expect(found.name).toBe('Find Me Template');
      });

      it('should return null for non-existent ID', async () => {
        const found = await drizzleWorkflowRepository.findTemplateById('non-existent-id');

        expect(found).toBeNull();
      });
    });

    describe('findPublicTemplates', () => {
      it('should find all public templates', async () => {
        await drizzleWorkflowRepository.createTemplate({
          name: 'Public 1',
          description: 'Public template 1',
          category: 'automation',
          config: {},
          steps: [],
          creatorId: testUserId,
          isPublic: true,
          usageCount: 0,
        });
        await drizzleWorkflowRepository.createTemplate({
          name: 'Private 1',
          description: 'Private template 1',
          category: 'automation',
          config: {},
          steps: [],
          creatorId: testUserId,
          isPublic: false,
          usageCount: 0,
        });

        const publicTemplates = await drizzleWorkflowRepository.findPublicTemplates();

        expect(publicTemplates.length).toBeGreaterThanOrEqual(1);
        expect(publicTemplates.every((t) => t.isPublic === true)).toBe(true);
      });

      it('should filter by category when provided', async () => {
        await drizzleWorkflowRepository.createTemplate({
          name: 'Automation Template',
          description: 'Automation',
          category: 'automation',
          config: {},
          steps: [],
          creatorId: testUserId,
          isPublic: true,
          usageCount: 0,
        });
        await drizzleWorkflowRepository.createTemplate({
          name: 'Data Template',
          description: 'Data processing',
          category: 'data',
          config: {},
          steps: [],
          creatorId: testUserId,
          isPublic: true,
          usageCount: 0,
        });

        const automationTemplates = await drizzleWorkflowRepository.findPublicTemplates('automation');

        expect(automationTemplates.length).toBeGreaterThanOrEqual(1);
        expect(automationTemplates.every((t) => t.category === 'automation')).toBe(true);
      });

      it('should respect limit parameter', async () => {
        for (let i = 0; i < 5; i++) {
          await drizzleWorkflowRepository.createTemplate({
            name: `Template ${i}`,
            description: 'Template',
            category: 'test',
            config: {},
            steps: [],
            creatorId: testUserId,
            isPublic: true,
            usageCount: i, // Different usage counts
          });
        }

        const templates = await drizzleWorkflowRepository.findPublicTemplates(undefined, 3);

        expect(templates.length).toBeLessThanOrEqual(3);
      });
    });

    describe('findTemplatesByCreatorId', () => {
      it('should find all templates for creator', async () => {
        await drizzleWorkflowRepository.createTemplate({
          name: 'Creator Template 1',
          description: 'Template 1',
          category: 'test',
          config: {},
          steps: [],
          creatorId: testUserId,
          isPublic: false,
          usageCount: 0,
        });
        await drizzleWorkflowRepository.createTemplate({
          name: 'Creator Template 2',
          description: 'Template 2',
          category: 'test',
          config: {},
          steps: [],
          creatorId: testUserId,
          isPublic: true,
          usageCount: 0,
        });

        const templates = await drizzleWorkflowRepository.findTemplatesByCreatorId(testUserId);

        expectArrayLength(templates, 2);
        expect(templates.every((t) => t.creatorId === testUserId)).toBe(true);
      });

      it('should return empty array for creator with no templates', async () => {
        const templates = await drizzleWorkflowRepository.findTemplatesByCreatorId('non-existent-creator');

        expect(templates).toEqual([]);
      });
    });

    describe('incrementTemplateUsage', () => {
      it('should increment template usage count', async () => {
        const templateData: NewWorkflowTemplate = {
          name: 'Usage Template',
          description: 'Template to test usage',
          category: 'test',
          config: {},
          steps: [],
          creatorId: testUserId,
          isPublic: true,
          usageCount: 0,
        };
        const created = await drizzleWorkflowRepository.createTemplate(templateData);

        await drizzleWorkflowRepository.incrementTemplateUsage(created.id);

        const updated = await drizzleWorkflowRepository.findTemplateById(created.id);
        expectNotNull(updated);
        expect(updated.usageCount).toBe(1);
      });
    });

    describe('updateTemplate', () => {
      it('should update template fields', async () => {
        const templateData: NewWorkflowTemplate = {
          name: 'Original Template',
          description: 'Original description',
          category: 'test',
          config: {},
          steps: [],
          creatorId: testUserId,
          isPublic: false,
          usageCount: 0,
        };
        const created = await drizzleWorkflowRepository.createTemplate(templateData);

        const updated = await drizzleWorkflowRepository.updateTemplate(created.id, {
          name: 'Updated Template',
          description: 'Updated description',
          isPublic: true,
        });

        expectNotNull(updated);
        expect(updated.name).toBe('Updated Template');
        expect(updated.description).toBe('Updated description');
        expect(updated.isPublic).toBe(true);
      });

      it('should return null for non-existent template', async () => {
        const updated = await drizzleWorkflowRepository.updateTemplate('non-existent-id', { name: 'New Name' });

        expect(updated).toBeNull();
      });
    });

    describe('deleteTemplate', () => {
      it('should hard delete template', async () => {
        const templateData: NewWorkflowTemplate = {
          name: 'Delete Me Template',
          description: 'Template to delete',
          category: 'test',
          config: {},
          steps: [],
          creatorId: testUserId,
          isPublic: false,
          usageCount: 0,
        };
        const created = await drizzleWorkflowRepository.createTemplate(templateData);

        const result = await drizzleWorkflowRepository.deleteTemplate(created.id);

        expect(result).toBe(true);

        const found = await drizzleWorkflowRepository.findTemplateById(created.id);
        expect(found).toBeNull();
      });

      it('should return false for non-existent template', async () => {
        const result = await drizzleWorkflowRepository.deleteTemplate('non-existent-id');

        expect(result).toBe(false);
      });
    });
  });

  describe('Edge Cases', () => {
    it('should handle workflows with null agentId', async () => {
      const workflowData = WorkflowFactory.build({ userId: testUserId, agentId: null });

      const workflow = await drizzleWorkflowRepository.createWorkflow(workflowData);

      expect(workflow.agentId).toBeNull();
    });

    it('should handle very long workflow descriptions', async () => {
      const longDescription = 'a'.repeat(5000);
      const workflowData = WorkflowFactory.build({ userId: testUserId, description: longDescription });

      const workflow = await drizzleWorkflowRepository.createWorkflow(workflowData);

      expect(workflow.description).toBe(longDescription);
    });

    it('should handle concurrent workflow creates', async () => {
      const workflows = Array.from({ length: 5 }, () => WorkflowFactory.build({ userId: testUserId }));

      const created = await Promise.all(workflows.map((w) => drizzleWorkflowRepository.createWorkflow(w)));

      expect(created).toHaveLength(5);
      const uniqueIds = new Set(created.map((w) => w.id));
      expect(uniqueIds.size).toBe(5); // All IDs should be unique
    });

    it('should handle steps with null dependencies', async () => {
      const workflowData = WorkflowFactory.build({ userId: testUserId });
      const workflow = await drizzleWorkflowRepository.createWorkflow(workflowData);

      const stepData: NewWorkflowStep = {
        workflowId: workflow.id,
        name: 'Step with no deps',
        type: 'ACTION',
        order: 0,
        config: {},
        dependencies: null,
        isActive: true,
      };

      const step = await drizzleWorkflowRepository.createStep(stepData);

      expect(step.dependencies).toBeNull();
    });
  });
});
