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
export declare class AggregateService {
    private readonly logger;
    /**
     * Aggregate responses from multiple agents
     */
    aggregateResponses(responses: Array<{
        agentId: string;
        response: string;
        confidence: number;
    }>): Promise<AggregationResult>;
    /**
     * Find consensus among agent opinions
     */
    findConsensus(opinions: Array<{
        agentId: string;
        opinion: string;
        weight: number;
    }>): Promise<ConsensusResult>;
    /**
     * Combine multiple data sources
     */
    combineDataSources(sources: Array<{
        sourceId: string;
        data: any;
        reliability: number;
    }>): Promise<{
        combinedData: any;
        reliability: number;
        conflicts: string[];
    }>;
    /**
     * Synthesize information from multiple agents
     */
    synthesizeInformation(agentInputs: Array<{
        agentId: string;
        information: any;
        expertise: string;
    }>): Promise<{
        synthesis: string;
        confidence: number;
        expertiseAreas: string[];
    }>;
}
//# sourceMappingURL=aggregate.service.d.ts.map