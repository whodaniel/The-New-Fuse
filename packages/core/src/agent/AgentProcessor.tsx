import { Injectable } from '@nestjs/common';
import { Logger } from '@the-new-fuse/utils';
import {
  LLMContext,
  LLMResponse,
  StreamChunk
} from '../llm/LLMProvider.js';
import { LLMRegistry } from '../llm/LLMRegistry.js';
import { MonitoringService } from '../monitoring/MonitoringService.js';
import { ErrorRecoveryService } from '../error/ErrorRecoveryService.js';
import { EventEmitter } from 'events';

export interface ProcessedMessage {
  id: string;
  content: string;
  role: 'system' | 'user' | 'assistant';
  timestamp: Date;
  metadata: Record<string, unknown>;
}

interface AgentConfig {
  id: string;
  name: string;
  model: string;
  systemPrompt?: string;
  temperature?: number;
  maxTokens?: number;
  functions?: Array<{
    name: string;
    description: string;
    parameters: Record<string, unknown>;
  }>;
  tools?: Array<{
    type: string;
    function: {
      name: string;
      description: string;
      parameters: Record<string, unknown>;
    };
  }>;
  metadata: Record<string, unknown>;
}

interface ProcessingMetrics {
  messageCount: number;
  tokenCount: number;
  errorCount: number;
  latencyMs: number[];
}

@Injectable()
export class AgentProcessor extends EventEmitter {
  private readonly logger: Logger;
  private readonly metrics: Map<string, ProcessingMetrics>;
  private readonly activeProcessing: Map<string, AbortController>;

  constructor(
    private readonly llmRegistry: LLMRegistry,
    private readonly monitoring: MonitoringService,
    private readonly errorRecovery: ErrorRecoveryService
  ) {
    super();
    this.logger = new Logger(AgentProcessor.name);
    this.metrics = new Map<string, ProcessingMetrics>();
    this.activeProcessing = new Map<string, AbortController>();
  }

  async processMessage(
    message: ProcessedMessage,
    agent: AgentConfig,
    context: LLMContext,
    processingId: string,
    signal?: AbortSignal
  ): Promise<LLMResponse> {
    try {
      const startTime = Date.now();
      this.logger.debug(`Processing message with model ${agent.model}`);

      // Prepare context
      const enhancedContext = await this.enhanceContext(context, agent, message);

      // Set up abort controller
      const controller = new AbortController();
      this.activeProcessing.set(processingId, controller);

      if (signal) {
        signal.addEventListener('abort', () => {
          controller.abort();
        });
      }

      // Get provider for the model
      const provider = await this.llmRegistry.getProvider(agent.model);
      if (!provider) {
        throw new Error(`No provider found for model ${agent.model}`);
      }

      // Generate response
      const response = await provider.generateResponse(enhancedContext);

      // Update metrics
      this.updateMetrics(agent.id, {
        messageCount: 1,
        tokenCount: response.usage?.totalTokens || 0,
        latencyMs: [Date.now() - startTime]
      });

      // Emit processing completed event
      this.emit('processingCompleted', {
        agentId: agent.id,
        messageId: message.id,
        response,
        metrics: {
          latencyMs: Date.now() - startTime,
          tokenCount: response.usage?.totalTokens || 0
        }
      });

      return response;

    } catch (error) {
      await this.handleError(error as Error, processingId);
      throw error;

    } finally {
      this.activeProcessing.delete(processingId);
    }
  }

  async processStreamingMessage(
    message: ProcessedMessage,
    agent: AgentConfig,
    context: LLMContext,
    processingId: string,
    signal: AbortSignal
  ): AsyncGenerator<StreamChunk, void, unknown> {
    try {
      const startTime = Date.now();

      // Prepare context
      const enhancedContext = await this.enhanceContext(context, agent, message);

      // Get provider for the model
      const provider = await this.llmRegistry.getProvider(agent.model);
      if (!provider) {
        throw new Error(`No provider found for model ${agent.model}`);
      }

      // Update metrics
      this.updateMetrics(agent.id, {
        messageCount: 1,
        latencyMs: [0]
      });

      // Initialize streaming metrics
      let totalTokens = 0;

      // Set up abort controller
      const controller = new AbortController();
      this.activeProcessing.set(processingId, controller);

      // Generate streaming response
      const stream = provider.generateStreamingResponse(enhancedContext);

      // Process stream
      for await (const chunk of stream) {
        if (signal.aborted) {
          throw new Error('Processing aborted');
        }

        totalTokens += chunk.usage?.completionTokens || 0;
        yield chunk;
      }

      // Update metrics
      this.updateMetrics(agent.id, {
        messageCount: 1,
        tokenCount: totalTokens,
        latencyMs: [Date.now() - startTime]
      });
    } catch (error) {
      await this.handleError(error as Error, processingId);
      throw error;

    } finally {
      this.activeProcessing.delete(processingId);
    }
  }

