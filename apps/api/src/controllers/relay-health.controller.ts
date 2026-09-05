import { Controller, Get, Inject } from '@nestjs/common';
import { CacheService } from '../cache/cache.service';

@Controller('relay')
export class RelayHealthController {
  private lastHeartbeat = Date.now();
  private messageCount = 0;
  private connectedAgents = new Map<string, number>();

  constructor(@Inject(CacheService) private readonly cacheService: CacheService) {}

  @Get('health')
  async getHealth() {
    // Derive live agent count from Redis registry (tnf:agent-registry)
    // instead of in-memory WebSocket connections
    let redisAgentCount = 0;
    let redisAgents: Array<{ id: string; lastSeen: number; status: string; age: number }> = [];

    try {
      const registry = await this.cacheService.hgetall('tnf:agent-registry');
      const now = Date.now();
      const MAX_AGE_MS = 60000; // 60 seconds - agents older than this are stale

      for (const [agentId, dataJson] of Object.entries(registry)) {
        try {
          const data = JSON.parse(dataJson);
          const lastSeen = data.lastSeen ? new Date(data.lastSeen).getTime() : 0;
          const status = data.status || 'unknown';
          const age = now - lastSeen;

          // Count as live if status is active/online AND lastSeen is recent
          const isLive = (status === 'active' || status === 'online') && age < MAX_AGE_MS;

          if (isLive) {
            redisAgentCount++;
          }

          redisAgents.push({
            id: agentId,
            lastSeen,
            status: isLive ? 'active' : status,
            age,
          });
        } catch (e) {
          // Skip malformed entries
        }
      }
    } catch (e) {
      // Redis unavailable - fall back to in-memory
      redisAgentCount = this.connectedAgents.size;
      redisAgents = Array.from(this.connectedAgents.entries()).map(([id, lastSeen]) => ({
        id,
        lastSeen,
        age: Date.now() - lastSeen,
      }));
    }

    return {
      status: 'alive',
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      lastHeartbeat: this.lastHeartbeat,
      messageCount: this.messageCount,
      connectedAgents: redisAgents,
      agentCount: redisAgentCount,
      origin: 'cloud',
    };
  }

  @Get('agents')
  async getAgents() {
    let redisAgents: Array<{ id: string; lastSeen: string; status: string }> = [];

    try {
      const registry = await this.cacheService.hgetall('tnf:agent-registry');
      const now = Date.now();
      const MAX_AGE_MS = 60000;

      for (const [agentId, dataJson] of Object.entries(registry)) {
        try {
          const data = JSON.parse(dataJson);
          const lastSeen = data.lastSeen ? new Date(data.lastSeen).getTime() : 0;
          const status = data.status || 'unknown';
          const age = now - lastSeen;
          const isLive = (status === 'active' || status === 'online') && age < MAX_AGE_MS;

          redisAgents.push({
            id: agentId,
            lastSeen: new Date(lastSeen).toISOString(),
            status: isLive ? 'active' : status,
          });
        } catch (e) {
          // Skip malformed entries
        }
      }
    } catch (e) {
      // Fallback to in-memory
      redisAgents = Array.from(this.connectedAgents.entries()).map(([id, lastSeen]) => ({
        id,
        lastSeen: new Date(lastSeen).toISOString(),
        status: Date.now() - lastSeen < 10000 ? 'active' : 'stalled',
      }));
    }

    return {
      count: redisAgents.length,
      agents: redisAgents,
      origin: 'cloud',
    };
  }

  recordHeartbeat(agentId: string) {
    this.lastHeartbeat = Date.now();
    this.messageCount++;
    this.connectedAgents.set(agentId, Date.now());
  }
}