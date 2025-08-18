
import { Injectable, Logger } from '@nestjs/common';
import { Subject, Observable } from 'rxjs';
import { RedisService } from '../../redis/redis.service';

export interface AgentMessage {
  id: string;
  sender: string;
  recipient: string;
  content: any;
  metadata?: Record<string, any>;
  timestamp: string;
  type: 'direct' | 'broadcast';
}

export interface MessageValidator {
  validate(message: AgentMessage): Promise<boolean>;
}

@Injectable()
export class AgentBridgeService {
  private readonly channels = new Map<string, Subject<AgentMessage>>();
  private readonly logger = new Logger(AgentBridgeService.name);

  constructor(
    private readonly redisService: RedisService,
    private readonly messageValidator: MessageValidator
  ) {
    this.initializeRedisSubscriptions();
  }

  async broadcastMessage(message: AgentMessage): Promise<void> {
    try {
      await this.messageValidator.validate(message);
      const channel = `agent:broadcast`;
      await this.redisService.publish(channel, JSON.stringify(message));
      this.logger.log('Message broadcasted', message);
      await this.logCommunication(message);
    } catch (error) {
      this.logger.error('Failed to broadcast message', { error, message });
      throw error;
    }
  }

  async sendDirectMessage(message: AgentMessage): Promise<void> {
    try {
      await this.messageValidator.validate(message);
      const channel = `agent:${message.recipient}`;
      await this.redisService.publish(channel, JSON.stringify(message));
      this.logger.log('Direct message sent', message);
      await this.logCommunication(message);
    } catch (error) {
      this.logger.error('Failed to send direct message', { error, message });
      throw error;
    }
  }

  getAgentChannel(agentId: string): Observable<AgentMessage> {
    if (!this.channels.has(agentId)) {
      this.channels.set(agentId, new Subject<AgentMessage>());
    }
    return this.channels.get(agentId)!.asObservable();
  }

  private async initializeRedisSubscriptions(): Promise<void> {
    const pattern = 'agent:*';
    this.redisService.psubscribe(pattern);
    this.redisService.on('pmessage', (pattern, channel, message) => {
      const agentId = channel.split(':')[1];
      if (this.channels.has(agentId)) {
        this.channels.get(agentId)!.next(JSON.parse(message));
      }
    });
    this.logger.log('Redis subscriptions initialized');
  }

  private async logCommunication(message: AgentMessage): Promise<void> {
    // Implementation for logging communications
    this.logger.log('Logging communication', message);
  }
}
