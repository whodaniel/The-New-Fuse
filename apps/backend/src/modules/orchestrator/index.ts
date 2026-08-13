/**
 * Orchestrator Module — Proprietary Component
 *
 * The orchestration engine is part of the proprietary control-plane.
 * This stub module provides a no-op implementation for the open-source runtime.
 *
 * @see https://github.com/whodaniel/fuse-control-plane
 */

import { Injectable, Module } from '@nestjs/common';

/** Per-agent liveness record published by the control-plane heartbeat service. */
export interface AgentStatus {
  agentId: string;
  status: string;
  lastHeartbeat: Date;
  lastActivity: Date;
  currentTask?: string;
  consecutiveFailures?: number;
}

/** Rollup the control-plane reports for the agent fleet. */
export interface OrchestratorSystemHealth {
  totalAgents: number;
  activeAgents: number;
  stalledAgents: number;
  failedAgents: number;
}

export interface HeartbeatService {
  getAllAgentStatuses(): Map<string, AgentStatus>;
}

/**
 * No-op stand-in for the control-plane orchestrator.
 *
 * Both accessors return null by design. Consumers in this repo — see
 * NexusObservabilityController — already branch on that and fall back to a
 * zeroed rollup and an empty agent list, so the observability endpoints stay
 * routable and return well-formed JSON without the control-plane present.
 */
@Injectable()
export class OrchestratorService {
  getSystemHealth(): OrchestratorSystemHealth | null {
    return null;
  }

  getHeartbeatService(): HeartbeatService | null {
    return null;
  }
}

@Module({
  // Orchestrator functionality requires the control-plane. This module provides
  // only the no-op service above so the open-source runtime compiles and boots.
  providers: [OrchestratorService],
  exports: [OrchestratorService],
})
export class OrchestratorModule {}

export default OrchestratorModule;
