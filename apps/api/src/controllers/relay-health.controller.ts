import { Controller, Get } from '@nestjs/common';

@Controller('relay')
export class RelayHealthController {
  private lastHeartbeat = Date.now();
  private messageCount = 0;
  private connectedAgents = new Map<string, number>();

  @Get('health')
  getHealth() {
    return {
      status: 'alive',
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      lastHeartbeat: this.lastHeartbeat,
      messageCount: this.messageCount,
      connectedAgents: Array.from(this.connectedAgents.entries()).map(([id, lastSeen]) => ({
        id,
        lastSeen,
        age: Date.now() - lastSeen,
      })),
    };
  }

  @Get('agents')
  getAgents() {
    return {
      count: this.connectedAgents.size,
      agents: Array.from(this.connectedAgents.entries()).map(([id, lastSeen]) => ({
        id,
        lastSeen: new Date(lastSeen).toISOString(),
        status: Date.now() - lastSeen < 10000 ? 'active' : 'stalled',
      })),
    };
  }

  recordHeartbeat(agentId: string) {
    this.lastHeartbeat = Date.now();
    this.messageCount++;
    this.connectedAgents.set(agentId, Date.now());
  }
}
