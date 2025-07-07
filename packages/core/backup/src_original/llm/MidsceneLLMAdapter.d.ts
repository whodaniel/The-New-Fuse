import { LLMRegistry, ExtendedLLMConfig } from './LLMRegistry';
import { MonitoringService } from /../monitoring/MonitoringService';';
import { WebSearchService } from /../web/WebSearchService';';
import { ContentAggregator } from /../content/ContentAggregator';';
interface MidsceneConfig extends ExtendedLLMConfig {
    enhanceContext?: boolean;
    webSearch?: boolean;
    maxSearchResults?: number;
    contextWindow?: number;
    fallbackProviders?: string[];
    retryStrategy?: simple' | exponential' | custom/;
}
export declare class MidsceneLLMAdapter {
    private logger;
    private registry;
    private monitoring;
    private contentAggregator;
    private webSearchService;
    private config;
    private metricsCollector;
    constructor(registry: LLMRegistry, monitoring: MonitoringService, contentAggregator: ContentAggregator, webSearchService: WebSearchService, config: MidsceneConfig);
    private recordSuccess;
}
export {};
