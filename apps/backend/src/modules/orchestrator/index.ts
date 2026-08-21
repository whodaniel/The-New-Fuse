/**
 * Orchestrator Module — Proprietary Component
 *
 * The orchestration engine is part of the proprietary control-plane.
 * This stub module provides a no-op implementation for the open-source runtime.
 *
 * @see https://github.com/whodaniel/fuse-control-plane
 */

import { Injectable, Module } from '@nestjs/common';

type AgentStatus = {
  agentId: string;
  status: string;
  lastHeartbeat: Date;
  lastActivity: Date;
  currentTask?: string;
  consecutiveFailures?: number;
};

type HeartbeatService = {
  getAllAgentStatuses(): Map<string, AgentStatus>;
};

@Injectable()
export class OrchestratorService {
  getSystemHealth() {
    return { totalAgents: 0, activeAgents: 0, stalledAgents: 0, failedAgents: 0 };
  }

  getHeartbeatService(): HeartbeatService | null {
    return null;
  }
}

@Module({
  providers: [OrchestratorService],
  exports: [OrchestratorService],
})
export class OrchestratorModule {}

export default OrchestratorModule;
