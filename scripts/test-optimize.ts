import { PrismaClient } from '@the-new-fuse/database/client';
import { TaskService } from '../packages/core/src/task/task.service.js';
import { TaskStatus, TaskType, TaskPriority } from '../packages/types/src.js';

async function testQueries(): any {
  const prisma = new PrismaClient();
  const taskService = new TaskService(prisma);

  try {
    // Create a test task
    const taskData = {
      userId: 'test-user',
      type: 'ANALYSIS',
      status: 'PENDING',
      priority: 'NORMAL',
      title: 'Test Task',
      description: 'Testing Prisma Optimize',
      metadata: {
        creator: 'test-user',
        tags: ['test', 'optimize']
      },
      input: { test: true },
      dependencies: []
    };

    // Create task
    
    const task = await taskService.createTask(taskData);

    // Get task by ID
    
    const fetchedTask = await taskService.getTaskById(task.id);

    // Update task status
    
    const updatedTask = await taskService.updateTaskStatus(task.id, TaskStatus.COMPLETED);

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testQueries().catch(console.error);