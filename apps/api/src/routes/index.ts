/**
 * Main Routes Index - Centralized route management
 */

import { Express, Request, Response } from 'express';
import { PrismaService } from '@the-new-fuse/database';
import { WebSocketController } from '../controllers/websocket.controller';
import { WorkflowController } from '../controllers/workflow.controller';
import { createWebSocketRoutes } from './websocket.routes';
import { createWorkflowRoutes } from './workflow.routes';

// Lightweight health check function that doesn't require controller dependencies
async function healthCheck(_req: Request, res: Response): Promise<void> {
  try {
    res.json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      memoryUsage: process.memoryUsage().heapUsed / 1024 / 1024
    });
  } catch (error) {
    res.status(500).json({
      status: 'unhealthy',
      error: 'Health check failed'
    });
  }
}

export function setupRoutes(app: Express, prismaService?: PrismaService): void {
  // Initialize controllers that don't have complex dependencies
  const webSocketController = new WebSocketController();
  
  // WorkflowController requires PrismaService - skip if not provided
  let workflowController: WorkflowController | null = null;
  if (prismaService) {
    workflowController = new WorkflowController(prismaService);
  }

  // Setup routes
  // Note: SystemController requires AgentSwarmOrchestrationService, A2AMessageBrokerService,
  // and PromptTemplatesService - these are injected via NestJS DI, not here
  // app.use('/api/system', createSystemRoutes(systemController));
  
  app.use('/api/websocket', createWebSocketRoutes(webSocketController));
  if (workflowController) {
    app.use('/api/workflows', createWorkflowRoutes(workflowController));
  }

  // Health check endpoint (public) - lightweight version without controller
  app.get('/health', healthCheck);

  // API info endpoint
  app.get('/api', (_req, res) => {
    res.json({
      name: 'The New Fuse API',
      version: '2.0.0',
      description: 'Production-ready API for The New Fuse platform',
      endpoints: {
        health: '/health',
        system: '/api/system',
        websocket: '/api/websocket',
        workflows: '/api/workflows',
        agents: '/api/agents',
        mcp: '/api/mcp'
      },
      timestamp: new Date().toISOString()
    });
  });

  // Catch-all for undefined routes
  app.use('*', (req, res) => {
    res.status(404).json({
      error: 'Route not found',
      path: req.originalUrl,
      method: req.method,
      timestamp: new Date().toISOString()
    });
  });
}