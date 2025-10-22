import { Injectable } from '@nestjs/common';
import Redis from 'ioredis';

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
  private redis: Redis;
  private recordsKey = 'communication:records';
  private blockchainKey = 'communication:blockchain';
  private modelKey = 'communication:model';
  private tokenKey = 'communication:token';
  private walletKey = 'communication:wallet';
  private resourceKey = 'communication:resource';

  constructor() {
    this.redis = new Redis({
      host: process.env.REDIS_HOST || 'localhost',
      port: parseInt(process.env.REDIS_PORT || '6379'),
    });
  }

  async trackCommunication(record: CommunicationRecord): Promise<void> {
    await this.redis.lpush(this.recordsKey, JSON.stringify(record));
    await this.redis.expire(this.recordsKey, 86400); // 24 hours
  }

  async getCommunicationHistory(agentId: string, limit: number = 100): Promise<CommunicationRecord[]> {
    const records = await this.redis.lrange(this.recordsKey, 0, limit - 1);
    return records
      .map(r => JSON.parse(r) as CommunicationRecord)
      .filter(r => r.fromAgent === agentId || r.toAgent === agentId);
  }

  async getRecentCommunications(limit: number = 50): Promise<CommunicationRecord[]> {
    const records = await this.redis.lrange(this.recordsKey, 0, limit - 1);
    return records.map(r => JSON.parse(r) as CommunicationRecord);
  }

  async clearHistory(): Promise<void> {
    await this.redis.del(this.recordsKey);
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
