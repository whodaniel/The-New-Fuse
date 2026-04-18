import { Injectable } from '@nestjs/common';
import { DebateBlock } from './mass-blocks.service.js';
import { AgentExecutorService } from './mass-blocks.service.js';

@Injectable()
export class DebateService {
  constructor(
    private readonly debateBlock: DebateBlock,
    private readonly agentExecutor: AgentExecutorService
  ) {}

  async execute(
    debaterAgentIds: string[],
    input: any,
    config: {
      debateRounds?: number;
      votingStrategy?: 'majority' | 'weighted' | 'consensus';
      userId?: string;
    }
  ): Promise<{ result: any; executionMetrics: any }> {
    const debateConfig = {
      type: 'debate' as const,
      parameters: {
        debaterAgentIds,
        debateRounds: config.debateRounds || 3,
        votingStrategy: config.votingStrategy || 'majority'
      }
    };

    const result = await this.debateBlock.execute(input, debateConfig);

    return {
      result,
      executionMetrics: {
        debaterAgentIds,
        debateRounds: config.debateRounds || 3,
        timestamp: new Date().toISOString()
      }
    };
  }
}