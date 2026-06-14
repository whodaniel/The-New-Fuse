/**
 * Research Agent Implementation
 * An AI agent specialized in web research, data gathering, and information synthesis
 */
import { IAgent } from '../interfaces/IAgent.js';
export interface ResearchConfig {
    agentId: string;
    name: string;
    maxSearchResults?: number;
    searchEngines?: string[];
    summarizationModel?: string;
    maxTokens?: number;
    temperature?: number;
}
export interface ResearchQuery {
    topic: string;
    depth?: 'shallow' | 'deep' | 'comprehensive';
    sources?: string[];
    timeRange?: {
        start?: Date;
        end?: Date;
    };
    format?: 'summary' | 'detailed' | 'structured';
}
export interface ResearchResult {
    query: string;
    sources: Source[];
    summary: string;
    keyFindings: string[];
    metadata: {
        searchTime: number;
        sourcesAnalyzed: number;
        confidence: number;
    };
}
export interface Source {
    url: string;
    title: string;
    snippet: string;
    relevanceScore: number;
    publishedAt?: Date;
}
export declare class ResearchAgent implements IAgent {
    readonly id: string;
    readonly name: string;
    readonly type = "research";
    readonly capabilities: string[];
    private config;
    private memory;
    private state;
    private isInitialized;
    constructor(config: ResearchConfig);
    initialize(): Promise<void>;
    process(message: any): Promise<any>;
    learn(data: unknown): Promise<void>;
    saveToMemory(key: string, value: unknown): Promise<void>;
    retrieveFromMemory(key: string): Promise<any>;
    getState(): Promise<any>;
    setState(state: unknown): Promise<void>;
    sendMessage(message: any): Promise<void>;
    receiveMessage(message: any): Promise<void>;
    handleError(error: Error): Promise<void>;
    private performResearch;
    private searchSources;
    private analyzeContent;
    private generateSummary;
    private extractKeyFindings;
    private calculateConfidence;
    private summarizeContent;
    private verifyFacts;
    private extractData;
}
export default ResearchAgent;
//# sourceMappingURL=research_agent.d.ts.map