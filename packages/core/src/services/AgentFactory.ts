import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class AgentFactory {
  constructor(private readonly configService: ConfigService) {}

  createAgent(config: any) {
    return {
      id: this.generateId(),
      ...config,
      createdAt: new Date(),
    };
  }

  private generateId(): string {
    return Math.random().toString(36).substring(2, 15);
  }
}
