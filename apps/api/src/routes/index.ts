/**
 * Main Routes Index - Centralized route management
 */

import { Express } from 'express';
import { SystemController } from '../controllers/system.controller';
import { WebSocketController } from '../controllers/websocket.controller';
import { WorkflowController } from '../controllers/workflow.controller';
import { createSystemRoutes } from './system.routes';
import { createWebSocketRoutes } from './websocket.routes';
import { createWorkflowRoutes } from './workflow.routes';

export function setupRoutes(app: Express): void {
  // Initialize controllers
  const systemController = new SystemController();
  const webSocketController = new WebSocketController();
  const workflowController = new WorkflowController(
    null, // WorkflowEngine - will be injected
    null, // WorkflowExecutor - will be injected
    null, // WorkflowValidator - will be injected
    null, // Logger - will be injected
    null  // PrismaClient - will be injected
  );

  // Setup routes
  app.use('/api/system', createSystemRoutes(systemController));
  app.use('/api/websocket', createWebSocketRoutes(webSocketController));
  app.use('/api/workflows', createWorkflowRoutes(workflowController));

  // Health check endpoint (public)
  app.get('/health', systemController.getHealth.bind(systemController));

  // API info endpoint
  app.get('/api', (req, res) => {
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