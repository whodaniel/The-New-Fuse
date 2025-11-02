import { Injectable, Logger } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';

export interface MessageAnalytics {
  messageId: string;
  senderId: string;
  recipientId?: string;
  channel: string;
  pattern: string;
  status: 'sent' | 'handled' | 'error';
  timestamp: Date;
  processingTime?: number;
}

export interface ChannelUtilization {
  channel: string;
  messageCount: number;
  lastActivity: Date;
}

export interface CommunicationPattern {
  source: string;
  target: string;
  frequency: number;
  lastOccurrence: Date;
}

@Injectable()
export class AICommAnalyticsService {
  private readonly logger = new Logger(AICommAnalyticsService.name);
  private readonly METRICS_KEY = 'ai:comm:metrics';
  private readonly PATTERN_KEY = 'ai:comm:patterns';
  private readonly HISTORY_KEY = 'ai:comm:history';
  private messageHistory: MessageAnalytics[] = [];

  constructor(private eventEmitter: EventEmitter2) {}

  async trackMessage(analytics: MessageAnalytics): Promise<void> {
    try {
      this.messageHistory.push(analytics);
      this.eventEmitter.emit('analytics.message.tracked', analytics);

      if (this.messageHistory.length > 10000) {
        this.messageHistory.shift();
      }
    } catch (error) {
      this.logger.error('Failed to track message', error);
    }
  }

  async getChannelUtilization(): Promise<ChannelUtilization[]> {
    const utilizationMap = new Map<string, ChannelUtilization>();

    for (const entry of this.messageHistory) {
      if (entry.status === 'handled' || entry.status === 'error') {
        const existing = utilizationMap.get(entry.channel);
        if (existing) {
          existing.messageCount++;
          if (entry.timestamp > existing.lastActivity) {
            existing.lastActivity = entry.timestamp;
          }
        } else {
          utilizationMap.set(entry.channel, {
            channel: entry.channel,
            messageCount: 1,
            lastActivity: entry.timestamp,
          });
        }
      }
    }

    return Array.from(utilizationMap.values());
  }

  async getCommunicationPatterns(): Promise<CommunicationPattern[]> {
    const patternMap = new Map<string, CommunicationPattern>();

    for (const entry of this.messageHistory) {
      if (entry.recipientId) {
        const patternKey = `${entry.senderId}:${entry.recipientId}`;
        const existing = patternMap.get(patternKey);

        if (existing) {
          existing.frequency++;
          if (entry.timestamp > existing.lastOccurrence) {
            existing.lastOccurrence = entry.timestamp;
          }
        } else {
          patternMap.set(patternKey, {
            source: entry.senderId,
            target: entry.recipientId,
            frequency: 1,
            lastOccurrence: entry.timestamp,
          });
        }
      }
    }

    return Array.from(patternMap.values()).sort((a, b) => b.frequency - a.frequency);
  }

  async getSuccessRate(channel?: string): Promise<number> {
    const relevantMessages = channel
      ? this.messageHistory.filter(m => m.channel === channel)
      : this.messageHistory;

    if (relevantMessages.length === 0) {
      return 100;
    }

    const successful = relevantMessages.filter(m => m.status === 'handled').length;
    return (successful / relevantMessages.length) * 100;
  }

  async getAverageProcessingTime(channel?: string): Promise<number> {
    const relevantMessages = channel
      ? this.messageHistory.filter(m => m.channel === channel && m.processingTime)
      : this.messageHistory.filter(m => m.processingTime);

    if (relevantMessages.length === 0) {
      return 0;
    }

    const totalTime = relevantMessages.reduce((sum, m) => sum + (m.processingTime || 0), 0);
    return totalTime / relevantMessages.length;
  }

  async clearHistory(): Promise<void> {
    this.messageHistory = [];
    this.logger.info('Analytics history cleared');
  }
}
