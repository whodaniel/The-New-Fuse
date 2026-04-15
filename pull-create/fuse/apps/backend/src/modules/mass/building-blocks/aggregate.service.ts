import { Injectable } from '@nestjs/common';
import { AggregateBlock } from './mass-blocks.service';
import { AgentExecutorService } from './mass-blocks.service';

@Injectable()
export class AggregateService {
  constructor(
    private readonly aggregateBlock: AggregateBlock,
    private readonly agentExecutor: AgentExecutorService
  ) {}

  async execute(
    agentId: string,
    inputs: any[],
    config: {
      aggregationMethod: 'average' | 'weighted' | 'consensus' | 'majority';
      weights?: number[];
      threshold?: number;
      userId?: string;
    }
  ): Promise<{ result: any; executionMetrics: any }> {
    const aggregateConfig = {
      type: 'aggregate' as const,
      parameters: {
        agentId,
        aggregationMethod: config.aggregationMethod,
        weights: config.weights,
        threshold: config.threshold
      }
    };

    const result = await this.aggregateBlock.execute(inputs, aggregateConfig);

    return {
      result,
      executionMetrics: {
        agentId,
        aggregationMethod: config.aggregationMethod,
        inputCount: inputs.length,
        timestamp: new Date().toISOString()
      }
    };
  }
}