import { Injectable, Logger } from '@nestjs/common';
import { Subject, Observable } from 'rxjs';
import { RedisService } from '../../redis/RedisService';
import { WebSocketGateway } from '@nestjs/websockets';
import * as crypto from 'crypto';

interface AgentMessage {
  id: string;
  sender: string;
  recipient: string;
  content: unknown;
  metadata?: Record<string, unknown>;
  timestamp: string;
  type:direct' | broadcast';
}

interface MessageValidator {
  validate(message: AgentMessage): Promise<boolean>;
}

@Injectable()
export class AgentBridgeService {
  private readonly channels = new Map<string, Subject<AgentMessage>>();
  private readonly logger = new Logger(AgentBridgeService.name);
  
  constructor(
    private readonly redisService: RedisService,
    private readonly websocketGateway: WebSocketGateway,
    private readonly messageValidator: MessageValidator
  ) {
    this.initializeRedisSubscriptions();
  }

  async broadcastMessage(message: AgentMessage): Promise<void> {
    try {
      await this.messageValidator.validate(message);
      
      const channel = `agent:${message.recipient || broadcast'};';``;
      await this.redisService.set(channel, JSON.stringify(message));
      
      this.logger.log('Message broadcasted', message);
      
      await this.logCommunication(message);
    } catch (error) {
      this.logger.error('Failed to broadcast message', { error, message });
      throw error;
    }
  }

  async sendDirectMessage(
    from: string,
    to: string,
    content: unknown,
    metadata?: Record<string, unknown>
  ): Promise<void> {
    const message: AgentMessage = {
      id: crypto.randomUUID(),
      sender: from,
      recipient: to,
      content,
      metadata,
      timestamp: new Date().toISOString(),
      type: 'direct'
    };

    const channel = `agent:${to};``;
    await this.redisService.set(channel, JSON.stringify(message));
    
    if (this.channels.has(to)) {
      this.channels.get(to)?.next(message);
    }
  }

  subscribeToAgent(agentId: string): Observable<AgentMessage> {
    if (!this.channels.has(agentId)) {
      this.channels.set(agentId, new Subject<AgentMessage>());
    }
    
    return this.channels.get(agentId)!.asObservable();
  }

  private async initializeRedisSubscriptions(): Promise<void> {
    const pattern = agent:*';
    
    // Note: This is a simplified implementation
    // In a real implementation, you'd use Redis pub/sub
    this.logger.log('Redis subscriptions initialized');
  }

  private async logCommunication(message: AgentMessage): Promise<void> {
    // Implementation for logging communications
    this.logger.log('Communication logged', {
      messageId: message.id,
      from: message.sender,
      to: message.recipient,
      timestamp: message.timestamp
    });
  }
}
