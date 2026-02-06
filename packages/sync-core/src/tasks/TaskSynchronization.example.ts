/**
 * Task Synchronization System Usage Examples
 *
 * This file demonstrates how to use the enhanced task management system
 * with real-time synchronization capabilities.
 */

import {
  EnhancedTaskData,
  EnhancedTaskManagementService,
  TaskNotificationRule,
  TaskNotificationService,
  TaskSyncData,
  TaskSynchronizationService,
} from './index';

// Mock services for demonstration
const mockTaskSyncService = {} as TaskSynchronizationService;
const mockTaskManagementService = {} as EnhancedTaskManagementService;
const mockNotificationService = {} as TaskNotificationService;

/**
 * Example 1: Creating and Managing Tasks with Real-time Sync
 */
export async function createAndManageTaskExample() {
  console.log('=== Task Creation and Management Example ===');

  // Create a new task with dependencies
  const newTaskData: Omit<EnhancedTaskData, 'id' | 'version' | 'lastModified' | 'modifiedBy'> = {
    type: 'data_processing',
    status: 'PENDING',
    priority: 'HIGH',
    pipelineId: 'pipeline-123',
    userId: 'user-456',
    dependencies: ['task-001', 'task-002'], // This task depends on two others
    estimatedDuration: 300000, // 5 minutes
    tags: ['data', 'processing', 'urgent'],
    metadata: {
      inputDataSize: '10GB',
      processingType: 'batch',
      requiredResources: {
        cpu: 4,
        memory: '8GB',
      },
    },
  };

  try {
    // Create task with real-time synchronization
    const createdTask = await mockTaskManagementService.createTask(
      newTaskData,
      'tenant-789' // Tenant ID for multi-tenant isolation
    );

    console.log('Created task:', createdTask.id);
    console.log('Task sync status:', createdTask.syncStatus);

    // Update task progress during execution
    await mockTaskManagementService.updateTaskProgress(
      createdTask.id,
      25,
      {
        currentStep: 'data_validation',
        processedRecords: 25000,
      },
      'tenant-789'
    );

    console.log('Updated task progress to 25%');

    // Complete the task
    await mockTaskManagementService.updateTask(
      createdTask.id,
      {
        status: 'COMPLETED',
        result: {
          processedRecords: 100000,
          outputFiles: ['output1.csv', 'output2.json'],
          executionTime: 280000,
        },
        progress: 100,
      },
      'user-456',
      'tenant-789'
    );

    console.log('Task completed successfully');
  } catch (error) {
    console.error('Error managing task:', error);
  }
}

/**
 * Example 2: Task Execution with Context and Monitoring
 */
export async function taskExecutionExample() {
  console.log('=== Task Execution Example ===');

  const taskId = 'task-123';
  const tenantId = 'tenant-789';

  try {
    // Execute task with custom execution context
    const executionId = await mockTaskManagementService.executeTask(
      taskId,
      {
        environment: {
          NODE_ENV: 'production',
          API_ENDPOINT: 'https://api.example.com',
          BATCH_SIZE: 1000,
        },
        resources: {
          cpu: 2,
          memory: 4096, // 4GB in MB
          storage: 10240, // 10GB in MB
        },
        timeout: 600000, // 10 minutes
        retryPolicy: {
          maxRetries: 3,
          backoffStrategy: 'exponential',
          baseDelay: 2000,
        },
      },
      tenantId
    );

    console.log('Started task execution:', executionId);

    // Simulate progress updates during execution
    const progressUpdates = [
      { progress: 10, step: 'initialization' },
      { progress: 30, step: 'data_loading' },
      { progress: 60, step: 'processing' },
      { progress: 90, step: 'validation' },
    ];

    for (const update of progressUpdates) {
      await mockTaskManagementService.updateTaskProgress(
        taskId,
        update.progress,
        { currentStep: update.step },
        tenantId
      );

      console.log(`Progress: ${update.progress}% - ${update.step}`);

      // Simulate processing time
      await new Promise((resolve) => setTimeout(resolve, 1000));
    }

    // Complete execution with results
    await mockTaskManagementService.completeTaskExecution(
      executionId,
      {
        success: true,
        recordsProcessed: 50000,
        outputSize: '2.5GB',
        metrics: {
          avgProcessingTime: 120,
          errorRate: 0.001,
          throughput: 416.67, // records per second
        },
      },
      undefined, // No error
      tenantId
    );

    console.log('Task execution completed successfully');
  } catch (error) {
    console.error('Error during task execution:', error);

    // Handle execution failure
    try {
      await mockTaskManagementService.completeTaskExecution(
        'execution-id',
        undefined,
        error instanceof Error ? error.message : String(error),
        tenantId
      );
    } catch (completionError) {
      console.error('Error completing failed execution:', completionError);
    }
  }
}

