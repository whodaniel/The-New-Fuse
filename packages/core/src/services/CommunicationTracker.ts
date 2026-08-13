import { Injectable } from '@nestjs/common';
import { UnifiedRedisService } from '@the-new-fuse/infrastructure';

export interface CommunicationRecord {
  id: string;
  fromAgent: string;
  toAgent: string;
  message: string;
  timestamp: Date;
  status: 'sent' | 'received' | 'failed';
}

@Injectable()
export class CommunicationTracker {
  private redisService: UnifiedRedisService;
  private recordsKey = 'communication:records';
  private blockchainKey = 'communication:blockchain';
  private modelKey = 'communication:model';
  private tokenKey = 'communication:token';
  private walletKey = 'communication:wallet';
  private resourceKey = 'communication:resource';

  constructor(redisService: UnifiedRedisService) {
    this.redisService = redisService;
  }

  async trackCommunication(record: CommunicationRecord): Promise<void> {
    await this.redisService.lpush(this.recordsKey, JSON.stringify(record));
    await this.redisService.expire(this.recordsKey, 86400); // 24 hours
  }

  async getCommunicationHistory(agentId: string, limit: number = 100): Promise<CommunicationRecord[]> {
    const records = await this.redisService.lrange(this.recordsKey, 0, limit - 1);
    return records
      .map(r => JSON.parse(r) as CommunicationRecord)
      .filter(r => r.fromAgent === agentId || r.toAgent === agentId);
  }

  async getRecentCommunications(limit: number = 50): Promise<CommunicationRecord[]> {
    const records = await this.redisService.lrange(this.recordsKey, 0, limit - 1);
    return records.map(r => JSON.parse(r) as CommunicationRecord);
  }

  async clearHistory(): Promise<void> {
    await this.redisService.del(this.recordsKey);
  }

  async getMetrics(agentId: string): Promise<{
    totalSent: number;
    totalReceived: number;
    successRate: number;
  }> {
    const history = await this.getCommunicationHistory(agentId);
    const sent = history.filter(r => r.fromAgent === agentId);
    const received = history.filter(r => r.toAgent === agentId);
    const successful = history.filter(r => r.status === 'received');

    return {
      totalSent: sent.length,
      totalReceived: received.length,
      successRate: history.length > 0 ? successful.length / history.length : 0
    };
  }
}
