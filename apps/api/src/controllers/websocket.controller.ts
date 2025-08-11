/**
 * WebSocket Controller - Real-time communication server
 */

import { Request, Response } from 'express';
import { Server as SocketIOServer } from 'socket.io';
import { createServer } from 'http';
import { Logger } from '@nestjs/common';

export class WebSocketController {
  private logger = new Logger(WebSocketController.name);
  private io: SocketIOServer | null = null;
  private server: any = null;
  private isRunning = false;

  // GET /api/websocket/status
  async getStatus(req: Request, res: Response): Promise<void> {
    res.json({
      running: this.isRunning,
      connections: this.io ? this.io.engine.clientsCount : 0,
      port: process.env.WS_PORT || 3001
    });
  }

  // POST /api/websocket/start
  async startServer(req: Request, res: Response): Promise<void> {
    try {
      if (this.isRunning) {
        res.json({ message: 'WebSocket server is already running' });
        return;
      }

      const port = process.env.WS_PORT || 3001;
      
      // Create HTTP server for Socket.IO
      this.server = createServer();
      
      // Initialize Socket.IO
      this.io = new SocketIOServer(this.server, {
        cors: {
          origin: "*",
          methods: ["GET", "POST"]
        }
      });

      // Set up event handlers
      this.setupEventHandlers();

      // Start the server
      this.server.listen(port, () => {
        this.isRunning = true;
        this.logger.log(`WebSocket server started on port ${port}`);
      });

      res.json({ 
        message: 'WebSocket server started successfully',
        port: port
      });
    } catch (error) {
      this.logger.error('Failed to start WebSocket server:', error);
      res.status(500).json({ error: 'Failed to start WebSocket server' });
    }
  }

  // POST /api/websocket/stop
  async stopServer(req: Request, res: Response): Promise<void> {
    try {
      if (!this.isRunning) {
        res.json({ message: 'WebSocket server is not running' });
        return;
      }

      if (this.server) {
        this.server.close();
        this.server = null;
      }

      if (this.io) {
        this.io.close();
        this.io = null;
      }

      this.isRunning = false;
      this.logger.log('WebSocket server stopped');

      res.json({ message: 'WebSocket server stopped successfully' });
    } catch (error) {
      this.logger.error('Failed to stop WebSocket server:', error);
      res.status(500).json({ error: 'Failed to stop WebSocket server' });
    }
  }

  // POST /api/websocket/broadcast
  async broadcast(req: Request, res: Response): Promise<void> {
    try {
      const { event, data } = req.body;

      if (!this.io) {
        res.status(400).json({ error: 'WebSocket server is not running' });
        return;
      }

      this.io.emit(event, data);
      
      res.json({ 
        message: 'Message broadcasted successfully',
        event,
        connections: this.io.engine.clientsCount
      });
    } catch (error) {
      this.logger.error('Failed to broadcast message:', error);
      res.status(500).json({ error: 'Failed to broadcast message' });
    }
  }

  private setupEventHandlers(): void {
    if (!this.io) return;

    this.io.on('connection', (socket) => {
      this.logger.log(`Client connected: ${socket.id}`);

      // Send welcome message
      socket.emit('welcome', {
        message: 'Connected to The New Fuse WebSocket server',
        clientId: socket.id,
        timestamp: new Date().toISOString()
      });

      // Handle workflow events
      socket.on('workflow:subscribe', (workflowId) => {
        socket.join(`workflow:${workflowId}`);
        this.logger.log(`Client ${socket.id} subscribed to workflow ${workflowId}`);
      });

      socket.on('workflow:unsubscribe', (workflowId) => {
        socket.leave(`workflow:${workflowId}`);
        this.logger.log(`Client ${socket.id} unsubscribed from workflow ${workflowId}`);
      });

      // Handle execution events
      socket.on('execution:subscribe', (executionId) => {
        socket.join(`execution:${executionId}`);
        this.logger.log(`Client ${socket.id} subscribed to execution ${executionId}`);
      });

      socket.on('execution:unsubscribe', (executionId) => {
        socket.leave(`execution:${executionId}`);
        this.logger.log(`Client ${socket.id} unsubscribed from execution ${executionId}`);
      });

      // Handle agent events
      socket.on('agent:subscribe', (agentId) => {
        socket.join(`agent:${agentId}`);
        this.logger.log(`Client ${socket.id} subscribed to agent ${agentId}`);
      });

      // Handle system monitoring
      socket.on('system:subscribe', () => {
        socket.join('system:monitoring');
        this.logger.log(`Client ${socket.id} subscribed to system monitoring`);
      });

      // Handle disconnection
      socket.on('disconnect', () => {
        this.logger.log(`Client disconnected: ${socket.id}`);
      });

      // Handle errors
      socket.on('error', (error) => {
        this.logger.error(`Socket error for client ${socket.id}:`, error);
      });
    });
  }

  // Method to emit workflow updates
  emitWorkflowUpdate(workflowId: string, data: any): void {
    if (this.io) {
      this.io.to(`workflow:${workflowId}`).emit('workflow:update', {
        workflowId,
        data,
        timestamp: new Date().toISOString()
      });
    }
  }

  // Method to emit execution updates
  emitExecutionUpdate(executionId: string, data: any): void {
    if (this.io) {
      this.io.to(`execution:${executionId}`).emit('execution:update', {
        executionId,
        data,
        timestamp: new Date().toISOString()
      });
    }
  }

  // Method to emit agent updates
  emitAgentUpdate(agentId: string, data: any): void {
    if (this.io) {
      this.io.to(`agent:${agentId}`).emit('agent:update', {
        agentId,
        data,
        timestamp: new Date().toISOString()
      });
    }
  }

  // Method to emit system metrics
  emitSystemMetrics(metrics: any): void {
    if (this.io) {
      this.io.to('system:monitoring').emit('system:metrics', {
        metrics,
        timestamp: new Date().toISOString()
      });
    }
  }

  // Get the Socket.IO instance for use in other services
  getIO(): SocketIOServer | null {
    return this.io;
  }
}