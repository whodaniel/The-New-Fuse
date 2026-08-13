/**
 * AG-UI Orchestrator for The New Fuse
 *
 * Implements Microsoft's AG-UI protocol to connect AI agents
 * with self-contained visualization generation.
 *
 * Key Features:
 * - Real-time agent communication via WebSocket
 * - Dynamic UI generation from agent outputs
 * - Self-contained HTML artifact creation
 * - Bidirectional state management
 */

import * as crypto from 'crypto';
import { EventEmitter } from 'events';

import { WebSocketServer } from 'ws';

import type { WebSocket } from 'ws';

export interface AGUIMessage {
  id: string;
  type: 'request' | 'response' | 'notification' | 'error';
  method?: string;
  params?: any;
  result?: any;
  error?: {
    code: number;
    message: string;
    data?: any;
  };
}

export interface AgentSession {
  id: string;
  agentId: string;
  ws: WebSocket;
  state: Map<string, any>;
  createdAt: Date;
  lastActivity: Date;
}

export interface VisualizationRequest {
  type: 'agent-flow' | 'service-map' | 'workflow-deps' | 'bundle-analysis' | 'monitoring';
  data: any;
  title: string;
  aiInsights?: string;
  metadata?: Record<string, any>;
}

export interface VisualizationResult {
  success: boolean;
  filePath?: string;
  html?: string;
  error?: string;
}

export class AGUIOrchestrator extends EventEmitter {
  private wss: WebSocketServer | null = null;
  private sessions: Map<string, AgentSession> = new Map();
  private messageHandlers: Map<string, (params: any, session: AgentSession) => Promise<any>> =
    new Map();

  constructor(private port: number = 8765) {
    super();
    this.registerDefaultHandlers();
  }

  /**
   * Start the AG-UI WebSocket server
   */
  start(): void {
    this.wss = new WebSocketServer({ port: this.port });

    this.wss.on('connection', (ws: WebSocket, req) => {
      const sessionId = this.generateSessionId();
      const agentId = (req.headers['x-agent-id'] as string) || 'unknown';

      const session: AgentSession = {
        id: sessionId,
        agentId,
        ws,
        state: new Map(),
        createdAt: new Date(),
        lastActivity: new Date(),
      };

      this.sessions.set(sessionId, session);

      console.log(`[AG-UI] New agent connection: ${agentId} (session: ${sessionId})`);
      this.emit('agent:connected', session);

      ws.on('message', (data: Buffer) => {
        this.handleMessage(data.toString(), session);
      });

      ws.on('close', () => {
        console.log(`[AG-UI] Agent disconnected: ${agentId}`);
        this.sessions.delete(sessionId);
        this.emit('agent:disconnected', session);
      });

      ws.on('error', (error) => {
        console.error(`[AG-UI] WebSocket error for ${agentId}:`, error);
        this.emit('error', { session, error });
      });
    });

    console.log(`[AG-UI] Orchestrator started on port ${this.port}`);
    this.emit('started', { port: this.port });
  }

  /**
   * Stop the AG-UI server
   */
  stop(): void {
    if (this.wss) {
      this.wss.close();
      this.sessions.clear();
      console.log('[AG-UI] Orchestrator stopped');
      this.emit('stopped');
    }
  }

  /**
   * Handle incoming AG-UI protocol messages
   */
  private async handleMessage(data: string, session: AgentSession): Promise<void> {
    try {
      const message: AGUIMessage = JSON.parse(data);
      session.lastActivity = new Date();

      console.log(`[AG-UI] Message from ${session.agentId}:`, message.type, message.method);

      if (message.type === 'request' && message.method) {
        const handler = this.messageHandlers.get(message.method);

        if (handler) {
          try {
            const result = await handler(message.params, session);
            this.sendResponse(session, message.id, result);
          } catch (error: any) {
            this.sendError(session, message.id, {
              code: -32603,
              message: 'Internal error',
              data: error.message,
            });
          }
        } else {
          this.sendError(session, message.id, {
            code: -32601,
            message: `Method not found: ${message.method}`,
          });
        }
      }

      this.emit('message:received', { session, message });
    } catch (error) {
      console.error('[AG-UI] Failed to parse message:', error);
    }
  }

  /**
   * Send response to agent
   */
  private sendResponse(session: AgentSession, id: string, result: any): void {
    const response: AGUIMessage = {
      id,
      type: 'response',
      result,
    };

    session.ws.send(JSON.stringify(response));
    this.emit('message:sent', { session, message: response });
  }