  async processWithRetry(
    message: ProcessedMessage,
    agent: AgentConfig,
    context: LLMContext,
    processingId: string
  ): Promise<LLMResponse> {
    try {
      const startTime = Date.now();
      this.logger.debug('Processing with retry', { context, processingId });

      const model = context.metadata?.model as string;
      if (!model) {
        throw new Error('Model is required in context metadata');
      }

      this.logger.debug(`Using model ${model}`);

      const provider = await this.llmRegistry.getProvider(model);
      if (!provider) {
        throw new Error(`No provider found for model ${model}`);
      }

      const response = await provider.generateResponse(context);

      this.updateMetrics(model, {
        messageCount: 1,
        tokenCount: response.usage?.totalTokens || 0,
        latencyMs: [Date.now() - startTime]
      });

      return response;
    } catch (error) {
      await this.handleError(error as Error, processingId);
      throw error;
    }
  }

  async processStreamWithRetry(
    context: LLMContext,
    processingId: string
  ): Promise<AsyncGenerator<StreamChunk, void, unknown>> {
    try {
      this.logger.debug('Processing stream request:', { context, processingId });

      const model = context.metadata?.model as string;
      if (!model) {
        throw new Error('Model is required in context metadata');
      }

      const provider = await this.llmRegistry.getProvider(model);
      if (!provider) {
        throw new Error(`No provider found for model ${model}`);
      }

      const stream = provider.generateStreamingResponse(context);

      this.updateMetrics(model, {
        messageCount: 1,
        latencyMs: [0] // Will be updated with actual latency when stream completes
      });

      return stream;
    } catch (error) {
      await this.handleError(error as Error, processingId);
      throw error;
    }
  }

  private async enhanceContext(
    context: LLMContext,
    agent: AgentConfig,
    message: ProcessedMessage
  ): Promise<LLMContext> {
    const systemMessage = agent.systemPrompt
      ? [{
          role: 'system' as const,
          content: agent.systemPrompt
        }]
      : [];

    const messages = [
      ...systemMessage,
      ...(context.messages || []),
      {
        role: message.role,
        content: message.content
      }
    ];

    return {
      messages,
      functions: agent.functions,
      tools: agent.tools,
      temperature: agent.temperature,
      maxTokens: agent.maxTokens,
      metadata: {
        ...context.metadata,
        agentId: agent.id,
        messageId: message.id,
        timestamp: message.timestamp,
        model: agent.model
      }
    };
  }

  private async handleError(error: Error, processingId: string): Promise<void> {
    try {
      this.logger.error('Error during LLM processing:', {
        error: error.message,
        processingId
      });

      // Update metrics
      this.updateMetrics('unknown', {
        errorCount: 1,
        latencyMs: [0]
      });

      // Record error in monitoring
      try {
        await this.monitoring.recordError('llm_error', {
          model: 'unknown',
          error: error.message,
          processingId,
          timestamp: new Date()
        });
      } catch (monitoringError) {
        this.logger.error('Failed to record error:', {
          originalError: error.message,
          monitoringError: monitoringError instanceof Error ? monitoringError.message : 'Unknown error'
        });
      }

      // Try to recover
      try {
        await this.errorRecovery.handleError(error, {
          processingId,
          component: 'AgentProcessor'
        });
      } catch (innerError) {
        this.logger.error('Error in error handler:', {
          originalError: error.message,
          handlerError: innerError instanceof Error ? innerError.message : 'Unknown error'
        });
      }
    } catch (e) {
      this.logger.error('Unhandled error in error handler', { error: e });
    }
  }

  private updateMetrics(model: string, metrics: {
    messageCount?: number;
    tokenCount?: number;
    errorCount?: number;
    latencyMs: number[];
  }): void {
    try {
      this.monitoring.recordMetric('llm_processing', {
        model,
        messageCount: metrics.messageCount,
        tokenCount: metrics.tokenCount,
        errorCount: metrics.errorCount,
        latencyMs: metrics.latencyMs,
        timestamp: new Date()
      });
    } catch (error) {
      this.logger.error('Failed to update metrics:', {
        error: error instanceof Error ? error.message : 'Unknown error',
        model,
        metrics
      });
    }

    // Update local metrics
    const currentMetrics = this.metrics.get(model) || {
      messageCount: 0,
      tokenCount: 0,
      errorCount: 0,
      latencyMs: []
    };

    this.metrics.set(model, {
      messageCount: currentMetrics.messageCount + (metrics.messageCount || 0),
      tokenCount: currentMetrics.tokenCount + (metrics.tokenCount || 0),
      errorCount: currentMetrics.errorCount + (metrics.errorCount || 0),
      latencyMs: metrics.latencyMs ? [...currentMetrics.latencyMs, ...metrics.latencyMs] : currentMetrics.latencyMs
    });
  }

  getMetrics(agentId: string): ProcessingMetrics | undefined {
    return this.metrics.get(agentId);
  }

  getAllMetrics(): Map<string, ProcessingMetrics> {
    return new Map(this.metrics);
  }

  resetMetrics(agentId?: string): void {
    if(agentId) {
      this.metrics.delete(agentId);
    } else {
      this.metrics.clear();
    }
  }

  cancelProcessing(processingId?: string): void {
    const controller = processingId ? this.activeProcessing.get(processingId) : null;

    if (controller) {
      controller.abort();
    } else if (!processingId) {
      // Cancel all processing if no specific ID provided
      for (const controller of this.activeProcessing.values()) {
        controller.abort();
      }
      this.activeProcessing.clear();
    }
  }
}
