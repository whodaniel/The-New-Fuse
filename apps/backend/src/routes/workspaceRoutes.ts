import express, { Request, Response, NextFunction } from 'express';

const router = express.Router();

// Workspace routes that align with frontend expectations
interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    email?: string;
    name?: string;
  };
}

function ensureAuthenticated(req: AuthenticatedRequest, res: Response, next: NextFunction): void {
  const REQUIRE_AUTH = process.env.REQUIRE_AUTH !== 'false';
  
  if (!REQUIRE_AUTH) {
    // In dev mode, inject a mock user if not present
    if (!req.user) {
      req.user = {
        id: 'dev-user',
        email: 'dev@local',
        name: 'Dev User',
      };
    }
    return next();
  }
  
  if (!req.user) {
    res.status(401).json({ error: 'Unauthorized: Authentication required.' });
    return;
  }
  next();
}

// GET /api/workspace/overview
router.get('/overview', ensureAuthenticated, async (req: AuthenticatedRequest, res: Response) => {
  try {
    res.json({
      success: true,
      data: {
        workspace: {
          id: 'default-workspace',
          name: 'Default Workspace',
          description: 'Your main workspace',
          memberCount: 1,
          activeAgents: 12,
          activeTasks: 34,
          recentActivity: [
            { id: 1, type: 'agent_created', message: 'New agent created', timestamp: new Date().toISOString() },
            { id: 2, type: 'task_completed', message: 'Task completed successfully', timestamp: new Date().toISOString() },
          ]
        }
      }
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch workspace overview' });
  }
});

// GET /api/workspace/analytics
router.get('/analytics', ensureAuthenticated, async (req: AuthenticatedRequest, res: Response) => {
  try {
    res.json({
      success: true,
      data: {
        metrics: {
          totalAgents: 12,
          activeAgents: 8,
          totalTasks: 156,
          completedTasks: 134,
          successRate: 85.9,
          averageResponseTime: 2.3
        },
        chartData: {
          daily: [
            { date: '2024-01-01', agents: 10, tasks: 45 },
            { date: '2024-01-02', agents: 12, tasks: 52 },
            { date: '2024-01-03', agents: 11, tasks: 38 },
          ]
        }
      }
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch workspace analytics' });
  }
});

// GET /api/workspace/members
router.get('/members', ensureAuthenticated, async (req: AuthenticatedRequest, res: Response) => {
  try {
    res.json({
      success: true,
      data: {
        members: [
          {
            id: req.user?.id || 'dev-user',
            name: req.user?.name || 'Dev User',
            email: req.user?.email || 'dev@local',
            role: 'admin',
            joinedAt: '2024-01-01T00:00:00Z',
            lastActive: new Date().toISOString()
          }
        ],
        total: 1
      }
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch workspace members' });
  }
});

// GET /api/workspace/settings
router.get('/settings', ensureAuthenticated, async (req: AuthenticatedRequest, res: Response) => {
  try {
    res.json({
      success: true,
      data: {
        settings: {
          workspaceName: 'Default Workspace',
          description: 'Your main workspace',
          timezone: 'UTC',
          language: 'en',
          notifications: {
            email: true,
            push: true,
            slack: false
          },
          integrations: {
            slack: false,
            discord: false,
            teams: false
          }
        }
      }
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch workspace settings' });
  }
});

// PUT /api/workspace/settings
router.put('/settings', ensureAuthenticated, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { workspaceName, description, timezone, language, notifications, integrations } = req.body;
    
    // Here you would normally update the database
    res.json({
      success: true,
      message: 'Workspace settings updated successfully',
      data: {
        workspaceName,
        description,
        timezone,
        language,
        notifications,
        integrations
      }
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to update workspace settings' });
  }
});

export const workspaceRoutes = router;
