/**
 * Agent State Synchronization Example
 *
 * Shows how to sync agent states across distributed systems
 * for real-time agent monitoring and coordination.
 */

import { Injectable } from '@nestjs/common';
import { SyncOrchestrator } from '../src/services/SyncOrchestrator';

interface AgentState {
  id: string;
  name: string;
  status: 'IDLE' | 'PROCESSING' | 'ERROR' | 'OFFLINE';
  currentTask?: string;
  metadata?: {
    progress?: number;
    lastHeartbeat?: Date;
    assignedTasks?: string[];
  };
  lastUpdate: Date;
}

@Injectable()
export class AgentCoordinationService {
  constructor(private readonly syncOrchestrator: SyncOrchestrator) {}

  /**
   * Update agent status with real-time sync
   */
  async updateAgentStatus(
    agentId: string,
    status: AgentState['status'],
    metadata?: AgentState['metadata']
  ) {
    const agentState: AgentState = {
      id: agentId,
      name: `agent-${agentId}`,
      status,
      metadata,
      lastUpdate: new Date(),
    };

    // Sync agent state globally (all instances can see agent status)
    await this.syncOrchestrator.syncAgentState(agentId, agentState);

    console.log(`Agent ${agentId} status synced: ${status}`);
  }

  /**
   * Start task execution with progress tracking
   */
  async startAgentTask(agentId: string, taskId: string, tenantId: string) {
    // Mark agent as processing
    await this.updateAgentStatus(agentId, 'PROCESSING', {
      progress: 0,
      lastHeartbeat: new Date(),
      assignedTasks: [taskId],
    });

    // Update task status
    await this.syncOrchestrator.syncTenantData(tenantId, 'task', {
      id: taskId,
      status: 'RUNNING',
      assignedAgent: agentId,
      startedAt: new Date(),
    });

    console.log(`Agent ${agentId} started task ${taskId}`);
  }

  /**
   * Update task progress with real-time sync
   */
  async updateTaskProgress(agentId: string, taskId: string, progress: number, tenantId: string) {
    // Update agent state with progress
    await this.updateAgentStatus(agentId, 'PROCESSING', {
      progress,
      lastHeartbeat: new Date(),
    });

    // Sync task progress
    await this.syncOrchestrator.syncTenantData(tenantId, 'task', {
      id: taskId,
      progress,
      lastUpdate: new Date(),
    });

    console.log(`Task ${taskId} progress: ${progress}%`);
  }

  /**
   * Complete task and update agent state
   */
  async completeAgentTask(agentId: string, taskId: string, result: any, tenantId: string) {
    // Mark agent as idle
    await this.updateAgentStatus(agentId, 'IDLE', {
      progress: 100,
      lastHeartbeat: new Date(),
      assignedTasks: [],
    });

    // Sync task completion
    await this.syncOrchestrator.syncTenantData(tenantId, 'task', {
      id: taskId,
      status: 'COMPLETED',
      result,
      completedAt: new Date(),
    });

    console.log(`Agent ${agentId} completed task ${taskId}`);
  }

  /**
   * Handle agent errors
   */
  async handleAgentError(agentId: string, taskId: string, error: Error, tenantId: string) {
    // Mark agent as error state
    await this.updateAgentStatus(agentId, 'ERROR', {
      lastHeartbeat: new Date(),
    });

    // Sync task failure
    await this.syncOrchestrator.syncTenantData(tenantId, 'task', {
      id: taskId,
      status: 'FAILED',
      error: {
        message: error.message,
        stack: error.stack,
      },
      failedAt: new Date(),
    });

    console.error(`Agent ${agentId} error on task ${taskId}:`, error);
  }

  /**
   * Get real-time agent metrics
   */
  getAgentMetrics() {
    const metrics = this.syncOrchestrator.getMetrics();

    return {
      totalSyncOperations: metrics.operations.sync,
      activeAgents: metrics.resources.activeTenants,
      avgSyncLatency: metrics.performance.avgSyncLatency,
      successRate: metrics.performance.successRate,
    };
  }

  /**
   * Monitor agent health with heartbeat
   */
  async monitorAgentHealth(agentId: string) {
    setInterval(async () => {
      const agentState = await this.getAgentState(agentId);

      if (!agentState) {
        console.warn(`Agent ${agentId} not found`);
        return;
      }

      const lastHeartbeat = agentState.metadata?.lastHeartbeat;
      const timeSinceHeartbeat = Date.now() - (lastHeartbeat?.getTime() || 0);

      // Mark agent offline if no heartbeat for 5 minutes
      if (timeSinceHeartbeat > 5 * 60 * 1000) {
        await this.updateAgentStatus(agentId, 'OFFLINE');
        console.warn(`Agent ${agentId} marked offline (no heartbeat)`);
      }
    }, 60000); // Check every minute
  }

  /**
   * Get current agent state from sync orchestrator
   */
  private async getAgentState(agentId: string): Promise<AgentState | null> {
    // Implementation depends on sync-core's state storage
    // This is a placeholder
    return null;
  }
}
