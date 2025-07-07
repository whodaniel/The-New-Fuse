import { Injectable, Logger } from '@nestjs/common';
import { Subject, Observable } from 'rxjs';
import { RedisService } from '../redis/redis.service';
import { WebSocketGateway } from '@nestjs/websockets';
import { CircuitBreaker } from '../resilience/CircuitBreaker';

export interface AgentMessage {
  id: string;
  sender: string;
  recipient: string;
  content: unknown;
  metadata?: Record<string, unknown>;
  timestamp: string;
  type: 'direct' | 'broadcast' | 'task_request' | 'task_response' | 'status_update' | 'error';
  priority: 'low' | 'medium' | 'high';
}

interface MessageValidator {
  validate(message: AgentMessage): Promise<boolean>;
}

@Injectable()
export class AgentCommunicationBridge {
  private readonly channels = new Map<string, Subject<AgentMessage>>();
  private readonly logger = new Logger(AgentCommunicationBridge.name);
  private readonly circuitBreaker = new CircuitBreaker();
 
  constructor(
    private readonly redisService: RedisService,
    private readonly websocketGateway: any, // WebSocketGateway instance
    private readonly messageValidator: MessageValidator
  ) {
    this.initializeRedisSubscriptions();
  }

  async broadcastMessage(message: AgentMessage): Promise<void> {
    try {
      await this.messageValidator.validate(message);
      const channel = `agent:${message.recipient || 'broadcast'}`;
      await this.redisService.set(channel, JSON.stringify(message));
      this.logger.log('Message broadcasted', message);
      await this.logCommunication(message);
    } catch (error: unknown) {
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
    } catch (error: unknown) {
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
      type: message.type
    });
  }
}