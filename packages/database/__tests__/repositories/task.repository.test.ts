/**
 * DrizzleTaskRepository Integration Tests
 * Tests all 24 methods of the task repository
 */

import { drizzleAgentRepository } from '../../src/drizzle/repositories/agent.repository';
import { drizzleTaskRepository } from '../../src/drizzle/repositories/task.repository';
import { drizzleUserRepository } from '../../src/drizzle/repositories/user.repository';
import {
  expectArrayLength,
  expectDatabaseRow,
  expectNotDeleted,
  expectNotNull,
  expectSoftDeleted,
} from '../utils/assertions';
import {
  AgentFactory,
  PipelineFactory,
  TaskExecutionFactory,
  TaskFactory,
  UserFactory,
} from '../utils/factories';

describe('DrizzleTaskRepository', () => {
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

  describe('Task Operations', () => {
    describe('createTask', () => {
      it('should create a new task', async () => {
        const taskData = TaskFactory.build({ userId: testUserId });

        const task = await drizzleTaskRepository.createTask(taskData);

        expectDatabaseRow(task, {
          title: taskData.title,
          userId: testUserId,
          status: taskData.status,
        });
        expect(task.description).toBe(taskData.description);
        expectNotDeleted(task);
      });

      it('should create task with pipeline ID', async () => {
        const pipelineData = PipelineFactory.build({ userId: testUserId });
        const pipeline = await drizzleTaskRepository.createPipeline(pipelineData);
        const taskData = TaskFactory.build({ userId: testUserId, pipelineId: pipeline.id });

        const task = await drizzleTaskRepository.createTask(taskData);

        expect(task.pipelineId).toBe(pipeline.id);
      });
    });

    describe('findTaskById', () => {
      it('should find task by ID', async () => {
        const taskData = TaskFactory.build({ userId: testUserId });
        const created = await drizzleTaskRepository.createTask(taskData);

        const found = await drizzleTaskRepository.findTaskById(created.id);

        expectNotNull(found);
        expect(found.id).toBe(created.id);
        expect(found.title).toBe(created.title);
      });

      it('should return null for non-existent ID', async () => {
        const found = await drizzleTaskRepository.findTaskById('non-existent-id');

        expect(found).toBeNull();
      });

      it('should not return soft-deleted tasks', async () => {
        const taskData = TaskFactory.build({ userId: testUserId });
        const created = await drizzleTaskRepository.createTask(taskData);
        await drizzleTaskRepository.softDeleteTask(created.id);

        const found = await drizzleTaskRepository.findTaskById(created.id);

        expectSoftDeleted(found);
      });
    });

    describe('findTasksByUserId', () => {
      it('should find all tasks for user', async () => {
        await drizzleTaskRepository.createTask(
          TaskFactory.build({ userId: testUserId, title: 'Task 1' })
        );
        await drizzleTaskRepository.createTask(
          TaskFactory.build({ userId: testUserId, title: 'Task 2' })
        );

        const tasks = await drizzleTaskRepository.findTasksByUserId(testUserId);

        expectArrayLength(tasks, 2);
        expect(tasks.every((t) => t.userId === testUserId)).toBe(true);
      });

      it('should return empty array for user with no tasks', async () => {
        const tasks = await drizzleTaskRepository.findTasksByUserId('non-existent-user');

        expect(tasks).toEqual([]);
      });

      it('should not return soft-deleted tasks', async () => {
        const task = await drizzleTaskRepository.createTask(
          TaskFactory.build({ userId: testUserId })
        );
        await drizzleTaskRepository.softDeleteTask(task.id);

        const tasks = await drizzleTaskRepository.findTasksByUserId(testUserId);

        expect(tasks).toEqual([]);
      });
    });

    describe('findTasksByPipelineId', () => {
      it('should find all tasks in pipeline', async () => {
        const pipelineData = PipelineFactory.build({ userId: testUserId });
        const pipeline = await drizzleTaskRepository.createPipeline(pipelineData);

        await drizzleTaskRepository.createTask(
          TaskFactory.build({ userId: testUserId, pipelineId: pipeline.id })
        );
        await drizzleTaskRepository.createTask(
          TaskFactory.build({ userId: testUserId, pipelineId: pipeline.id })
        );

        const tasks = await drizzleTaskRepository.findTasksByPipelineId(pipeline.id);

        expectArrayLength(tasks, 2);
        expect(tasks.every((t) => t.pipelineId === pipeline.id)).toBe(true);
      });

      it('should return empty array for pipeline with no tasks', async () => {
        const tasks = await drizzleTaskRepository.findTasksByPipelineId('non-existent-pipeline');

        expect(tasks).toEqual([]);
      });
    });

    describe('findTasksByStatus', () => {
      it('should find tasks by status', async () => {
        await drizzleTaskRepository.createTask(
          TaskFactory.build({ userId: testUserId, status: 'PENDING' })
        );
        await drizzleTaskRepository.createTask(
          TaskFactory.build({ userId: testUserId, status: 'IN_PROGRESS' })
        );
        await drizzleTaskRepository.createTask(
          TaskFactory.build({ userId: testUserId, status: 'PENDING' })
        );

        const pending = await drizzleTaskRepository.findTasksByStatus('PENDING');

        expectArrayLength(pending, 2);
        expect(pending.every((t) => t.status === 'PENDING')).toBe(true);
      });

      it('should filter by user ID when provided', async () => {
        const otherUserData = await UserFactory.build();
        const otherUser = await drizzleUserRepository.create(otherUserData);

        await drizzleTaskRepository.createTask(
          TaskFactory.build({ userId: testUserId, status: 'PENDING' })
        );
        await drizzleTaskRepository.createTask(
          TaskFactory.build({ userId: otherUser.id, status: 'PENDING' })
        );

        const tasks = await drizzleTaskRepository.findTasksByStatus('PENDING', testUserId);

        expectArrayLength(tasks, 1);
        expect(tasks[0].userId).toBe(testUserId);
      });

      it('should return empty array for status with no tasks', async () => {
        const tasks = await drizzleTaskRepository.findTasksByStatus('COMPLETED');

        expect(tasks).toEqual([]);
      });
    });

    describe('findTasksByStatuses', () => {
      it('should find tasks by multiple statuses', async () => {
        await drizzleTaskRepository.createTask(
          TaskFactory.build({ userId: testUserId, status: 'PENDING' })
        );
        await drizzleTaskRepository.createTask(
          TaskFactory.build({ userId: testUserId, status: 'IN_PROGRESS' })
        );
        await drizzleTaskRepository.createTask(
          TaskFactory.build({ userId: testUserId, status: 'COMPLETED' })
        );

        const tasks = await drizzleTaskRepository.findTasksByStatuses(['PENDING', 'IN_PROGRESS']);

        expectArrayLength(tasks, 2);
        expect(tasks.every((t) => ['PENDING', 'IN_PROGRESS'].includes(t.status))).toBe(true);
      });

      it('should filter by user ID when provided', async () => {
        const otherUserData = await UserFactory.build();
        const otherUser = await drizzleUserRepository.create(otherUserData);

        await drizzleTaskRepository.createTask(
          TaskFactory.build({ userId: testUserId, status: 'PENDING' })
        );
        await drizzleTaskRepository.createTask(
          TaskFactory.build({ userId: otherUser.id, status: 'PENDING' })
        );

        const tasks = await drizzleTaskRepository.findTasksByStatuses(['PENDING'], testUserId);

        expectArrayLength(tasks, 1);
        expect(tasks[0].userId).toBe(testUserId);
      });
    });

    describe('findTasksAssignedToAgent', () => {
      it('should find tasks assigned to agent', async () => {
        await drizzleTaskRepository.createTask(
          TaskFactory.build({ userId: testUserId, assignedToId: testAgentId })
        );
        await drizzleTaskRepository.createTask(
          TaskFactory.build({ userId: testUserId, assignedToId: testAgentId })
        );

        const tasks = await drizzleTaskRepository.findTasksAssignedToAgent(testAgentId);

        expectArrayLength(tasks, 2);
        expect(tasks.every((t) => t.assignedToId === testAgentId)).toBe(true);
      });

      it('should return empty array for agent with no tasks', async () => {
        const tasks = await drizzleTaskRepository.findTasksAssignedToAgent('non-existent-agent');

        expect(tasks).toEqual([]);
      });
    });

    describe('findTasksByPriority', () => {
      it('should find tasks by priority', async () => {
        await drizzleTaskRepository.createTask(
          TaskFactory.build({ userId: testUserId, priority: 'HIGH' })
        );
        await drizzleTaskRepository.createTask(
          TaskFactory.build({ userId: testUserId, priority: 'LOW' })
        );
        await drizzleTaskRepository.createTask(
          TaskFactory.build({ userId: testUserId, priority: 'HIGH' })
        );

        const highPriority = await drizzleTaskRepository.findTasksByPriority('HIGH');

        expectArrayLength(highPriority, 2);
        expect(highPriority.every((t) => t.priority === 'HIGH')).toBe(true);
      });

      it('should filter by user ID when provided', async () => {
        const otherUserData = await UserFactory.build();
        const otherUser = await drizzleUserRepository.create(otherUserData);

        await drizzleTaskRepository.createTask(
          TaskFactory.build({ userId: testUserId, priority: 'HIGH' })
        );
        await drizzleTaskRepository.createTask(
          TaskFactory.build({ userId: otherUser.id, priority: 'HIGH' })
        );

        const tasks = await drizzleTaskRepository.findTasksByPriority('HIGH', testUserId);

        expectArrayLength(tasks, 1);
        expect(tasks[0].userId).toBe(testUserId);
      });
    });

    describe('updateTask', () => {
      it('should update task fields', async () => {
        const taskData = TaskFactory.build({ userId: testUserId });
        const created = await drizzleTaskRepository.createTask(taskData);

        const updated = await drizzleTaskRepository.updateTask(created.id, {
          title: 'Updated Title',
          description: 'Updated Description',
        });

        expectNotNull(updated);
        expect(updated.title).toBe('Updated Title');
        expect(updated.description).toBe('Updated Description');
        expect(updated.updatedAt.getTime()).toBeGreaterThan(created.updatedAt.getTime());
      });

      it('should return null for non-existent task', async () => {
        const updated = await drizzleTaskRepository.updateTask('non-existent-id', {
          title: 'New Title',
        });

        expect(updated).toBeNull();
      });
    });

    describe('updateTaskStatus', () => {
      it('should update task status to IN_PROGRESS and set startTime', async () => {
        const taskData = TaskFactory.build({ userId: testUserId, status: 'PENDING' });
        const created = await drizzleTaskRepository.createTask(taskData);

        const updated = await drizzleTaskRepository.updateTaskStatus(created.id, 'IN_PROGRESS');

        expectNotNull(updated);
        expect(updated.status).toBe('IN_PROGRESS');
        expect(updated.startTime).toBeInstanceOf(Date);
      });

      it('should update task status to COMPLETED and set endTime', async () => {
        const taskData = TaskFactory.build({ userId: testUserId, status: 'IN_PROGRESS' });
        const created = await drizzleTaskRepository.createTask(taskData);

        const updated = await drizzleTaskRepository.updateTaskStatus(created.id, 'COMPLETED');

        expectNotNull(updated);
        expect(updated.status).toBe('COMPLETED');
        expect(updated.endTime).toBeInstanceOf(Date);
      });

      it('should update task status to FAILED and set endTime', async () => {
        const taskData = TaskFactory.build({ userId: testUserId, status: 'IN_PROGRESS' });
        const created = await drizzleTaskRepository.createTask(taskData);

        const updated = await drizzleTaskRepository.updateTaskStatus(created.id, 'FAILED');

        expectNotNull(updated);
        expect(updated.status).toBe('FAILED');
        expect(updated.endTime).toBeInstanceOf(Date);
      });

      it('should return null for non-existent task', async () => {
        const updated = await drizzleTaskRepository.updateTaskStatus(
          'non-existent-id',
          'COMPLETED'
        );

        expect(updated).toBeNull();
      });
    });

    describe('assignTask', () => {
      it('should assign task to agent', async () => {
        const taskData = TaskFactory.build({ userId: testUserId });
        const created = await drizzleTaskRepository.createTask(taskData);

        const updated = await drizzleTaskRepository.assignTask(created.id, testAgentId);

        expectNotNull(updated);
        expect(updated.assignedToId).toBe(testAgentId);
      });

      it('should return null for non-existent task', async () => {
        const updated = await drizzleTaskRepository.assignTask('non-existent-id', testAgentId);

        expect(updated).toBeNull();
      });
    });

    describe('softDeleteTask', () => {
      it('should soft delete task', async () => {
        const taskData = TaskFactory.build({ userId: testUserId });
        const created = await drizzleTaskRepository.createTask(taskData);

        const result = await drizzleTaskRepository.softDeleteTask(created.id);

        expect(result).toBe(true);

        // Task should not be found by normal queries
        const found = await drizzleTaskRepository.findTaskById(created.id);
        expectSoftDeleted(found);
      });

      it('should return false for non-existent task', async () => {
        const result = await drizzleTaskRepository.softDeleteTask('non-existent-id');

        expect(result).toBe(false);
      });
    });

    describe('hardDeleteTask', () => {
      it('should hard delete task', async () => {
        const taskData = TaskFactory.build({ userId: testUserId });
        const created = await drizzleTaskRepository.createTask(taskData);

        const result = await drizzleTaskRepository.hardDeleteTask(created.id);

        expect(result).toBe(true);

        // Task should not be found even with direct query
        const found = await drizzleTaskRepository.findTaskById(created.id);
        expect(found).toBeNull();
      });

      it('should return false for non-existent task', async () => {
        const result = await drizzleTaskRepository.hardDeleteTask('non-existent-id');

        expect(result).toBe(false);
      });
    });

    describe('countTasksByStatus', () => {
      it('should count tasks by status', async () => {
        await drizzleTaskRepository.createTask(
          TaskFactory.build({ userId: testUserId, status: 'PENDING' })
        );
        await drizzleTaskRepository.createTask(
          TaskFactory.build({ userId: testUserId, status: 'PENDING' })
        );
        await drizzleTaskRepository.createTask(
          TaskFactory.build({ userId: testUserId, status: 'IN_PROGRESS' })
        );

        const counts = await drizzleTaskRepository.countTasksByStatus();

        expect(counts.find((c) => c.status === 'PENDING')?.count).toBe(2);
        expect(counts.find((c) => c.status === 'IN_PROGRESS')?.count).toBe(1);
      });

      it('should filter by user ID when provided', async () => {
        const otherUserData = await UserFactory.build();
        const otherUser = await drizzleUserRepository.create(otherUserData);

        await drizzleTaskRepository.createTask(
          TaskFactory.build({ userId: testUserId, status: 'PENDING' })
        );
        await drizzleTaskRepository.createTask(
          TaskFactory.build({ userId: otherUser.id, status: 'PENDING' })
        );

        const counts = await drizzleTaskRepository.countTasksByStatus(testUserId);

        expect(counts.find((c) => c.status === 'PENDING')?.count).toBe(1);
      });

      it('should return empty array for user with no tasks', async () => {
        const counts = await drizzleTaskRepository.countTasksByStatus('non-existent-user');

        expect(counts).toEqual([]);
      });
    });
  });

  describe('Pipeline Operations', () => {
    describe('createPipeline', () => {
      it('should create a new pipeline', async () => {
        const pipelineData = PipelineFactory.build({ userId: testUserId });

        const pipeline = await drizzleTaskRepository.createPipeline(pipelineData);

        expectDatabaseRow(pipeline, {
          name: pipelineData.name,
          userId: testUserId,
        });
        expect(pipeline.description).toBe(pipelineData.description);
        expectNotDeleted(pipeline);
      });

      it('should create pipeline with configuration', async () => {
        const config = { maxConcurrent: 5, timeout: 3600 };
        const pipelineData = PipelineFactory.build({ userId: testUserId, configuration: config });

        const pipeline = await drizzleTaskRepository.createPipeline(pipelineData);

        expect(pipeline.configuration).toEqual(config);
      });
    });

    describe('findPipelineById', () => {
      it('should find pipeline by ID', async () => {
        const pipelineData = PipelineFactory.build({ userId: testUserId });
        const created = await drizzleTaskRepository.createPipeline(pipelineData);

        const found = await drizzleTaskRepository.findPipelineById(created.id);

        expectNotNull(found);
        expect(found.id).toBe(created.id);
        expect(found.name).toBe(created.name);
      });

      it('should return null for non-existent ID', async () => {
        const found = await drizzleTaskRepository.findPipelineById('non-existent-id');

        expect(found).toBeNull();
      });

      it('should not return soft-deleted pipelines', async () => {
        const pipelineData = PipelineFactory.build({ userId: testUserId });
        const created = await drizzleTaskRepository.createPipeline(pipelineData);
        await drizzleTaskRepository.softDeletePipeline(created.id);

        const found = await drizzleTaskRepository.findPipelineById(created.id);

        expectSoftDeleted(found);
      });
    });

    describe('findPipelinesByUserId', () => {
      it('should find all pipelines for user', async () => {
        await drizzleTaskRepository.createPipeline(PipelineFactory.build({ userId: testUserId }));
        await drizzleTaskRepository.createPipeline(PipelineFactory.build({ userId: testUserId }));

        const pipelines = await drizzleTaskRepository.findPipelinesByUserId(testUserId);

        expectArrayLength(pipelines, 2);
        expect(pipelines.every((p) => p.userId === testUserId)).toBe(true);
      });

      it('should return empty array for user with no pipelines', async () => {
        const pipelines = await drizzleTaskRepository.findPipelinesByUserId('non-existent-user');

        expect(pipelines).toEqual([]);
      });
    });

    describe('updatePipeline', () => {
      it('should update pipeline fields', async () => {
        const pipelineData = PipelineFactory.build({ userId: testUserId });
        const created = await drizzleTaskRepository.createPipeline(pipelineData);

        const updated = await drizzleTaskRepository.updatePipeline(created.id, {
          name: 'Updated Pipeline',
          description: 'Updated Description',
        });

        expectNotNull(updated);
        expect(updated.name).toBe('Updated Pipeline');
        expect(updated.description).toBe('Updated Description');
        expect(updated.updatedAt.getTime()).toBeGreaterThan(created.updatedAt.getTime());
      });

      it('should return null for non-existent pipeline', async () => {
        const updated = await drizzleTaskRepository.updatePipeline('non-existent-id', {
          name: 'New Name',
        });

        expect(updated).toBeNull();
      });
    });

    describe('softDeletePipeline', () => {
      it('should soft delete pipeline', async () => {
        const pipelineData = PipelineFactory.build({ userId: testUserId });
        const created = await drizzleTaskRepository.createPipeline(pipelineData);

        const result = await drizzleTaskRepository.softDeletePipeline(created.id);

        expect(result).toBe(true);

        // Pipeline should not be found by normal queries
        const found = await drizzleTaskRepository.findPipelineById(created.id);
        expectSoftDeleted(found);
      });

      it('should return false for non-existent pipeline', async () => {
        const result = await drizzleTaskRepository.softDeletePipeline('non-existent-id');

        expect(result).toBe(false);
      });
    });
  });

  describe('Execution Operations', () => {
    let testTaskId: string;

    beforeEach(async () => {
      const taskData = TaskFactory.build({ userId: testUserId });
      const task = await drizzleTaskRepository.createTask(taskData);
      testTaskId = task.id;
    });

    describe('createExecution', () => {
      it('should create task execution', async () => {
        const executionData = TaskExecutionFactory.build({ taskId: testTaskId });

        const execution = await drizzleTaskRepository.createExecution(executionData);

        expectDatabaseRow(execution, {
          taskId: testTaskId,
          status: executionData.status,
        });
        expect(execution.output).toEqual(executionData.output);
      });

      it('should create execution with output', async () => {
        const output = { environment: 'test', version: '1.0.0' };
        const executionData = TaskExecutionFactory.build({ taskId: testTaskId, output });

        const execution = await drizzleTaskRepository.createExecution(executionData);

        expect(execution.output).toEqual(output);
      });
    });

    describe('findExecutionsByTaskId', () => {
      it('should find all executions for task', async () => {
        await drizzleTaskRepository.createExecution(
          TaskExecutionFactory.build({ taskId: testTaskId })
        );
        await drizzleTaskRepository.createExecution(
          TaskExecutionFactory.build({ taskId: testTaskId })
        );

        const executions = await drizzleTaskRepository.findExecutionsByTaskId(testTaskId);

        expectArrayLength(executions, 2);
        expect(executions.every((e) => e.taskId === testTaskId)).toBe(true);
      });

      it('should return empty array for task with no executions', async () => {
        const executions = await drizzleTaskRepository.findExecutionsByTaskId('non-existent-task');

        expect(executions).toEqual([]);
      });

      it('should order by startedAt descending', async () => {
        const exec1 = await drizzleTaskRepository.createExecution(
          TaskExecutionFactory.build({ taskId: testTaskId })
        );
        // Small delay to ensure different timestamps
        await new Promise((resolve) => setTimeout(resolve, 10));
        const exec2 = await drizzleTaskRepository.createExecution(
          TaskExecutionFactory.build({ taskId: testTaskId })
        );

        const executions = await drizzleTaskRepository.findExecutionsByTaskId(testTaskId);

        // Most recent first
        expect(executions[0].id).toBe(exec2.id);
        expect(executions[1].id).toBe(exec1.id);
      });
    });

    describe('updateExecution', () => {
      it('should update execution fields', async () => {
        const executionData = TaskExecutionFactory.build({ taskId: testTaskId });
        const created = await drizzleTaskRepository.createExecution(executionData);

        const updated = await drizzleTaskRepository.updateExecution(created.id, {
          status: 'RUNNING',
          output: { progress: 50 },
        });

        expectNotNull(updated);
        expect(updated.status).toBe('RUNNING');
        expect(updated.output).toEqual({ progress: 50 });
      });

      it('should return null for non-existent execution', async () => {
        const updated = await drizzleTaskRepository.updateExecution('non-existent-id', {
          status: 'RUNNING',
        });

        expect(updated).toBeNull();
      });
    });

    describe('completeExecution', () => {
      it('should complete execution with output', async () => {
        const executionData = TaskExecutionFactory.build({ taskId: testTaskId, status: 'RUNNING' });
        const created = await drizzleTaskRepository.createExecution(executionData);
        const output = { result: 'success', value: 42 };

        const completed = await drizzleTaskRepository.completeExecution(created.id, output);

        expectNotNull(completed);
        expect(completed.status).toBe('COMPLETED');
        expect(completed.output).toEqual(output);
        expect(completed.completedAt).toBeInstanceOf(Date);
      });

      it('should return null for non-existent execution', async () => {
        const completed = await drizzleTaskRepository.completeExecution('non-existent-id', {
          result: 'done',
        });

        expect(completed).toBeNull();
      });
    });

    describe('failExecution', () => {
      it('should fail execution with error', async () => {
        const executionData = TaskExecutionFactory.build({ taskId: testTaskId, status: 'RUNNING' });
        const created = await drizzleTaskRepository.createExecution(executionData);
        const error = 'Connection timeout';

        const failed = await drizzleTaskRepository.failExecution(created.id, error);

        expectNotNull(failed);
        expect(failed.status).toBe('FAILED');
        expect(failed.error).toBe(error);
        expect(failed.completedAt).toBeInstanceOf(Date);
      });

      it('should return null for non-existent execution', async () => {
        const failed = await drizzleTaskRepository.failExecution('non-existent-id', 'error');

        expect(failed).toBeNull();
      });
    });
  });

  describe('Edge Cases', () => {
    it('should handle tasks with null assignedToId', async () => {
      const taskData = TaskFactory.build({ userId: testUserId, assignedToId: null });

      const task = await drizzleTaskRepository.createTask(taskData);

      expect(task.assignedToId).toBeNull();
    });

    it('should handle tasks with null pipelineId', async () => {
      const taskData = TaskFactory.build({ userId: testUserId, pipelineId: null });

      const task = await drizzleTaskRepository.createTask(taskData);

      expect(task.pipelineId).toBeNull();
    });

    it('should handle very long task descriptions', async () => {
      const longDescription = 'a'.repeat(5000);
      const taskData = TaskFactory.build({ userId: testUserId, description: longDescription });

      const task = await drizzleTaskRepository.createTask(taskData);

      expect(task.description).toBe(longDescription);
    });

    it('should handle concurrent task creates', async () => {
      const tasks = await TaskFactory.buildList(5, { userId: testUserId });

      const created = await Promise.all(tasks.map((t) => drizzleTaskRepository.createTask(t)));

      expect(created).toHaveLength(5);
      const uniqueIds = new Set(created.map((t) => t.id));
      expect(uniqueIds.size).toBe(5); // All IDs should be unique
    });

    it('should handle executions with null error field', async () => {
      const taskData = TaskFactory.build({ userId: testUserId });
      const task = await drizzleTaskRepository.createTask(taskData);
      const executionData = TaskExecutionFactory.build({ taskId: task.id, error: null });

      const execution = await drizzleTaskRepository.createExecution(executionData);

      expect(execution.error).toBeNull();
    });
  });
});
