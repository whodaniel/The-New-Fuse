import { Controller, Get } from '@nestjs/common';
import {
  AuthLevel,
  RateLimitTier,
  RequireAuthLevel,
  SetRateLimitTier,
} from '../guards/secure-auth.guard';
import { AgentSwarmService } from '../modules/director/agent-swarm.service';
import { DirectorService } from '../modules/director/director.service';

@Controller('orchestrator')
export class OrchestratorController {
  constructor(
    private readonly director: DirectorService,
    private readonly swarm: AgentSwarmService
  ) {}

  @Get('health')
  @RequireAuthLevel(AuthLevel.PUBLIC)
  @SetRateLimitTier(RateLimitTier.HEALTH)
  async getHealth() {
    const directorStatus = this.director.getStatus();
    const swarmStats = this.swarm.getStatistics();
    const isHealthy = Boolean(directorStatus?.isRunning);

    return {
      status: isHealthy ? 'healthy' : 'degraded',
      checks: {
        director: directorStatus?.isRunning ? 'running' : 'stopped',
        swarm: swarmStats.onlineAgents > 0 ? 'agents_online' : 'no_agents',
      },
      metrics: {
        totalAgents: Number(swarmStats.totalAgents || 0),
        activeAgents: Number(swarmStats.onlineAgents || 0),
        offlineAgents: Number(swarmStats.offlineAgents || 0),
        cycleCount: Number(directorStatus?.cycleCount || 0),
        isRunning: Boolean(directorStatus?.isRunning),
      },
      timestamp: new Date().toISOString(),
    };
  }

  @Get('agents')
  @RequireAuthLevel(AuthLevel.PUBLIC)
  @SetRateLimitTier(RateLimitTier.HEALTH)
  async getAgents() {
    const agents = this.swarm.getAgents().map((agent: any) => ({
      agentId: agent.id,
      id: agent.id,
      name: agent.name,
      status: agent.status,
      capabilities: agent.capabilities,
      lastHeartbeat:
        agent.lastHeartbeat instanceof Date
          ? agent.lastHeartbeat.toISOString()
          : String(agent.lastHeartbeat || ''),
    }));

    return {
      agents,
      count: agents.length,
      timestamp: new Date().toISOString(),
    };
  }
}