/**
 * Example 3: Managing Task Dependencies and Workflows
 */
export async function taskDependencyExample() {
  console.log('=== Task Dependency Management Example ===');

  const tenantId = 'tenant-789';

  try {
    // Create a workflow with dependent tasks
    const tasks = [
      {
        id: 'extract-task',
        type: 'data_extraction',
        dependencies: [], // No dependencies - can start immediately
      },
      {
        id: 'transform-task',
        type: 'data_transformation',
        dependencies: ['extract-task'], // Depends on extraction
      },
      {
        id: 'load-task',
        type: 'data_loading',
        dependencies: ['transform-task'], // Depends on transformation
      },
      {
        id: 'validate-task',
        type: 'data_validation',
        dependencies: ['load-task'], // Depends on loading
      },
    ];

    // Set up dependencies for each task
    for (const task of tasks) {
      await mockTaskSyncService.updateTaskDependencies(task.id, task.dependencies, tenantId);

      console.log(`Set dependencies for ${task.id}:`, task.dependencies);
    }

    // Get task relationships
    for (const task of tasks) {
      const relationships = await mockTaskManagementService.getTaskRelationships(task.id);

      console.log(`Task ${task.id}:`);
      console.log('  Dependencies:', relationships.dependencies);
      console.log('  Dependents:', relationships.dependents);

      if (relationships.workflowIntegration) {
        console.log('  Workflow Integration:', relationships.workflowIntegration);
      }
    }

    // Simulate task completion chain
    console.log('\nSimulating task completion chain...');

    for (const task of tasks) {
      // Check if dependencies are met
      const dependencies = await mockTaskSyncService.getTaskDependencies(task.id);

      if (dependencies.length === 0) {
        console.log(`Starting ${task.id} (no dependencies)`);
      } else {
        console.log(`${task.id} waiting for dependencies:`, dependencies);
      }

      // Simulate task completion
      const taskData: TaskSyncData = {
        id: task.id,
        type: task.type,
        status: 'COMPLETED',
        priority: 'MEDIUM',
        pipelineId: 'etl-pipeline',
        userId: 'user-456',
        version: 1,
        lastModified: new Date(),
        modifiedBy: 'system',
      };

      await mockTaskSyncService.syncTaskData(taskData, tenantId);
      console.log(`Completed ${task.id}`);
    }
  } catch (error) {
    console.error('Error managing task dependencies:', error);
  }
}

/**
 * Example 4: Conflict Resolution
 */
export async function conflictResolutionExample() {
  console.log('=== Conflict Resolution Example ===');

  const taskId = 'task-456';
  const tenantId = 'tenant-789';

  // Simulate concurrent updates from different users
  const localVersion: TaskSyncData = {
    id: taskId,
    type: 'data_analysis',
    status: 'IN_PROGRESS',
    priority: 'HIGH',
    pipelineId: 'analysis-pipeline',
    userId: 'user-123',
    version: 5,
    lastModified: new Date('2023-12-01T10:00:00Z'),
    modifiedBy: 'user-123',
    metadata: {
      analysisType: 'statistical',
      parameters: { confidence: 0.95 },
    },
  };

  const remoteVersion: TaskSyncData = {
    id: taskId,
    type: 'data_analysis',
    status: 'IN_PROGRESS',
    priority: 'URGENT', // Different priority
    pipelineId: 'analysis-pipeline',
    userId: 'user-123',
    version: 5, // Same version - conflict!
    lastModified: new Date('2023-12-01T10:05:00Z'), // 5 minutes later
    modifiedBy: 'user-456', // Different user
    metadata: {
      analysisType: 'machine_learning', // Different analysis type
      parameters: { algorithm: 'random_forest' },
    },
  };

  try {
    // Resolve the conflict
    const resolution = await mockTaskSyncService.resolveTaskConflict(
      taskId,
      localVersion,
      remoteVersion,
      tenantId
    );

    console.log('Conflict resolved using strategy:', resolution.strategy);
    console.log('Resolved data:', JSON.stringify(resolution.resolvedData, null, 2));

    if (resolution.metadata) {
      console.log('Resolution metadata:', resolution.metadata);
    }
  } catch (error) {
    console.error('Error resolving conflict:', error);
  }
}

