// Define the missing types locally instead of importing them
interface LMRequestParams {
  prompt: string;
  systemPrompt?: string;
  temperature?: number;
  maxTokens?: number;
  options?: any;
}

interface LMResponse {
  text: string;
  provider?: string;
  model?: string;
  usage?: {
    promptTokens?: number;
    completionTokens?: number;
    totalTokens?: number;
  };
}

import * as vscode from 'vscode';
import { LLMProviderConfig } from '../llm-provider-manager.js';

/**
 * LLMMonitoringClient provides a bridge between the VS Code extension's
 * LLM provider manager and monitoring systems like Langfuse.
 */
export class LLMMonitoringClient {
  private context: vscode.ExtensionContext;
  private outputChannel: vscode.OutputChannel;
  private enabled: boolean = false;
  private traceId: string | null = null;

  constructor(context: vscode.ExtensionContext, outputChannel?: vscode.OutputChannel) {
    this.context = context;
    this.outputChannel = outputChannel || vscode.window.createOutputChannel('LLM Monitoring');

    // Check if monitoring is enabled in settings
    const config = vscode.workspace.getConfiguration('theFuse');
    this.enabled = config.get<boolean>('enableLLMMonitoring', false);

    this.log(`LLM Monitoring initialized. Enabled: ${this.enabled}`);
  }

  /**
   * Start a new trace for a user session or operation
   */
  startTrace(options: {
    name?: string;
    userId?: string;
    metadata?: Record<string, any>;
    tags?: string[];
  }): string | null {
    if (!this.enabled) return null;

    try {
      // Generate a trace ID
      const traceId = `trace-${Date.now()}-${Math.random().toString(36).substring(2, 10)}`;
      this.traceId = traceId;

      this.log(`Started new trace: ${options.name || 'unnamed'} (${traceId})`);

      // Store trace info in extension state
      const traces = this.context.globalState.get<any[]>('thefuse.llm.traces', []);
      traces.push({
        id: traceId,
        name: options.name || 'unnamed',
        userId: options.userId,
        metadata: options.metadata,
        tags: options.tags,
        timestamp: Date.now()
      });

      // Limit the number of stored traces
      if (traces.length > 100) {
        traces.splice(0, traces.length - 100);
      }

      this.context.globalState.update('thefuse.llm.traces', traces);

      return traceId;
    } catch (error) {
      this.log(`Error starting trace: ${error instanceof Error ? error.message : String(error)}`);
      return null;
    }
  }

  /**
   * End the current trace
   */
  endTrace(traceId?: string): void {
    if (!this.enabled) return;

    const tId = traceId || this.traceId;
    if (tId) {
      this.log(`Ended trace: ${tId}`);
      if (tId === this.traceId) {
        this.traceId = null;
      }
    }
  }

  /**
   * Trace an LLM generation
   */
  async traceGeneration(
    provider: LLMProviderConfig,
    params: LMRequestParams,
    generationFunction: () => Promise<LMResponse>
  ): Promise<LMResponse> {
    if (!this.enabled) {
      return generationFunction();
    }

    const startTime = new Date();
    let result: LMResponse | undefined;
    let error: any;

    try {
      this.log(`Tracing LLM generation with provider: ${provider.name}`);
      result = await generationFunction();
      return result;
    } catch (e) {
      error = e;
      throw e;
    } finally {
      const endTime = new Date();

      // Store generation data in extension state
      try {
        if (result) {
          const generations = this.context.globalState.get<any[]>('thefuse.llm.generations', []);

          generations.push({
            id: `gen-${Date.now()}-${Math.random().toString(36).substring(2, 10)}`,
            traceId: this.traceId,
            provider: {
              id: provider.id,
              name: provider.name,
              provider: provider.provider,
              modelName: provider.modelName
            },
            request: {
              prompt: params.prompt,
              systemPrompt: params.systemPrompt,
              temperature: params.temperature,
              maxTokens: params.maxTokens,
              options: params.options
            },
            response: error ? null : {
              text: result.text.substring(0, 500),
              provider: result.provider || provider.name,
              model: result.model || provider.modelName,
              usage: result.usage || {}
            },
            error: error ? {
              message: error.message,
              name: error.name
            } : null,
            startTime: startTime.toISOString(),
            endTime: endTime.toISOString(),
            duration: endTime.getTime() - startTime.getTime()
          });

          // Limit the number of stored generations
          if (generations.length > 200) {
            generations.splice(0, generations.length - 200);
          }

          this.context.globalState.update('thefuse.llm.generations', generations);

          // Log completion details
          this.log(`Generation completed in ${endTime.getTime() - startTime.getTime()}ms with ${result.provider || provider.name}/${result.model || provider.modelName}`);
          if (result.usage) {
            this.log(`Token usage: ${JSON.stringify(result.usage)}`);
          }
        } else if (error) {
          this.log(`Generation error: ${error.message}`);
        }

        // Send telemetry if enabled
        this.sendTelemetry(provider, params, result, error, startTime, endTime);
      } catch (storeError) {
        this.log(`Error storing generation data: ${storeError instanceof Error ? storeError.message : String(storeError)}`);
      }
    }
  }

