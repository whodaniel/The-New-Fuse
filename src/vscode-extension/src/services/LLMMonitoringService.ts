import * as vscode from 'vscode';
import { LLMProviderConfig, LLMProviderRequest, LLMProviderResponse } from '../types/llm'; // Assuming these types exist

// Interfaces for stored monitoring data
interface MonitoredLLMRequestData {
    prompt: string; // Or a more detailed request structure
    systemPrompt?: string;
    temperature?: number;
    maxTokens?: number;
    options?: any; // To capture other provider-specific options
    // Consider aligning with LLMProviderRequest from '../types/llm'
}

interface MonitoredLLMResponseData {
    text: string; // Or a more detailed response structure
    // provider and model are part of MonitoredGeneration.providerInfo
    usage?: {
        promptTokens?: number;
        completionTokens?: number;
        totalTokens?: number;
    };
    // Consider aligning with LLMProviderResponse from '../types/llm'
}

export interface MonitoredGeneration {
    id: string; // Unique ID for the generation event
    traceId: string | null; // ID of the parent trace, if any
    providerInfo: {
        id: string; // ID of the LLMProviderConfig
        name: string; // Display name of the provider
        provider: string; // Type of provider (e.g., 'openai', 'ollama', 'vscode')
        modelName?: string; // Specific model used
    };
    request: MonitoredLLMRequestData;
    response: MonitoredLLMResponseData | null; // Null if an error occurred
    error: {
        message: string;
        name: string;
        stack?: string;
    } | null;
    startTime: string; // ISO 8601 timestamp
    endTime: string; // ISO 8601 timestamp
    duration: number; // Duration in milliseconds
    timestamp: string; // ISO 8601 timestamp, can be same as startTime or a separate recording time
}

export interface MonitoredTrace {
    id: string; // Unique ID for the trace
    name: string; // User-defined name for the trace (e.g., 'SummarizeCode', 'ChatSession')
    userId?: string; // Optional user identifier
    metadata?: Record<string, any>; // Arbitrary metadata
    tags?: string[]; // Tags for categorization
    timestamp: string; // ISO 8601 timestamp when the trace started
    // Generations could be linked here if needed, but for simplicity, we store them separately for now
    // and can correlate by traceId.
}

export class LLMMonitoringService {
    private context: vscode.ExtensionContext;
    private outputChannel: vscode.OutputChannel;
    private enabled: boolean = false;
    private currentTraceId: string | null = null;

    private static readonly TRACES_STATE_KEY = 'theNewFuse.monitoring.traces';
    private static readonly GENERATIONS_STATE_KEY = 'theNewFuse.monitoring.generations';
    private static readonly MAX_TRACES = 100;
    private static readonly MAX_GENERATIONS = 200;

    constructor(context: vscode.ExtensionContext, outputChannel?: vscode.OutputChannel) {
        this.context = context;
        this.outputChannel = outputChannel || vscode.window.createOutputChannel('The New Fuse LLM Monitoring');

        // Load enabled state from configuration
        this.updateEnabledState();
        vscode.workspace.onDidChangeConfiguration(e => {
            if (e.affectsConfiguration('theNewFuse.monitoring.enableLLMMonitoring')) {
                this.updateEnabledState();
            }
        });

        this.log(`LLM Monitoring Service initialized. Enabled: ${this.enabled}`);
    }

    private updateEnabledState(): void {
        const config = vscode.workspace.getConfiguration('theNewFuse.monitoring');
        this.enabled = config.get<boolean>('enableLLMMonitoring', true); // Default to true for now
        this.log(`LLM Monitoring is now ${this.enabled ? 'ENABLED' : 'DISABLED'}`);
    }

    private log(message: string): void {
        this.outputChannel.appendLine(`[${new Date().toISOString()}] [LLMMonitoring] ${message}`);
    }

    public isEnabled(): boolean {
        return this.enabled;
    }

    public setEnabled(enabled: boolean): void {
        vscode.workspace.getConfiguration('theNewFuse.monitoring').update(
            'enableLLMMonitoring',
            enabled,
            vscode.ConfigurationTarget.Global
        );
        // The onDidChangeConfiguration handler will update this.enabled and log
    }