/**
 * Example 5: Real-time Notifications
 */
export async function notificationExample() {
  console.log('=== Task Notification Example ===');

  const userId = 'user-123';
  const tenantId = 'tenant-789';

  try {
    // Create custom notification rules
    const urgentTaskRule: Omit<TaskNotificationRule, 'id' | 'createdAt' | 'updatedAt'> = {
      userId,
      tenantId,
      eventTypes: ['task_created', 'task_updated', 'task_failed'],
      conditions: {
        priorities: ['URGENT'],
        taskTypes: ['critical_analysis', 'emergency_processing'],
      },
      channels: [
        {
          type: 'websocket',
          config: {
            realTime: true,
            persistent: true,
            sound: true,
          },
          priority: 'urgent',
        },
      ],
      isActive: true,
    };

    const completionRule: Omit<TaskNotificationRule, 'id' | 'createdAt' | 'updatedAt'> = {
      userId,
      tenantId,
      eventTypes: ['task_completed'],
      conditions: {
        priorities: ['HIGH', 'URGENT'],
      },
      channels: [
        {
          type: 'websocket',
          config: { realTime: true },
          priority: 'high',
        },
      ],
      isActive: true,
    };

    // Create notification rules
    const urgentRule = await mockNotificationService.createNotificationRule(urgentTaskRule);
    const completionRuleCreated =
      await mockNotificationService.createNotificationRule(completionRule);

    console.log('Created notification rules:', urgentRule.id, completionRuleCreated.id);

    // Get notification history
    const history = await mockNotificationService.getNotificationHistory(userId, {
      startDate: new Date(Date.now() - 24 * 60 * 60 * 1000), // Last 24 hours
      limit: 10,
    });

    console.log(`Found ${history.length} notifications in the last 24 hours`);

    // Get notification statistics
    const stats = await mockNotificationService.getNotificationStats(userId);
    console.log('Notification stats:', stats);

    // Acknowledge a notification
    if (history.length > 0) {
      await mockNotificationService.acknowledgeNotification(history[0].notificationId, userId);
      console.log('Acknowledged notification:', history[0].notificationId);
    }
  } catch (error) {
    console.error('Error managing notifications:', error);
  }
}

/**
 * Example 6: Monitoring and Metrics
 */
export async function monitoringExample() {
  console.log('=== Task Monitoring Example ===');

  const userId = 'user-123';

  try {
    // Get task sync metrics
    const syncMetrics = await mockTaskManagementService.getTaskSyncMetrics();
    console.log('Task sync metrics:', syncMetrics);

    // Get active executions
    const activeExecutions = await mockTaskManagementService.getActiveExecutions();
    console.log(`Active executions: ${activeExecutions.length}`);

    activeExecutions.forEach((execution) => {
      console.log(`  Execution ${execution.id}:`);
      console.log(`    Task: ${execution.taskId}`);
      console.log(`    Timeout: ${execution.timeout}ms`);
      console.log(`    Resources:`, execution.resources);
    });

    // Get user tasks with filtering
    const userTasks = await mockTaskManagementService.getUserTasks(userId, {
      status: ['IN_PROGRESS', 'PENDING'],
      priority: ['HIGH', 'URGENT'],
      limit: 20,
    });

    console.log(`Found ${userTasks.length} high-priority active tasks for user`);

    userTasks.forEach((task) => {
      console.log(`  Task ${task.id}:`);
      console.log(`    Type: ${task.type}`);
      console.log(`    Status: ${task.status}`);
      console.log(`    Priority: ${task.priority}`);
      console.log(`    Progress: ${task.progress || 0}%`);
      console.log(`    Sync Status: ${task.syncStatus}`);
    });

    // Get sync status for specific task
    if (userTasks.length > 0) {
      const taskSyncStatus = await mockTaskSyncService.getTaskSyncStatus(userTasks[0].id);
      console.log('Task sync status:', taskSyncStatus);
    }
  } catch (error) {
    console.error('Error getting monitoring data:', error);
  }
}

