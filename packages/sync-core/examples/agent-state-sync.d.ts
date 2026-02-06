/**
 * Agent State Synchronization Example
 *
 * Shows how to sync agent states across distributed systems
 * for real-time agent monitoring and coordination.
 */
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
export declare class AgentCoordinationService {
  private readonly syncOrchestrator;
  constructor(syncOrchestrator: SyncOrchestrator);
  /**
   * Update agent status with real-time sync
   */
  updateAgentStatus(
    agentId: string,
    status: AgentState['status'],
    metadata?: AgentState['metadata']
  ): Promise<void>;
  /**
   * Start task execution with progress tracking
   */
  startAgentTask(agentId: string, taskId: string, tenantId: string): Promise<void>;
  /**
   * Update task progress with real-time sync
   */
  updateTaskProgress(
    agentId: string,
    taskId: string,
    progress: number,
    tenantId: string
  ): Promise<void>;
  /**
   * Complete task and update agent state
   */
  completeAgentTask(agentId: string, taskId: string, result: any, tenantId: string): Promise<void>;
  /**
   * Handle agent errors
   */
  handleAgentError(agentId: string, taskId: string, error: Error, tenantId: string): Promise<void>;
  /**
   * Get real-time agent metrics
   */
  getAgentMetrics(): {
    totalSyncOperations: number;
    activeAgents: number;
    avgSyncLatency: number;
    successRate: number;
  };
  /**
   * Monitor agent health with heartbeat
   */
  monitorAgentHealth(agentId: string): Promise<void>;
  /**
   * Get current agent state from sync orchestrator
   */
  private getAgentState;
}
export {};
//# sourceMappingURL=agent-state-sync.d.ts.map
