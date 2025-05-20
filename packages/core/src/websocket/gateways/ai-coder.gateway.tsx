import { WebSocketGateway, WebSocketServer, OnGatewayConnection, OnGatewayDisconnect, SubscribeMessage, MessageBody, ConnectedSocket } from '@nestjs/websockets';

import { Socket } from '@nestjs/websockets';

import { Server } from 'socket.io';
import { Logger } from '@nestjs/common';
import { RedisService } from '../../redis/redis.service.js';
import { SecurityConfig } from '../types/config.js';
import { MonitoringService } from '../../monitoring/monitoring.service.js';

type AICoderMessage = {
  type: 'task' | 'sync' | 'heartbeat';
  payload: unknown;
  timestamp: number;
  sender: 'trae' | 'augment';
  receiver: 'trae' | 'augment';
  messageId: string;
};

@WebSocketGateway({ namespace: 'ai-coder' })
export class AICoderGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private logger = new Logger(AICoderGateway.name);

  constructor(
    private readonly redisService: RedisService,
    private readonly securityConfig: SecurityConfig,
    private readonly monitoringService: MonitoringService
  ) {
    this.setupRedisListeners();
  }

  private setupRedisListeners() {
    this.redisService.subscribeToChannel('ai-coordination', (message) => {
      try {
        const parsed: AICoderMessage = JSON.parse(message);
        this.server.emit(parsed.receiver, {
          ...parsed,
          verified: true,
          receivedAt: Date.now()
        });
      } catch (error) {
        this.logger.error('Failed to parse Redis message:', error);
      }
    });
  }

  handleConnection(client: Socket): void {
    this.logger.log(`AI Coder connected: ${client.id}`);
    // Implement auth token validation
  }

  handleDisconnect(client: Socket): void {
    this.logger.log(`AI Coder disconnected: ${client.id}`);
  }

  private validateMessage(message: AICoderMessage): {
    isValid: boolean;
    error?: string;
  } {
    const requiredFields = ['type', 'payload', 'timestamp', 'sender', 'receiver', 'messageId'];
    const missingFields = requiredFields.filter(field => !(field in message));

    if (missingFields.length > 0) {
      this.logger.warn(`Invalid message format - missing required fields`);
      return {
        isValid: false,
        error: `Missing required fields: ${missingFields.join(', ')}`
      };
    }

    if (!['task', 'sync', 'heartbeat'].includes(message.type)) {
      return {
        isValid: false,
        error: 'Invalid message type'
      };
    }

    return { isValid: true };
  }

  public async broadcastTaskUpdate(taskPayload: unknown): Promise<void> {
    const message: AICoderMessage = {
      type: 'task',
      payload: taskPayload,
      timestamp: Date.now(),
      sender: 'trae',
      receiver: 'augment',
      messageId: crypto.randomUUID()
    };

    await this.redisService.publishToChannel('ai-coordination', JSON.stringify(message));
  }

  @SubscribeMessage('trae:action')
  async handleTraeAction(
    @MessageBody() data: any,
    @ConnectedSocket() client: Socket
  ): Promise<void> {
    const actionMetrics = {
      type: data.type,
      timestamp: Date.now(),
      duration: data.duration,
      success: data.success,
      context: {
        taskId: data.taskId,
        resourceType: data.resourceType,
        action: data.action
      }
    };

    await this.monitoringService.trackTraeMetrics({
      responseTime: data.duration,
      memoryUsage: data.memoryUsage,
      activeTasks: data.activeTasks,
      successRate: data.success ? 1 : 0
    });

    // Broadcast metrics to monitoring dashboard
    this.server.emit('trae:metrics', actionMetrics);
  }
}
