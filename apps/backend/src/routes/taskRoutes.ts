import express, { Request, Response } from 'express';
import { AppConfigService } from '../config/app-config.service';
import { createAuthMiddleware } from '../middleware/auth';
import { RedisService } from '../services/redis.service';
import { User } from '../types/auth';

const router = express.Router();

// Initialize services for auth middleware
const appConfig = new AppConfigService();
const redisService = new RedisService();
const ensureAuthenticated = createAuthMiddleware(appConfig, redisService);

router.get('/', ensureAuthenticated, async (req: Request, res: Response) => {
  try {
    const user = req.user as User;
    res.json({
      success: true,
      data: {
        tasks: [
          {
            id: '1',
            title: 'Analyze user feedback',
            description: 'Review and categorize recent user feedback',
            status: 'in_progress',
            priority: 'high',
            assignedTo: 'agent-1',
            createdAt: '2024-01-01T00:00:00Z',
            updatedAt: new Date().toISOString(),
            dueDate: '2024-01-05T00:00:00Z',
          },
          {
            id: '2',
            title: 'Generate weekly report',
            description: 'Compile analytics data into weekly report',
            status: 'completed',
            priority: 'medium',
            assignedTo: 'agent-2',
            createdAt: '2024-01-02T00:00:00Z',
            updatedAt: new Date().toISOString(),
            completedAt: '2024-01-03T00:00:00Z',
          },
        ],
        pagination: {
          total: 2,
          page: 1,
          limit: 20,
          totalPages: 1,
        },
      },
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch tasks' });
  }
});

router.post('/', ensureAuthenticated, async (req: Request, res: Response) => {
  try {
    const { title, description, priority, assignedTo, dueDate } = req.body;

    const newTask = {
      id: `task-${Date.now()}`,
      title,
      description,
      status: 'pending',
      priority: priority || 'medium',
      assignedTo,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      dueDate,
    };

    res.status(201).json({
      success: true,
      message: 'Task created successfully',
      data: { task: newTask },
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to create task' });
  }
});

router.get('/:id', ensureAuthenticated, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const task = {
      id,
      title: 'Analyze user feedback',
      description: 'Review and categorize recent user feedback',
      status: 'in_progress',
      priority: 'high',
      assignedTo: 'agent-1',
      createdAt: '2024-01-01T00:00:00Z',
      updatedAt: new Date().toISOString(),
      dueDate: '2024-01-05T00:00:00Z',
      logs: [
        { timestamp: '2024-01-01T00:00:00Z', action: 'created', details: 'Task created' },
        { timestamp: '2024-01-01T01:00:00Z', action: 'assigned', details: 'Assigned to agent-1' },
        { timestamp: '2024-01-01T02:00:00Z', action: 'started', details: 'Task started' },
      ],
    };

    res.json({
      success: true,
      data: { task },
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch task' });
  }
});

router.put('/:id', ensureAuthenticated, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { title, description, status, priority, assignedTo, dueDate } = req.body;

    res.json({
      success: true,
      message: 'Task updated successfully',
      data: {
        task: {
          id,
          title,
          description,
          status,
          priority,
          assignedTo,
          dueDate,
          updatedAt: new Date().toISOString(),
        },
      },
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to update task' });
  }
});

router.delete('/:id', ensureAuthenticated, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    res.json({
      success: true,
      message: 'Task deleted successfully',
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete task' });
  }
});

export const taskRoutes = router;
