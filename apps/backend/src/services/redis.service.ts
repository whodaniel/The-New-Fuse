import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import Redis from 'ioredis';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class RedisService implements OnModuleInit, OnModuleDestroy {
  private client: Redis;
  private pubClient: Redis;
  private subClient: Redis;

  constructor(private readonly configService: ConfigService) {
    const redisUrl = this.configService.get<string>('REDIS_URL') || 'redis://localhost:6379';
    
    this.client = new Redis(redisUrl);
    this.pubClient = new Redis(redisUrl);
    this.subClient = new Redis(redisUrl);
  }

  async get(key: string): Promise<string | null> {
    return this.client.get(key);
  }

  async set(key: string, value: string): Promise<'OK'> {
    return this.client.set(key, value);
  }

  async setex(key: string, ttl: number, value: string): Promise<'OK'> {
    return this.client.setex(key, ttl, value);
  }

  async del(key: string): Promise<number> {
    return this.client.del(key);
  }

  async exists(key: string): Promise<number> {
    return this.client.exists(key);
  }

  async flushall(): Promise<'OK'> {
    return this.client.flushall();
  }

  async publish(channel: string, message: string): Promise<number> {
    return this.pubClient.publish(channel, message);
  }

  async subscribe(channel: string): Promise<void> {
    await this.subClient.subscribe(channel);
  }

  async onModuleInit() {
    // Subscribe to agent communication channels
    await this.subClient.subscribe('agent:composer', 'agent:roo-coder');

    this.subClient.on('message', (channel: string, message: string) => {
      this.handleAgentMessage(channel, message);
    });
  }

  async onModuleDestroy() {
    await this.client.quit();
    await this.pubClient.quit();
    await this.subClient.quit();
  }

  private async handleAgentMessage(channel: string, message: string) {
    try {
      const data = JSON.parse(message);
      
      switch (channel) {
        case 'agent:composer':
          await this.handleComposerMessage(data);
          break;
        case 'agent:roo-coder':
          await this.handleRooCoderMessage(data);
          break;
      }
    } catch (error) {
      console.error('Error handling agent message:', error);
    }
  }

  private async handleComposerMessage(data: any) {
    // Handle messages from Composer agent
    
  }

  private async handleRooCoderMessage(data: any) {
    // Handle messages from Roo Coder agent
    
  }

  async sendToComposer(message: any) {
    await this.pubClient.publish('agent:composer', JSON.stringify(message));
  }

  async sendToRooCoder(message: any) {
    await this.pubClient.publish('agent:roo-coder', JSON.stringify(message));
  }

  // Helper methods for agent communication
  async getAgentState(agentId: string): Promise<any> {
    const state = await this.client.get(`agent:state:${agentId}`);
    return state ? JSON.parse(state) : null;
  }

  async setAgentState(agentId: string, state: any): Promise<void> {
    await this.client.set(`agent:state:${agentId}`, JSON.stringify(state));
  }

  async clearAgentState(agentId: string): Promise<void> {
    await this.client.del(`agent:state:${agentId}`);
  }

  async getTasks(): Promise<any[]> {
    // Implementation...
  }

  async cleanup(): Promise<void> {
    // Implementation...
  }
}
