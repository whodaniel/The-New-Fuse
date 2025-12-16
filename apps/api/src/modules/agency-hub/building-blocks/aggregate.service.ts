import { Injectable, Logger } from '@nestjs/common';

export interface AggregationResult {
  summary: string;
  keyPoints: string[];
  confidence: number;
  sources: string[];
}

export interface ConsensusResult {
  consensus: string;
  agreement: number;
  dissenting: string[];
  reasoning: string;
}

@Injectable()
export class AggregateService {
  private readonly logger = new Logger(AggregateService.name);

  /**
   * Aggregate responses from multiple agents
   */
  async aggregateResponses(
    responses: Array<{
      agentId: string;
      response: string;
      confidence: number;
    }>
  ): Promise<AggregationResult> {
    this.logger.log(`Aggregating ${responses.length} responses`);

    if (responses.length === 0) {
      return {
        summary: 'No responses to aggregate',
        keyPoints: [],
        confidence: 0,
        sources: [],
      };
    }

    // Use consensus finding as the core aggregation strategy
    const opinions = responses.map((r) => ({
      agentId: r.agentId,
      opinion: r.response,
      weight: r.confidence,
    }));

    const consensusResult = await this.findConsensus(opinions);

    // Calculate confidence for the aggregated result
    // We can use the average confidence of the agents that agreed with the consensus
    const winningResponseNormalized = consensusResult.consensus.trim().toLowerCase();
    const winningAgents = responses.filter(
      (r) => r.response.trim().toLowerCase() === winningResponseNormalized
    );

    // If consensus is "No clear consensus found" or similar fallback, handled gracefully
    const avgConfidence =
      winningAgents.length > 0
        ? winningAgents.reduce((sum, r) => sum + r.confidence, 0) / winningAgents.length
        : 0;

    // Collect key points (unique responses)
    const keyPoints = Array.from(new Set(responses.map((r) => r.response)));

    return {
      summary: winningAgents.length > 0 ? winningAgents[0].response : consensusResult.consensus,
      keyPoints,
      confidence: avgConfidence,
      sources: responses.map((r) => r.agentId),
    };
  }

  /**
   * Find consensus among agent opinions
   */
  async findConsensus(
    opinions: Array<{
      agentId: string;
      opinion: string;
      weight: number;
    }>
  ): Promise<ConsensusResult> {
    this.logger.log(`Finding consensus among ${opinions.length} opinions`);

    if (opinions.length === 0) {
      return {
        consensus: 'No opinions provided',
        agreement: 0,
        dissenting: [],
        reasoning: 'No input data',
      };
    }

    // Group opinions by normalized text
    const groups = new Map<
      string,
      {
        totalWeight: number;
        agents: string[];
        originalText: string;
      }
    >();

    let totalWeightAll = 0;

    for (const { agentId, opinion, weight } of opinions) {
      const normalized = opinion.trim().toLowerCase();
      const existing = groups.get(normalized);

      totalWeightAll += weight;

      if (existing) {
        existing.totalWeight += weight;
        existing.agents.push(agentId);
      } else {
        groups.set(normalized, {
          totalWeight: weight,
          agents: [agentId],
          originalText: opinion,
        });
      }
    }

    // Find the winning group
    let winner = {
      normalized: '',
      totalWeight: -1,
      agents: [] as string[],
      originalText: '',
    };

    for (const [key, data] of groups.entries()) {
      if (data.totalWeight > winner.totalWeight) {
        winner = {
          normalized: key,
          totalWeight: data.totalWeight,
          agents: data.agents,
          originalText: data.originalText,
        };
      }
    }

    const agreement = totalWeightAll > 0 ? winner.totalWeight / totalWeightAll : 0;

    // Identify dissenting agents (all agents not in the winning group)
    const dissenting = opinions
      .filter((o) => o.opinion.trim().toLowerCase() !== winner.normalized)
      .map((o) => o.agentId);

    const reasoning = `Consensus reached on "${winner.originalText}" with ${Math.round(agreement * 100)}% agreement (weighted). Supported by agents: ${winner.agents.join(', ')}.`;

    return {
      consensus: winner.originalText,
      agreement,
      dissenting,
      reasoning,
    };
  }

  /**
   * Combine multiple data sources
   */
  async combineDataSources(
    sources: Array<{
      sourceId: string;
      data: any;
      reliability: number;
    }>
  ): Promise<{
    combinedData: any;
    reliability: number;
    conflicts: string[];
  }> {
    this.logger.log(`Combining ${sources.length} data sources`);

    // TODO: Implement data combination logic
    return {
      combinedData: {},
      reliability: 0.8,
      conflicts: [],
    };
  }

  /**
   * Synthesize information from multiple agents
   */
  async synthesizeInformation(
    agentInputs: Array<{
      agentId: string;
      information: any;
      expertise: string;
    }>
  ): Promise<{
    synthesis: string;
    confidence: number;
    expertiseAreas: string[];
  }> {
    this.logger.log(`Synthesizing information from ${agentInputs.length} agents`);

    // TODO: Implement information synthesis logic
    return {
      synthesis: 'Synthesized information from multiple expert agents',
      confidence: 0.7,
      expertiseAreas: agentInputs.map((i) => i.expertise),
    };
  }
}
