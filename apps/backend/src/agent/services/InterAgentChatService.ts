import { Injectable, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { EventEmitter2 } from '@nestjs/event-emitter';
import * as crypto from 'crypto';
import { RedisService } from '../../services/redis.service';
import { AlertService } from './AlertService';
import { MonitoringService } from './MonitoringService';

interface AgentMessage {
  id: string;
  from: string;
  to: string;
  content: string;
  timestamp: Date;
  metadata?: Record<string, any>;
}

@Injectable()
export class InterAgentChatService implements OnModuleInit {
  private readonly channelPrefix = 'agent-chat';
  private agentId: string;
  
  constructor(
    private readonly configService: ConfigService,
    private readonly redisService: RedisService,
    private readonly alertService: AlertService,
    private readonly monitoringService: MonitoringService,
    private readonly eventEmitter: EventEmitter2,
  ) {
    this.agentId = this.configService.get<string>('AGENT_ID') || 'unknown-agent';
  }

  async onModuleInit() {
    // Subscribe to messages directed to this agent
    await this.subscribeToAgentChannel();
  }

  /**
   * Subscribe to the agent's message channel
   */
  private async subscribeToAgentChannel(): Promise<void> {
    const channel = `${this.channelPrefix}:${this.agentId}`;
    
    try {
      await this.redisService.subscribe(channel, (message) => {
        try {
          const parsedMessage = JSON.parse(message) as AgentMessage;
          this.handleIncomingMessage(parsedMessage);
        } catch (error) {
          this.alertService.error('agent.message.parse.failed', 'Failed to parse incoming message', { error: (error as Error).message });
        }
      });
      
      this.monitoringService.logEvent('agent.channel.subscribed', { agentId: this.agentId, channel });
    } catch (error) {
      this.alertService.error('agent.channel.subscribe.failed', `Failed to subscribe to channel ${channel}`, { error: (error as Error).message });
    }
  }

  /**
   * Handle an incoming message from another agent
   */
  private handleIncomingMessage(message: AgentMessage): void {
    // Validate message
    if (!message || !message.from || !message.content) {
      this.alertService.warning('agent.message.invalid', 'Received invalid message format');
      return;
    }
    
    // Emit event for message handlers
    this.eventEmitter.emit('agent.message.received', message);
    
    // Record metric
    this.monitoringService.recordMetric('agent.messages.received', 1, { from: message.from });
  }

  /**
   * Send a message to another agent
   */
  async sendMessage(toAgentId: string, content: string, metadata: Record<string, any> = {}): Promise<string> {
    const messageId = this.generateMessageId();
    const channel = `${this.channelPrefix}:${toAgentId}`;
    
    const message: AgentMessage = {
      id: messageId,
      from: this.agentId,
      to: toAgentId,
      content,
      timestamp: new Date(),
      metadata,
    };
    
    try {
      await this.redisService.publish(channel, JSON.stringify(message));
      
      // Record metric
      this.monitoringService.recordMetric('agent.messages.sent', 1, { to: toAgentId });
      
      // Emit event
      this.eventEmitter.emit('agent.message.sent', message);
      
      return messageId;
    } catch (error) {
      this.alertService.error('agent.message.send.failed', `Failed to send message to agent ${toAgentId}`, { error: (error as Error).message });
      throw error;
    }
  }

  /**
   * Broadcast a message to all agents
   */
  async broadcastMessage(content: string, metadata: Record<string, any> = {}): Promise<string> {
    const messageId = this.generateMessageId();
    const channel = `${this.channelPrefix}:broadcast`;
    
    const message: AgentMessage = {
      id: messageId,
      from: this.agentId,
      to: 'broadcast',
      content,
      timestamp: new Date(),
      metadata,
    };
    
    try {
      await this.redisService.publish(channel, JSON.stringify(message));
      
      // Record metric
      this.monitoringService.recordMetric('agent.messages.broadcast', 1);
      
      // Emit event
      this.eventEmitter.emit('agent.message.broadcast', message);
      
      return messageId;
    } catch (error) {
      this.alertService.error('agent.message.broadcast.failed', 'Failed to broadcast message', { error: (error as Error).message });
      throw error;
    }
  }

  /**
   * Generate a unique message ID
   */
  private generateMessageId(): string {
    // SECURITY: Use cryptographically secure random values instead of Math.random()
    return `msg_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`;
  }

  /**
   * Check if the agent chat service is healthy
   */
  async checkHealth(): Promise<{ status: string; details?: any }> {
    try {
      const redisHealth = await this.redisService.get('health-check');
      
      if (!redisHealth || redisHealth !== 'healthy') {
        return {
          status: 'unhealthy',
          details: { redis: redisHealth || 'unreachable' },
        };
      }
      
      return { status: 'healthy' };
    } catch (error) {
      return {
        status: 'unhealthy',
        details: (error as Error).message,
      };
    }
  }
}