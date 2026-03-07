import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';

@Injectable()
export class AgentSwarmService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(AgentSwarmService.name);
  private agents: Map<string, any> = new Map();
  private heartbeatInterval: NodeJS.Timeout | null = null;

  async onModuleInit() {
    this.logger.log('🐝 Initializing Agent Swarm Orchestration...');
    this.startHeartbeatMonitor();
  }

  onModuleDestroy() {
    this.stopHeartbeatMonitor();
  }

  registerAgent(agent: { id: string; name: string; capabilities: string[] }): void {
    this.agents.set(agent.id, {
      ...agent,
      status: 'online',
      lastHeartbeat: new Date(),
    });
    this.logger.log(`✅ Agent registered: ${agent.name} (${agent.capabilities.join(', ')})`);
  }

  unregisterAgent(agentId: string): void {
    this.agents.delete(agentId);
    this.logger.log(`🔌 Agent unregistered: ${agentId}`);
  }

  recordHeartbeat(agentId: string): void {
    const agent = this.agents.get(agentId);
    if (agent) {
      agent.lastHeartbeat = new Date();
      agent.status = 'online';
    }
  }

  findAgentsByCapability(capability: string): any[] {
    return Array.from(this.agents.values()).filter(
      (a) => a.capabilities.includes(capability) && a.status === 'online'
    );
  }

  private startHeartbeatMonitor(): void {
    this.heartbeatInterval = setInterval(() => {
      const now = new Date();
      const timeout = 90000;

      for (const agent of this.agents.values()) {
        const elapsed = now.getTime() - agent.lastHeartbeat.getTime();
        if (elapsed > timeout && agent.status === 'online') {
          agent.status = 'offline';
          this.logger.warn(`⚠️ Agent ${agent.name} went offline (no heartbeat)`);
        }
      }
    }, 30000);
  }

  private stopHeartbeatMonitor(): void {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }
  }

  getStatistics() {
    const agents = Array.from(this.agents.values());
    const capabilities: Record<string, number> = {};

    for (const agent of agents) {
      for (const cap of agent.capabilities) {
        capabilities[cap] = (capabilities[cap] || 0) + 1;
      }
    }

    return {
      totalAgents: agents.length,
      onlineAgents: agents.filter((a) => a.status === 'online').length,
      offlineAgents: agents.filter((a) => a.status === 'offline').length,
      agentsByCapability: capabilities,
    };
  }
}
