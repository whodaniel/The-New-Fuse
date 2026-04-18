/**
 * NestJS Service for AG-UI Integration
 */

import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { AGUIOrchestrator, VisualizationRequest, VisualizationResult } from '../AGUIOrchestrator';

@Injectable()
export class AGUIService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(AGUIService.name);
  private orchestrator: AGUIOrchestrator;

  constructor() {
    this.orchestrator = new AGUIOrchestrator(8765);

    // Listen to orchestrator events
    this.orchestrator.on('agent:connected', (session) => {
      this.logger.log(`Agent connected: ${session.agentId}`);
    });

    this.orchestrator.on('agent:disconnected', (session) => {
      this.logger.log(`Agent disconnected: ${session.agentId}`);
    });

    this.orchestrator.on('visualization:generated', ({ session, filePath }) => {
      this.logger.log(`Visualization generated for ${session.agentId}: ${filePath}`);
    });

    this.orchestrator.on('error', ({ session, error }) => {
      this.logger.error(`Error for agent ${session.agentId}:`, error);
    });
  }

  async onModuleInit() {
    this.logger.log('Starting AG-UI Orchestrator...');
    this.orchestrator.start();
  }

  async onModuleDestroy() {
    this.logger.log('Stopping AG-UI Orchestrator...');
    this.orchestrator.stop();
  }

  /**
   * Get all active agent sessions
   */
  getActiveSessions() {
    return this.orchestrator.getSessions().map((session) => ({
      id: session.id,
      agentId: session.agentId,
      createdAt: session.createdAt,
      lastActivity: session.lastActivity,
      stateSize: session.state.size,
    }));
  }

  /**
   * Generate visualization programmatically (bypass WebSocket)
   */
  async generateVisualization(request: VisualizationRequest): Promise<VisualizationResult> {
    // Create a temporary session for direct visualization generation
    const tempSession = {
      id: 'temp-' + Date.now(),
      agentId: 'api',
      ws: null as any,
      state: new Map(),
      createdAt: new Date(),
      lastActivity: new Date(),
    };

    // Use the orchestrator's visualization generation method
    return await (this.orchestrator as any).generateVisualization(request, tempSession);
  }

  /**
   * Send notification to specific agent
   */
  notifyAgent(sessionId: string, method: string, params: any): void {
    this.orchestrator.sendNotification(sessionId, method, params);
  }

  /**
   * Register custom handler
   */
  registerHandler(method: string, handler: (params: any) => Promise<any>): void {
    this.orchestrator.registerHandler(method, async (params, session) => {
      this.logger.log(`Custom handler called: ${method} by ${session.agentId}`);
      return await handler(params);
    });
  }

  /**
   * Get service statistics
   */
  getStatistics() {
    const sessions = this.orchestrator.getSessions();
    const now = Date.now();

    return {
      totalSessions: sessions.length,
      activeAgents: new Set(sessions.map((s) => s.agentId)).size,
      oldestSession:
        sessions.length > 0 ? Math.min(...sessions.map((s) => s.createdAt.getTime())) : null,
      averageSessionAge:
        sessions.length > 0
          ? sessions.reduce((sum, s) => sum + (now - s.createdAt.getTime()), 0) / sessions.length
          : 0,
      uptime: process.uptime(),
    };
  }
}
