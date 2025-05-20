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
export declare class LLMMonitoringClient {
    private context;
    private outputChannel;
    private enabled;
    private traceId;
    constructor(context: vscode.ExtensionContext, outputChannel?: vscode.OutputChannel);
    /**
     * Start a new trace for a user session or operation
     */
    startTrace(options: {
        name?: string;
        userId?: string;
        metadata?: Record<string, any>;
        tags?: string[];
    }): string | null;
    /**
     * End the current trace
     */
    endTrace(traceId?: string): void;
    /**
     * Trace an LLM generation
     */
    traceGeneration(provider: LLMProviderConfig, params: LMRequestParams, generationFunction: () => Promise<LMResponse>): Promise<LMResponse>;
    /**
     * Send telemetry data to monitoring service if enabled
     */
    private sendTelemetry;
    /**
     * Log a message to the output channel
     */
    private log;
    /**
     * Get the current trace ID
     */
    getCurrentTraceId(): string | null;
    /**
     * Set the monitoring enabled state
     */
    setEnabled(enabled: boolean): void;
    /**
     * Get whether monitoring is enabled
     */
    isEnabled(): boolean;
    /**
     * Get metrics for the current session
     */
    getSessionMetrics(): {
        totalGenerations: number;
        avgResponseTime: number;
        errorRate: number;
        providerUsage: Record<string, number>;
        modelUsage: Record<string, number>;
    };
}
/**
 * Create an LLM Monitoring Client
 */
export declare function createLLMMonitoringClient(context: vscode.ExtensionContext, outputChannel?: vscode.OutputChannel): LLMMonitoringClient;
export {};
//# sourceMappingURL=llm-monitoring-client.d.ts.map