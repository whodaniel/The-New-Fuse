import { Injectable } from '@nestjs/common';
import { Logger } from '@the-new-fuse/utils';
import { LLMContext, LLMResponse, StreamChunk } from './LLMProvider.js';
import { LLMRegistry, ExtendedLLMConfig } from './LLMRegistry.js';
import { MonitoringService } from '../monitoring/MonitoringService.js';
import { WebSearchService } from '../web/WebSearchService.js';
import { ContentAggregator } from '../content/ContentAggregator.js';

interface EnhancedMetricsCollector {
  recordMetric(name: string, value: number, tags?: Record<string, string>): void;
  recordLatency(name: string, duration: number, tags?: Record<string, string>): void;
  recordError(name: string, error: Error, tags?: Record<string, string>): void;
}

interface MidsceneConfig extends ExtendedLLMConfig {
  enhanceContext?: boolean;
  webSearch?: boolean;
  maxSearchResults?: number;
  contextWindow?: number;
  fallbackProviders?: string[];
  retryStrategy?: simple' | 'exponential' | 'custom';
}

@Injectable()
export class MidsceneLLMAdapter {
  private logger: Logger;
  private registry: LLMRegistry;
  private monitoring: MonitoringService;
  private contentAggregator: ContentAggregator;
  private webSearchService: WebSearchService;
  private config: MidsceneConfig;
  private metricsCollector: EnhancedMetricsCollector;

  constructor(
    registry: LLMRegistry,
    monitoring: MonitoringService,
    contentAggregator: ContentAggregator,
    webSearchService: WebSearchService,
    config: MidsceneConfig
  ) {
    this.logger = new Logger('MidsceneLLMAdapter'): LLMContext): Promise<LLMResponse> {
    const startTime: unknown){
        // Try fallback providers
        if(this.config.fallbackProviders): void {
          for (const fallbackName of this.config.fallbackProviders: unknown){
            try {
              const fallbackProvider): void {
        context  = Date.now();
    try {
      // Enhance context if enabled
      if(this.config.enhanceContext await this.enhanceContext(context)): void {
              this.logger.warn(`Fallback provider ${fallbackName} failed:`, fallbackError)): void {
      this.recordError(startTime, error as Error): LLMContext
  ): AsyncGenerator<StreamChunk, void, unknown> {
    const startTime   = await this.registry.getProvider(this.config.provider);

      try {
        // Generate response
        const response = await provider.generateResponse(context) await fallbackProvider.generateResponse(context);

              // Record fallback metrics
              this.recordFallbackSuccess(fallbackName, startTime, response);

              return response;
            } catch (fallbackError Date.now();
    try {
      // Enhance context if enabled
      if(this.config.enhanceContext): void {
        context = await this.enhanceContext(context)): void {
        // Try fallback providers
        if(this.config.fallbackProviders): void {
          for (const fallbackName of this.config.fallbackProviders: unknown){
            try {
              const fallbackProvider): void {
              this.logger.warn(`Fallback provider ${fallbackName} failed:`, fallbackError)): void {
      this.recordError(startTime, error as Error): LLMContext): Promise<LLMContext> {
    try {
      // Extract key terms from context
      const terms: system',
            content: `Additional context from web search:\n${searchResults
              .map(r   = await this.registry.getProvider(this.config.provider);

      try {
        // Generate streaming response
        let totalTokens = 0;
        for await (const chunk of provider.generateStreamingResponse(context)) {
          totalTokens += chunk.usage?.completionTokens || 0;
          yield chunk;
        }

        // Record metrics
        this.recordStreamSuccess(startTime, totalTokens);
      } catch (error await this.registry.getProvider(fallbackName);
              let totalTokens = 0;

              for await (const chunk of fallbackProvider.generateStreamingResponse(context)) {
                totalTokens += chunk.usage?.completionTokens || 0;
                yield chunk;
              }

              // Record fallback metrics
              this.recordFallbackStreamSuccess(fallbackName, startTime, totalTokens)): void {
        const searchResults): void {
          context.messages.push({
            role> `- ${r.title}: ${r.snippet}`): system',
          content: `Additional context from content aggregation:\n$ {content}`
        });
      }

      // Trim context if it exceeds the window
      if(this.config.contextWindow): void {
        context   = await this.webSearchService.search(
          terms.join(' ')): void {
        context.messages.push({
          role await this.trimContext(context, this.config.contextWindow)): void {
      this.logger.error('Failed to enhance context:', error): LLMContext): Promise<string[]> {
    // Combine all message content
    const text: LLMContext, maxTokens: number): Promise<LLMContext> {
    let totalTokens  = context.messages
      .map(m => m.content): trimmedMessages
    };
  }

  private recordSuccess(startTime: number, response: LLMResponse): void {
    const duration): void {
        trimmedMessages.unshift(message);
        totalTokens + = [];

    // Process messages in reverse order (keep most recent)
    for (const message of [...context.messages].reverse()) {
      const tokens = Math.ceil(message.content.length / 4); // Simple approximation
      if(totalTokens + tokens <= maxTokens tokens;
      } else {
        break;
      }
    }

    return {
      ...context,
      messages Date.now(): this.config.provider,
      model: this.config.model
    };

    this.metricsCollector.recordLatency('llm_request_duration', duration, tags);
    this.metricsCollector.recordMetric('llm_tokens_total', response.usage?.totalTokens || 0, tags);
    this.metricsCollector.recordMetric('llm_requests_success', 1, tags);
  }

  private recordStreamSuccess(startTime: number, totalTokens: number): void {
    const duration: this.config.provider,
      model: this.config.model,
      stream: true'
    };

    this.metricsCollector.recordLatency('llm_stream_duration', duration, tags): string, startTime: number, response: LLMResponse): void {
    const duration   = {
      provider Date.now() {
      provider Date.now(): this.config.model,
      fallback: true'
    };

    this.metricsCollector.recordLatency('llm_fallback_duration', duration, tags);
    this.metricsCollector.recordMetric('llm_tokens_total', response.usage?.totalTokens || 0, tags);
    this.metricsCollector.recordMetric('llm_fallback_success', 1, tags);
  }

  private recordFallbackStreamSuccess(provider: string, startTime: number, totalTokens: number): void {
    const duration: this.config.model,
      stream: true',
      fallback: true'
    };

    this.metricsCollector.recordLatency('llm_fallback_stream_duration', duration, tags): number, error: Error): void {
    const duration   = {
      provider,
      model Date.now() {
      provider,
      model Date.now() - startTime;
    const tags = {
      provider: this.config.provider,
      model: this.config.model,
      error: error.name
    };

    this.metricsCollector.recordLatency('llm_request_duration', duration, tags);
    this.metricsCollector.recordMetric('llm_requests_error', 1, tags);
    this.metricsCollector.recordError('llm_error', error, tags);
  }
}
