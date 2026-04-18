import { Injectable } from '@nestjs/common';
import { MassBlocksService } from './mass-blocks.service.js';

@Injectable()
export class ToolUseService {
  constructor(private readonly massBlocksService: MassBlocksService) {}

  async execute(
    agentId: string,
    input: any,
    config: {
      toolName: string;
      parameters?: Record<string, any>;
      userId?: string;
    }
  ): Promise<{ result: any; executionMetrics: any }> {
    const toolUseConfig = {
      type: 'tool-use' as const,
      parameters: {
        agentId,
        toolName: config.toolName,
        parameters: config.parameters
      }
    };

    const result = await this.massBlocksService.executeBlock(agentId, input, toolUseConfig);

    return {
      result,
      executionMetrics: {
        agentId,
        toolName: config.toolName,
        timestamp: new Date().toISOString()
      }
    };
  }
}