    public startTrace(options: {
        name: string; // Name is mandatory for a trace
        userId?: string;
        metadata?: Record<string, any>;
        tags?: string[];
    }): string | null {
        if (!this.enabled) {return null;}

        try {
            const traceId = `trace-${Date.now()}-${Math.random().toString(36).substring(2, 10)}`;
            this.currentTraceId = traceId;

            const newTrace: MonitoredTrace = {
                id: traceId,
                name: options.name,
                userId: options.userId,
                metadata: options.metadata,
                tags: options.tags,
                timestamp: new Date().toISOString(),
            };

            const traces = this.context.globalState.get<MonitoredTrace[]>(LLMMonitoringService.TRACES_STATE_KEY, []);
            traces.push(newTrace);
            if (traces.length > LLMMonitoringService.MAX_TRACES) {
                traces.splice(0, traces.length - LLMMonitoringService.MAX_TRACES);
            }
            this.context.globalState.update(LLMMonitoringService.TRACES_STATE_KEY, traces);

            this.log(`Started trace: '${options.name}' (ID: ${traceId})`);
            return traceId;
        } catch (error) {
            this.log(`Error starting trace: ${error instanceof Error ? error.message : String(error)}`);
            return null;
        }
    }

    public endTrace(traceId?: string): void {
        if (!this.enabled) {return;}

        const tId = traceId || this.currentTraceId;
        if (tId) {
            this.log(`Ended trace (ID: ${tId})`);
            if (tId === this.currentTraceId) {
                this.currentTraceId = null;
            }
            // Optionally, update the trace record in globalState with an end time or status
        }
    }

    public getCurrentTraceId(): string | null {
        return this.currentTraceId;
    }

    // Placeholder for traceGeneration - will be more complex
    public async traceGeneration<TRequest extends LLMProviderRequest, TResponse extends LLMProviderResponse>(
        providerConfig: LLMProviderConfig, // Assuming LLMProviderConfig is available
        requestParams: TRequest,
        generationFunction: () => Promise<TResponse>
    ): Promise<TResponse> {
        if (!this.enabled) {
            return generationFunction();
        }

        const startTime = new Date();
        let response: TResponse | undefined;
        let errorObj: any;
        const generationId = `gen-${Date.now()}-${Math.random().toString(36).substring(2, 10)}`;

        this.log(`Tracing generation (ID: ${generationId}) for provider: ${providerConfig.name}, model: ${providerConfig.modelName || 'default'}`);

        try {
            response = await generationFunction();
            return response;
        } catch (e) {
            errorObj = e;
            this.log(`Error during traced generation (ID: ${generationId}): ${e instanceof Error ? e.message : String(e)}`);
            throw e;
        } finally {
            const endTime = new Date();
            try {
                // Adapt requestParams and response to MonitoredLLMRequestData and MonitoredLLMResponseData
                // This is a simplified adaptation and might need more detailed mapping
                const monitoredRequest: MonitoredLLMRequestData = {
                    prompt: typeof requestParams.prompt === 'string' ? requestParams.prompt : JSON.stringify(requestParams.prompt), // Example, needs refinement
                    systemPrompt: requestParams.systemPrompt,
                    temperature: requestParams.temperature,
                    maxTokens: requestParams.maxTokens,
                    options: requestParams.options,
                };

                let monitoredResponse: MonitoredLLMResponseData | null = null;
                if (response && !errorObj) {
                    monitoredResponse = {
                        text: typeof response.content === 'string' ? response.content : JSON.stringify(response.content), // Example, needs refinement
                        usage: response.usage,
                    };
                }

                const generation: MonitoredGeneration = {
                    id: generationId,
                    traceId: this.currentTraceId,
                    providerInfo: {
                        id: providerConfig.id,
                        name: providerConfig.name,
                        provider: providerConfig.provider || 'unknown', // Handle optional provider
                        modelName: providerConfig.modelName, // modelName is optional in MonitoredGeneration.providerInfo
                    },
                    request: monitoredRequest,
                    response: monitoredResponse,
                    error: errorObj ? {
                        message: errorObj.message,
                        name: errorObj.name,
                        stack: errorObj.stack,
                    } : null,
                    startTime: startTime.toISOString(),
                    endTime: endTime.toISOString(),
                    duration: endTime.getTime() - startTime.getTime(),
                    timestamp: startTime.toISOString(), // Add timestamp here
                };

                const generations = this.context.globalState.get<MonitoredGeneration[]>(LLMMonitoringService.GENERATIONS_STATE_KEY, []);
                generations.push(generation);
                if (generations.length > LLMMonitoringService.MAX_GENERATIONS) {
                    generations.splice(0, generations.length - LLMMonitoringService.MAX_GENERATIONS);
                }
                this.context.globalState.update(LLMMonitoringService.GENERATIONS_STATE_KEY, generations);

                this.log(`Generation (ID: ${generationId}) completed in ${generation.duration}ms. Stored.`);
                if (generation.error) {
                     this.log(`Generation (ID: ${generationId}) resulted in error: ${generation.error.name}`);
                }
                 if (monitoredResponse?.usage) {
                    this.log(`Token usage for generation (ID: ${generationId}): ${JSON.stringify(monitoredResponse.usage)}`);
                }

                // Placeholder for actual telemetry sending
                this.sendTelemetry(generation);

            } catch (storeError) {
                this.log(`Error storing generation data (ID: ${generationId}): ${storeError instanceof Error ? storeError.message : String(storeError)}`);
            }
        }
    }

