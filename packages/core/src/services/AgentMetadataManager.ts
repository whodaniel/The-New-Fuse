import { PrismaClient } from '@the-new-fuse/database';

export class AgentMetadataManager {
  private prisma: PrismaClient;

  constructor() {
    this.prisma = new PrismaClient();
  }

  async getMetadata(agentId: string) {
    return this.prisma.agent.findUnique({
      where: { id: agentId },
      select: {
        id: true,
        name: true,
        version: true,
        configuration: true,
        communicationMetrics: {
          orderBy: { timestamp: 'desc' },
          take: 100
        }
      }
    });
  }

  async updateMetadata(agentId: string, data: any) {
    return this.prisma.agent.update({
      where: { id: agentId },
      data: {
        ...data,
        updatedAt: new Date()
      }
    });
  }

  async trackCommunication(agentId: string, metrics: any) {
    return this.prisma.communicationMetric.create({
      data: {
        agentId,
        ...metrics,
        timestamp: new Date()
      }
    });
  }

  async getVersion(agentId: string): Promise<string> {
    const agent = await this.prisma.agent.findUnique({
      where: { id: agentId },
      select: { version: true }
    });
    return agent?.version || '1.0.0';
  }

  async incrementVersion(agentId: string): Promise<string> {
    const currentVersion = await this.getVersion(agentId);
    const [major, minor, patch] = currentVersion.split('.').map(Number);
    const newVersion = `${major}.${minor}.${patch + 1}`;

    await this.prisma.agent.update({
      where: { id: agentId },
      data: { version: newVersion }
    });

    return newVersion;
  }

  async getTrend(agentId: string): Promise<{ direction: 'improving' | 'declining' | 'stable' }> {
    const metrics = await this.prisma.communicationMetric.findMany({
      where: { agentId },
      orderBy: { timestamp: 'desc' },
      take: 10
    });

    if (metrics.length < 2) {
      return { direction: 'stable' };
    }

    // Simple trend analysis based on success rate
    const recentSuccess = metrics.slice(0, 5).filter(m => m.success).length;
    const olderSuccess = metrics.slice(5, 10).filter(m => m.success).length;

    if (recentSuccess > olderSuccess) {
      return { direction: 'improving' };
    } else if (recentSuccess < olderSuccess) {
      return { direction: 'declining' };
    }
    return { direction: 'stable' };
  }

  async updateCommunicationStyle(agentId: string, style: string) {
    return this.prisma.agent.update({
      where: { id: agentId },
      data: {
        configuration: {
          communicationStyle: style
        }
      }
    });
  }
}
