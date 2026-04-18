import { Injectable } from '@nestjs/common';
import { ReflectBlock } from './mass-blocks.service.js';
import { AgentExecutorService } from './mass-blocks.service.js';

@Injectable()
export class ReflectService {
  constructor(
    private readonly reflectBlock: ReflectBlock,
    private readonly agentExecutor: AgentExecutorService
  ) {}

  async execute(
    predictorAgentId: string,
    reflectorAgentId: string,
    input: any,
    config: {
      maxRounds?: number;
      userId?: string;
    }
  ): Promise<{ result: any; executionMetrics: any }> {
    const reflectConfig = {
      type: 'reflect' as const,
      parameters: {
        predictorAgentId,
        reflectorAgentId,
        maxRounds: config.maxRounds
      }
    };

    const result = await this.reflectBlock.execute(input, reflectConfig);

    return {
      result,
      executionMetrics: {
        predictorAgentId,
        reflectorAgentId,
        timestamp: new Date().toISOString()
      }
    };
  }
}