import { Injectable } from '@nestjs/common';
import { WebSocketGateway, WebSocketServer } from '@nestjs/websockets';
import { Server } from 'socket.io';
import { LoggerService } from '../logging/LoggerService.js';
import { RedisService } from '../persistence/RedisService.js';

interface ComponentStatus {
  status: 'connected' | 'disconnected' | 'stale';
  lastSeen: number;
  config?: ComponentConfig;
}

interface ComponentConfig {
  name: string;
  version: string;
  capabilities: string[];
  [key: string]: any;
}

@Injectable()
@WebSocketGateway({
  cors: true,
  namespace: 'integration'
})
export class IntegrationManager {
  @WebSocketServer()
  private server: Server;
  
  private readonly connectedComponents = new Map<string, ComponentStatus>();

  constructor(
    private readonly redis: RedisService,
    private readonly logger: LoggerService
  ) {}

  async registerComponent(componentId: string, config: ComponentConfig): Promise<void> {
    await this.redis.hset(
      'components:status',
      componentId,
      JSON.stringify({
        status: 'connected',
        lastSeen: Date.now(),
        config
      })
    );
    
    this.connectedComponents.set(componentId, {
      status: 'connected',
      lastSeen: Date.now(),
      config
    });
    
    this.logger.info(`Component ${componentId} registered`, { config });
    this.broadcastComponentStatus(componentId);
  }

  async checkComponentsHealth(): Promise<void> {
    const staleThreshold = 30000; // 30 seconds
    
    for (const [componentId, status] of this.connectedComponents.entries()) {
      if (Date.now() - status.lastSeen > staleThreshold) {
        await this.handleStaleComponent(componentId);
      }
    }
  }

  private async handleStaleComponent(componentId: string): Promise<void> {
    this.logger.warn(`Component ${componentId} appears stale, attempting reconnection`);
    
    try {
      await this.reconnectComponent(componentId);
    } catch (error) {
      this.logger.error(`Failed to reconnect component ${componentId}`, error);
      
      // Update status to stale
      const componentStatus = this.connectedComponents.get(componentId);
      if (componentStatus) {
        componentStatus.status = 'stale';
        this.connectedComponents.set(componentId, componentStatus);
        this.broadcastComponentStatus(componentId);
      }
    }
  }

  private async reconnectComponent(componentId: string): Promise<void> {
    // Implementation for reconnection logic would go here
    // This is just a placeholder
    
    const status = this.connectedComponents.get(componentId);
    if (status) {
      status.status = 'connected';
      status.lastSeen = Date.now();
      
      await this.redis.hset(
        'components:status',
        componentId,
        JSON.stringify(status)
      );
      
      this.broadcastComponentStatus(componentId);
    }
  }

  private broadcastComponentStatus(componentId: string): void {
    const status = this.connectedComponents.get(componentId);
    if (status) {
      this.server.emit('component:status', { componentId, status });
    }
  }
}