  /**
   * Send telemetry data to monitoring service if enabled
   */
  private sendTelemetry(
    provider: LLMProviderConfig,
    params: LMRequestParams,
    result: LMResponse | undefined,
    error: any,
    startTime: Date,
    endTime: Date
  ): void {
    // This is a placeholder for server-side integration with Langfuse
    // The actual implementation would send data to a server endpoint
    // that integrates with the LangfuseService

    const config = vscode.workspace.getConfiguration('theFuse');
    const telemetryEnabled = config.get<boolean>('enableTelemetry', false);

    if (!telemetryEnabled) {
      return;
    }

    try {
      const apiEndpoint = config.get<string>('monitoringEndpoint', '');
      if (!apiEndpoint) {
        return;
      }

      // In a real implementation, we would make an API call to the monitoring service
      this.log(`Would send telemetry to ${apiEndpoint}`);
    } catch (error) {
      this.log(`Error sending telemetry: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Log a message to the output channel
   */
  private log(message: string): void {
    this.outputChannel.appendLine(`[${new Date().toISOString()}] ${message}`);
  }

  /**
   * Get the current trace ID
   */
  getCurrentTraceId(): string | null {
    return this.traceId;
  }

  /**
   * Set the monitoring enabled state
   */
  setEnabled(enabled: boolean): void {
    this.enabled = enabled;

    // Save the setting
    vscode.workspace.getConfiguration('theFuse').update(
      'enableLLMMonitoring',
      enabled,
      vscode.ConfigurationTarget.Global
    );

    this.log(`LLM Monitoring ${enabled ? 'enabled' : 'disabled'}`);
  }

  /**
   * Get whether monitoring is enabled
   */
  isEnabled(): boolean {
    return this.enabled;
  }

  /**
   * Get metrics for the current session
   */
  getSessionMetrics(): {
    totalGenerations: number;
    avgResponseTime: number;
    errorRate: number;
    providerUsage: Record<string, number>;
    modelUsage: Record<string, number>;
  } {
    try {
      const generations = this.context.globalState.get<any[]>('thefuse.llm.generations', []);

      if (generations.length === 0) {
        return {
          totalGenerations: 0,
          avgResponseTime: 0,
          errorRate: 0,
          providerUsage: {},
          modelUsage: {}
        };
      }

      // Calculate total generations
      const totalGenerations = generations.length;

      // Calculate average response time
      const responseTimes = generations
        .filter(g => g.duration)
        .map(g => g.duration);

      const avgResponseTime = responseTimes.length > 0
        ? responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length
        : 0;

      // Calculate error rate
      const errorCount = generations.filter(g => g.error).length;
      const errorRate = totalGenerations > 0 ? errorCount / totalGenerations : 0;

      // Calculate provider and model usage
      const providerUsage: Record<string, number> = {};
      const modelUsage: Record<string, number> = {};

      for (const gen of generations) {
        if (gen.provider && gen.provider.provider) {
          providerUsage[gen.provider.provider] = (providerUsage[gen.provider.provider] || 0) + 1;
        }

        if (gen.response && gen.response.model) {
          modelUsage[gen.response.model] = (modelUsage[gen.response.model] || 0) + 1;
        } else if (gen.provider && gen.provider.modelName) {
          modelUsage[gen.provider.modelName] = (modelUsage[gen.provider.modelName] || 0) + 1;
        }
      }

      return {
        totalGenerations,
        avgResponseTime,
        errorRate,
        providerUsage,
        modelUsage
      };
    } catch (error) {
      this.log(`Error calculating metrics: ${error instanceof Error ? error.message : String(error)}`);
      return {
        totalGenerations: 0,
        avgResponseTime: 0,
        errorRate: 0,
        providerUsage: {},
        modelUsage: {}
      };
    }
  }
}

/**
 * Create an LLM Monitoring Client
 */
export function createLLMMonitoringClient(
  context: vscode.ExtensionContext,
  outputChannel?: vscode.OutputChannel
): LLMMonitoringClient {
  return new LLMMonitoringClient(context, outputChannel);
}