/**
 * Example 7: Bulk Operations and Batch Processing
 */
export async function bulkOperationsExample() {
  console.log('=== Bulk Operations Example ===');

  const tenantId = 'tenant-789';
  const userId = 'user-123';

  try {
    // Create multiple related tasks
    const batchTasks = [
      {
        type: 'data_ingestion',
        priority: 'HIGH' as const,
        data: { source: 'database_1', table: 'users' },
      },
      {
        type: 'data_ingestion',
        priority: 'HIGH' as const,
        data: { source: 'database_1', table: 'orders' },
      },
      {
        type: 'data_ingestion',
        priority: 'HIGH' as const,
        data: { source: 'database_1', table: 'products' },
      },
    ];

    const createdTasks: EnhancedTaskData[] = [];

    // Create tasks in batch
    for (const [index, taskData] of batchTasks.entries()) {
      const task = await mockTaskManagementService.createTask(
        {
          ...taskData,
          status: 'PENDING',
          pipelineId: 'batch-ingestion-pipeline',
          userId,
          tags: ['batch', 'ingestion', `batch-${Date.now()}`],
          metadata: {
            batchId: `batch-${Date.now()}`,
            batchIndex: index,
            totalBatchSize: batchTasks.length,
          },
        },
        tenantId
      );

      createdTasks.push(task);
      console.log(`Created batch task ${index + 1}/${batchTasks.length}: ${task.id}`);
    }

    // Set up dependencies (sequential processing)
    for (let i = 1; i < createdTasks.length; i++) {
      await mockTaskSyncService.updateTaskDependencies(
        createdTasks[i].id,
        [createdTasks[i - 1].id],
        tenantId
      );
      console.log(`Task ${createdTasks[i].id} depends on ${createdTasks[i - 1].id}`);
    }

    // Monitor batch progress
    console.log('\nMonitoring batch progress...');

    let completedCount = 0;
    const totalTasks = createdTasks.length;

    // Simulate batch execution
    for (const task of createdTasks) {
      // Execute task
      const executionId = await mockTaskManagementService.executeTask(
        task.id,
        {
          timeout: 120000,
          retryPolicy: {
            maxRetries: 2,
            backoffStrategy: 'linear',
            baseDelay: 5000,
          },
        },
        tenantId
      );

      // Simulate processing
      await new Promise((resolve) => setTimeout(resolve, 2000));

      // Complete task
      await mockTaskManagementService.completeTaskExecution(
        executionId,
        {
          recordsProcessed: Math.floor(Math.random() * 10000) + 1000,
          processingTime: Math.floor(Math.random() * 60000) + 30000,
        },
        undefined,
        tenantId
      );

      completedCount++;
      const progress = (completedCount / totalTasks) * 100;
      console.log(`Batch progress: ${progress.toFixed(1)}% (${completedCount}/${totalTasks})`);
    }

    console.log('Batch processing completed successfully');
  } catch (error) {
    console.error('Error in bulk operations:', error);
  }
}

/**
 * Main example runner
 */
export async function runAllExamples() {
  console.log('🚀 Starting Task Synchronization Examples\n');

  try {
    await createAndManageTaskExample();
    console.log('\n' + '='.repeat(50) + '\n');

    await taskExecutionExample();
    console.log('\n' + '='.repeat(50) + '\n');

    await taskDependencyExample();
    console.log('\n' + '='.repeat(50) + '\n');

    await conflictResolutionExample();
    console.log('\n' + '='.repeat(50) + '\n');

    await notificationExample();
    console.log('\n' + '='.repeat(50) + '\n');

    await monitoringExample();
    console.log('\n' + '='.repeat(50) + '\n');

    await bulkOperationsExample();

    console.log('\n✅ All examples completed successfully!');
  } catch (error) {
    console.error('❌ Error running examples:', error);
  }
}

// Export individual examples for selective testing
// Functions are already exported above during declaration