    private sendTelemetry(generationData: MonitoredGeneration): void {
        const config = vscode.workspace.getConfiguration('theNewFuse.monitoring');
        const telemetryEnabled = config.get<boolean>('enableTelemetry', false);
        const endpoint = config.get<string>('telemetryEndpoint');

        if (!telemetryEnabled || !endpoint) {
            if (telemetryEnabled && !endpoint) {
                this.log("Telemetry enabled but no endpoint configured.");
            }
            return;
        }

        this.log(`(Placeholder) Would send telemetry for generation ID ${generationData.id} to ${endpoint}`);
        // In a real implementation, make an HTTP POST request with generationData
        // Example:
        // vscode.window.fetch(endpoint, {
        //     method: 'POST',
        //     headers: { 'Content-Type': 'application/json' },
        //     body: JSON.stringify(generationData)
        // }).catch(err => this.log(`Telemetry send error: ${err}`));
    }
    
    public getSessionMetrics(): {
        totalGenerations: number;
        successfulGenerations: number;
        failedGenerations: number;
        avgResponseTime: number; // milliseconds
        errorRate: number; // 0.0 to 1.0
        providerUsage: Record<string, number>; // count by providerConfig.provider
        modelUsage: Record<string, number>; // count by providerConfig.modelName
    } {
        if (!this.enabled) {
            this.log("Cannot get session metrics, monitoring is disabled.");
            return {
                totalGenerations: 0, successfulGenerations: 0, failedGenerations: 0,
                avgResponseTime: 0, errorRate: 0, providerUsage: {}, modelUsage: {}
            };
        }

        try {
            const generations = this.context.globalState.get<MonitoredGeneration[]>(LLMMonitoringService.GENERATIONS_STATE_KEY, []);

            if (generations.length === 0) {
                return {
                    totalGenerations: 0, successfulGenerations: 0, failedGenerations: 0,
                    avgResponseTime: 0, errorRate: 0, providerUsage: {}, modelUsage: {}
                };
            }

            const totalGenerations = generations.length;
            const successfulGenerations = generations.filter(g => !g.error).length;
            const failedGenerations = generations.filter(g => g.error).length;
            
            const responseTimes = generations
                .filter(g => !g.error && g.duration !== undefined)
                .map(g => g.duration);
            
            const avgResponseTime = responseTimes.length > 0
                ? responseTimes.reduce((sum, time) => sum + time, 0) / responseTimes.length
                : 0;

            const errorRate = totalGenerations > 0 ? failedGenerations / totalGenerations : 0;

            const providerUsage: Record<string, number> = {};
            const modelUsage: Record<string, number> = {};

            for (const gen of generations) {
                if (gen.providerInfo) {
                    providerUsage[gen.providerInfo.provider] = (providerUsage[gen.providerInfo.provider] || 0) + 1;
                    if (gen.providerInfo.modelName) {
                        modelUsage[gen.providerInfo.modelName] = (modelUsage[gen.providerInfo.modelName] || 0) + 1;
                    }
                }
            }

            return {
                totalGenerations,
                successfulGenerations,
                failedGenerations,
                avgResponseTime,
                errorRate,
                providerUsage,
                modelUsage
            };
        } catch (error) {
            this.log(`Error calculating session metrics: ${error instanceof Error ? error.message : String(error)}`);
            return { // Return empty/default metrics on error
                totalGenerations: 0, successfulGenerations: 0, failedGenerations: 0,
                avgResponseTime: 0, errorRate: 0, providerUsage: {}, modelUsage: {}
            };
        }
    }

    public getAllTraces(): MonitoredTrace[] {
        if (!this.enabled) {return [];}
        return this.context.globalState.get<MonitoredTrace[]>(LLMMonitoringService.TRACES_STATE_KEY, []);
    }

    public getAllGenerations(): MonitoredGeneration[] {
        if (!this.enabled) {return [];}
        return this.context.globalState.get<MonitoredGeneration[]>(LLMMonitoringService.GENERATIONS_STATE_KEY, []);
    }

    public clearAllMonitoringData(): void {
        if (!this.enabled) {
            this.log("Cannot clear monitoring data, monitoring is disabled.");
            return;
        }
        this.context.globalState.update(LLMMonitoringService.TRACES_STATE_KEY, []);
        this.context.globalState.update(LLMMonitoringService.GENERATIONS_STATE_KEY, []);
        this.log("Cleared all monitoring traces and generations from global state.");
    }
}

// Factory function to create an instance easily
export function createLLMMonitoringService(
    context: vscode.ExtensionContext,
    outputChannel?: vscode.OutputChannel
): LLMMonitoringService {
    return new LLMMonitoringService(context, outputChannel);
}