  /**
   * Send error to agent
   */
  private sendError(session: AgentSession, id: string, error: AGUIMessage['error']): void {
    const errorMessage: AGUIMessage = {
      id,
      type: 'error',
      error,
    };

    session.ws.send(JSON.stringify(errorMessage));
  }

  /**
   * Send notification to agent
   */
  sendNotification(sessionId: string, method: string, params: any): void {
    const session = this.sessions.get(sessionId);
    if (!session) {
      return;
    }

    const notification: AGUIMessage = {
      id: this.generateMessageId(),
      type: 'notification',
      method,
      params,
    };

    session.ws.send(JSON.stringify(notification));
    this.emit('notification:sent', { session, notification });
  }

  /**
   * Register a method handler
   */
  registerHandler(
    method: string,
    handler: (params: any, session: AgentSession) => Promise<any>
  ): void {
    this.messageHandlers.set(method, handler);
    console.log(`[AG-UI] Registered handler: ${method}`);
  }

  /**
   * Register default AG-UI protocol handlers
   */
  private registerDefaultHandlers(): void {
    // Get session state
    this.registerHandler('session.getState', async (params, session) => {
      const key = params.key;
      if (key) {
        return { value: session.state.get(key) };
      }
      return { state: Object.fromEntries(session.state) };
    });

    // Set session state
    this.registerHandler('session.setState', async (params, session) => {
      const { key, value } = params;
      session.state.set(key, value);
      return { success: true };
    });

    // Generate visualization
    this.registerHandler(
      'visualization.generate',
      async (params: VisualizationRequest, session) => {
        return await this.generateVisualization(params, session);
      }
    );

    // Get agent info
    this.registerHandler('agent.getInfo', async (params, session) => {
      return {
        agentId: session.agentId,
        sessionId: session.id,
        connectedAt: session.createdAt.toISOString(),
        lastActivity: session.lastActivity.toISOString(),
      };
    });

    // Health check
    this.registerHandler('system.health', async () => {
      return {
        status: 'healthy',
        activeSessions: this.sessions.size,
        uptime: process.uptime(),
        timestamp: new Date().toISOString(),
      };
    });
  }

  /**
   * Generate self-contained visualization
   */
  private async generateVisualization(
    request: VisualizationRequest,
    session: AgentSession
  ): Promise<VisualizationResult> {
    try {
      console.log(`[AG-UI] Generating ${request.type} visualization for ${session.agentId}`);

      // Import the visualization generator
      const { VisualizationGenerator } = await import('./utils/VisualizationGenerator.js');

      const generator = new VisualizationGenerator();

      // Generate HTML
      const config = {
        title: request.title,
        data: request.data,
        type: request.type,
        aiInsights: request.aiInsights,
        metadata: {
          ...request.metadata,
          generatedBy: `Agent: ${session.agentId}`,
          sessionId: session.id,
          timestamp: new Date().toISOString(),
        },
      };

      const html = await generator.generate(config);

      // Save to file
      const timestamp = Date.now();
      const filename = `${request.type}-${session.agentId}-${timestamp}.html`;
      const filePath = `/tmp/${filename}`;

      const fs = await import('fs');
      await fs.promises.writeFile(filePath, html);

      console.log(`[AG-UI] Visualization saved: ${filePath}`);

      this.emit('visualization:generated', {
        session,
        request,
        filePath,
      });

      return {
        success: true,
        filePath,
        html,
      };
    } catch (error: any) {
      console.error('[AG-UI] Visualization generation failed:', error);

      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Get all active sessions
   */
  getSessions(): AgentSession[] {
    return Array.from(this.sessions.values());
  }

  /**
   * Get session by ID
   */
  getSession(sessionId: string): AgentSession | undefined {
    return this.sessions.get(sessionId);
  }

  /**
   * Generate unique session ID
   */
  private generateSessionId(): string {
    // SECURITY: Use cryptographically secure random values instead of Math.random()
    return `session-${Date.now()}-${crypto.randomBytes(4).toString('hex')}`;
  }

  /**
   * Generate unique message ID
   */
  private generateMessageId(): string {
    // SECURITY: Use cryptographically secure random values instead of Math.random()
    return `msg-${Date.now()}-${crypto.randomBytes(4).toString('hex')}`;
  }
}

export default AGUIOrchestrator;
