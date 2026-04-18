import { Injectable } from '@nestjs/common';
import { MassBlocksService } from './mass-blocks.service.js';

@Injectable()
export class CustomAgentService {
  constructor(private readonly massBlocksService: MassBlocksService) {}

  async execute(
    agentId: string,
    input: any,
    config: {
      customLogic: string;
      parameters?: Record<string, any>;
      userId?: string;
    }
  ): Promise<{ result: any; executionMetrics: any }> {
    const customConfig = {
      type: 'custom' as const,
      parameters: {
        agentId,
        customLogic: config.customLogic,
        parameters: config.parameters
      }
    };

    const result = await this.massBlocksService.executeBlock(agentId, input, customConfig);

    return {
      result,
      executionMetrics: {
        agentId,
        customLogic: config.customLogic,
        timestamp: new Date().toISOString()
      }
    };
  }
}