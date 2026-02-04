"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var FuseMonitoringService_1;
var _a;
Object.defineProperty(exports, "__esModule", { value: true });
exports.FuseMonitoringService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const common_2 = require("@nestjs/common");
const langfuse_1 = require("langfuse");
const LLMRegistry_1 = require("@/llm/LLMRegistry");
/**
 * FuseMonitoringService
 *
 * This service provides comprehensive tracing, observability, and evaluation
 * of LLM operations within The New Fuse platform.
 *
 * It can be used to trace various aspects of LLM usage including:
 * - Completions and chat completions
 * - Prompt execution and rendering
 * - Tool use and function calls
 * - Evaluation of generation quality
 *
 * The service offers native monitoring capabilities with optional
 * integration with external services like Langfuse.
 */
let FuseMonitoringService = FuseMonitoringService_1 = class FuseMonitoringService {
    configService;
    llmRegistry;
    logger = new common_2.Logger(FuseMonitoringService_1.name);
    langfuse = null;
    langfuseEnabled = false;
    monitoringEnabled = true;
    localTraceStore = new Map();
    localGenerationStore = new Map();
    localScoreStore = new Map();
    constructor(configService, llmRegistry) {
        this.configService = configService;
        this.llmRegistry = llmRegistry;
        // Initialize native monitoring
        this.monitoringEnabled = this.configService.get('FUSE_MONITORING_ENABLED', true);
        // Initialize Langfuse client if configured
        const secretKey = this.configService.get('LANGFUSE_SECRET_KEY');
        const publicKey = this.configService.get('LANGFUSE_PUBLIC_KEY');
        const host = this.configService.get('LANGFUSE_HOST', 'https://langfuse.com');
        this.langfuseEnabled = !!secretKey && !!publicKey &&
            this.configService.get('LANGFUSE_ENABLED', false);
        if (this.langfuseEnabled) {
            try {
                this.langfuse = new langfuse_1.Langfuse({
                    secretKey,
                    publicKey,
                    host,
                });
                this.logger.log(`Langfuse client initialized with host: ${host}`);
            }
            catch (error) {
                this.logger.error(`Failed to initialize Langfuse client: ${error.message}`);
                this.langfuseEnabled = false;
                this.langfuse = null;
            }
        }
        else {
            this.logger.log('Langfuse integration is disabled or not configured');
        }
        this.logger.log(`FuseMonitoringService initialized. Native monitoring: ${this.monitoringEnabled ? 'ENABLED' : 'DISABLED'}, Langfuse: ${this.langfuseEnabled ? 'ENABLED' : 'DISABLED'}`);
    }
    async onModuleInit() {
        if (this.langfuseEnabled && this.langfuse) {
            try {
                // Test connection to Langfuse
                await this.langfuse.ping();
                this.logger.log('Successfully connected to Langfuse');
            }
            catch (error) {
                this.logger.error(`Failed to connect to Langfuse: ${error.message}`);
                this.langfuseEnabled = false;
            }
        }
    }
    /**
     * Create a new trace for tracking a high-level user session or operation
     */
    createTrace(options) {
        const traceId = `trace-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;
        if (this.monitoringEnabled) {
            try {
                // Store trace in local storage
                const trace = {
                    id: traceId,
                    name: options.name || 'unnamed-trace',
                    userId: options.userId,
                    metadata: options.metadata || {},
                    tags: options.tags || [],
                    createdAt: new Date(),
                    children: []
                };
                this.localTraceStore.set(traceId, trace);
                this.logger.debug(`Created trace: ${traceId} (${options.name})`);
                // Cleanup old traces if we have too many
                if (this.localTraceStore.size > 1000) {
                    this.cleanupOldTraces();
                }
            }
            catch (error) {
                this.logger.error(`Error creating native trace: ${error.message}`);
            }
        }
        // Also create in Langfuse if enabled
        let langfuseTrace = null;
        if (this.langfuseEnabled && this.langfuse) {
            try {
                langfuseTrace = this.langfuse.trace({
                    id: traceId, // Use the same ID for consistency
                    name: options.name,
                    userId: options.userId,
                    metadata: options.metadata,
                    tags: options.tags,
                });
            }
            catch (error) {
                this.logger.error(`Error creating Langfuse trace: ${error.message}`);
            }
        }
        return {
            id: traceId,
            name: options.name,
            langfuseTrace
        };
    }
    /**
     * Create a new generation to track an LLM call
     */
    createGeneration(options) {
        const generationId = `gen-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;
        if (this.monitoringEnabled) {
            try {
                // Store generation in local storage
                const generation = {
                    id: generationId,
                    traceId: options.traceId,
                    name: options.name || 'unnamed-generation',
                    model: options.model,
                    modelParameters: options.modelParameters || {},
                    prompt: options.prompt,
                    completion: options.completion || '',
                    usage: options.usage || {
                        promptTokens: 0,
                        completionTokens: 0,
                        totalTokens: 0,
                    },
                    metadata: options.metadata || {},
                    startTime: options.startTime || new Date(),
                    endTime: options.endTime || new Date(),
                    duration: options.endTime && options.startTime
                        ? options.endTime.getTime() - options.startTime.getTime()
                        : 0
                };
                this.localGenerationStore.set(generationId, generation);
                // Add to parent trace if it exists
                if (options.traceId && this.localTraceStore.has(options.traceId)) {
                    const trace = this.localTraceStore.get(options.traceId);
                    trace.children.push({
                        type: 'generation',
                        id: generationId
                    });
                    this.localTraceStore.set(options.traceId, trace);
                }
                // Log metrics
                this.logger.debug(`Created generation: ${generationId} (${options.name}) for model ${options.model}`);
                if (options.usage) {
                    this.logger.debug(`Generation tokens: ${JSON.stringify(options.usage)}`);
                }
                // Cleanup old generations if we have too many
                if (this.localGenerationStore.size > 5000) {
                    this.cleanupOldGenerations();
                }
            }
            catch (error) {
                this.logger.error(`Error creating native generation: ${error.message}`);
            }
        }
        // Also create in Langfuse if enabled
        let langfuseGeneration = null;
        if (this.langfuseEnabled && this.langfuse) {
            try {
                langfuseGeneration = this.langfuse.generation({
                    id: generationId, // Use the same ID for consistency
                    traceId: options.traceId,
                    name: options.name,
                    model: options.model,
                    modelParameters: options.modelParameters,
                    prompt: options.prompt,
                    completion: options.completion,
                    usage: options.usage,
                    metadata: options.metadata,
                    startTime: options.startTime,
                    endTime: options.endTime,
                });
            }
            catch (error) {
                this.logger.error(`Error creating Langfuse generation: ${error.message}`);
            }
        }
        return {
            id: generationId,
            name: options.name,
            langfuseGeneration
        };
    }
    /**
     * Score a generation or the results of an operation
     */
    scoreGeneration(options) {
        const scoreId = `score-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;
        if (this.monitoringEnabled) {
            try {
                // Store score in local storage
                const score = {
                    id: scoreId,
                    traceId: options.traceId,
                    generationId: options.generationId,
                    name: options.name,
                    value: options.value,
                    comment: options.comment || '',
                    createdAt: new Date()
                };
                this.localScoreStore.set(scoreId, score);
                // Add to parent generation if it exists
                if (options.generationId && this.localGenerationStore.has(options.generationId)) {
                    const generation = this.localGenerationStore.get(options.generationId);
                    if (!generation.scores)
                        generation.scores = [];
                    generation.scores.push(scoreId);
                    this.localGenerationStore.set(options.generationId, generation);
                }
                // Add to parent trace if it exists
                if (options.traceId && this.localTraceStore.has(options.traceId)) {
                    const trace = this.localTraceStore.get(options.traceId);
                    trace.children.push({
                        type: 'score',
                        id: scoreId
                    });
                    this.localTraceStore.set(options.traceId, trace);
                }
                this.logger.debug(`Created score: ${scoreId} (${options.name}) with value ${options.value}`);
            }
            catch (error) {
                this.logger.error(`Error creating native score: ${error.message}`);
            }
        }
        // Also create in Langfuse if enabled
        let langfuseScore = null;
        if (this.langfuseEnabled && this.langfuse) {
            try {
                langfuseScore = this.langfuse.score({
                    traceId: options.traceId,
                    generationId: options.generationId,
                    name: options.name,
                    value: options.value,
                    comment: options.comment,
                });
            }
            catch (error) {
                this.logger.error(`Error scoring generation in Langfuse: ${error.message}`);
            }
        }
        return {
            id: scoreId,
            name: options.name,
            langfuseScore
        };
    }
    /**
     * Wrap an OpenAI API call with tracing
     */
    async traceOpenAI(options, apiCall) {
        const startTime = new Date();
        let result;
        let error;
        try {
            result = await apiCall();
            return result;
        }
        catch (e) {
            error = e;
            throw e;
        }
        finally {
            const endTime = new Date();
            if (result) {
                // For chat completions
                if (result.choices && result.usage) {
                    this.createGeneration({
                        traceId: options.traceId,
                        name: options.name || 'openai-chat-completion',
                        model: result.model,
                        prompt: result.request?.messages || [],
                        completion: result.choices[0]?.message?.content || '',
                        usage: {
                            promptTokens: result.usage.prompt_tokens,
                            completionTokens: result.usage.completion_tokens,
                            totalTokens: result.usage.total_tokens,
                        },
                        metadata: {
                            ...options.metadata,
                            finish_reason: result.choices[0]?.finish_reason,
                            response: result,
                        },
                        startTime,
                        endTime,
                    });
                }
            }
            if (error) {
                // Log error
                this.logError({
                    traceId: options.traceId,
                    name: options.name || 'openai-api-error',
                    error,
                    metadata: options.metadata,
                    startTime,
                    endTime
                });
            }
        }
    }
    /**
     * Trace any LLM call from any provider using the provider ID
     */
    async traceLLMCall(options, apiCall) {
        const startTime = new Date();
        let result;
        let error;
        let provider;
        try {
            // Get provider details from registry
            if (options.llmProviderId) {
                provider = await this.llmRegistry.getProviderDetails(options.llmProviderId);
            }
            result = await apiCall();
            return result;
        }
        catch (e) {
            error = e;
            throw e;
        }
        finally {
            const endTime = new Date();
            if (result) {
                // For generic LLM completions
                this.createGeneration({
                    traceId: options.traceId,
                    name: options.name || `${provider?.name || 'llm'}-completion`,
                    model: provider?.modelName || 'unknown-model',
                    prompt: options.prompt,
                    completion: typeof result === 'string' ? result :
                        result.content || result.text ||
                            (result.choices?.[0]?.message?.content) ||
                            JSON.stringify(result),
                    usage: result.usage || {
                        promptTokens: result.usage?.prompt_tokens || 0,
                        completionTokens: result.usage?.completion_tokens || 0,
                        totalTokens: result.usage?.total_tokens || 0,
                    },
                    metadata: {
                        ...options.metadata,
                        provider: provider?.provider || 'unknown',
                        providerDetails: provider,
                        response: result,
                    },
                    startTime,
                    endTime,
                });
            }
            if (error) {
                // Log error
                this.logError({
                    traceId: options.traceId,
                    name: options.name || `${provider?.name || 'llm'}-error`,
                    error,
                    metadata: {
                        ...options.metadata,
                        provider: provider?.provider || 'unknown',
                    },
                    startTime,
                    endTime
                });
            }
        }
    }
    /**
     * Trace a VS Code Copilot LLM call
     */
    async traceVSCodeCopilot(options, apiCall) {
        const startTime = new Date();
        let result;
        let error;
        try {
            result = await apiCall();
            return result;
        }
        catch (e) {
            error = e;
            throw e;
        }
        finally {
            const endTime = new Date();
            if (result) {
                this.createGeneration({
                    traceId: options.traceId,
                    name: options.name || 'vscode-copilot-completion',
                    model: 'github-copilot', // VS Code Copilot doesn't expose the specific model
                    prompt: options.prompt,
                    completion: typeof result === 'string' ? result :
                        result.content ||
                            JSON.stringify(result),
                    metadata: {
                        ...options.metadata,
                        provider: 'vscode-copilot',
                        response: result,
                    },
                    startTime,
                    endTime,
                });
            }
            if (error) {
                // Log error
                this.logError({
                    traceId: options.traceId,
                    name: options.name || 'vscode-copilot-error',
                    error,
                    metadata: {
                        ...options.metadata,
                        provider: 'vscode-copilot',
                    },
                    startTime,
                    endTime
                });
            }
        }
    }
    /**
     * Log an error event
     */
    logError(options) {
        const errorId = `error-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;
        // Log to native storage
        if (this.monitoringEnabled) {
            try {
                const errorEvent = {
                    id: errorId,
                    traceId: options.traceId,
                    name: options.name,
                    error: {
                        message: options.error.message,
                        code: options.error.code,
                        type: options.error.type,
                        stack: options.error.stack,
                    },
                    metadata: options.metadata || {},
                    startTime: options.startTime,
                    endTime: options.endTime,
                    duration: options.endTime.getTime() - options.startTime.getTime(),
                };
                // Add to parent trace if it exists
                if (options.traceId && this.localTraceStore.has(options.traceId)) {
                    const trace = this.localTraceStore.get(options.traceId);
                    trace.children.push({
                        type: 'error',
                        id: errorId
                    });
                    this.localTraceStore.set(options.traceId, trace);
                }
                this.logger.error(`[${options.name}] Error: ${options.error.message}`);
            }
            catch (error) {
                this.logger.error(`Error logging error event: ${error.message}`);
            }
        }
        // Also log to Langfuse if enabled
        if (this.langfuseEnabled && this.langfuse) {
            try {
                const span = this.langfuse.span({
                    traceId: options.traceId,
                    name: options.name,
                    metadata: {
                        ...options.metadata,
                        error: {
                            message: options.error.message,
                            code: options.error.code,
                            type: options.error.type,
                        }
                    },
                    startTime: options.startTime,
                    endTime: options.endTime,
                    statusMessage: options.error.message,
                    level: 'ERROR'
                });
            }
            catch (error) {
                this.logger.error(`Error creating Langfuse error span: ${error.message}`);
            }
        }
    }
    /**
     * Get a trace by ID
     */
    getTrace(traceId) {
        return this.localTraceStore.get(traceId);
    }
    /**
     * Get a generation by ID
     */
    getGeneration(generationId) {
        return this.localGenerationStore.get(generationId);
    }
    /**
     * Get all traces for a user
     */
    getTracesForUser(userId) {
        return Array.from(this.localTraceStore.values())
            .filter(trace => trace.userId === userId);
    }
    /**
     * Get recent traces
     */
    getRecentTraces(limit = 50) {
        return Array.from(this.localTraceStore.values())
            .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
            .slice(0, limit);
    }
    /**
     * Get summary metrics
     */
    getMetrics() {
        const traces = Array.from(this.localTraceStore.values());
        const generations = Array.from(this.localGenerationStore.values());
        const totalTokens = generations.reduce((sum, gen) => {
            return sum + (gen.usage?.totalTokens || 0);
        }, 0);
        const modelUsage = generations.reduce((acc, gen) => {
            const model = gen.model || 'unknown';
            if (!acc[model])
                acc[model] = 0;
            acc[model] += gen.usage?.totalTokens || 0;
            return acc;
        }, {});
        const averageLatency = generations.reduce((sum, gen) => {
            return sum + (gen.duration || 0);
        }, 0) / Math.max(generations.length, 1);
        return {
            traceCount: traces.length,
            generationCount: generations.length,
            totalTokens,
            modelUsage,
            averageLatency
        };
    }
    /**
     * Clean up old traces to prevent memory issues
     */
    cleanupOldTraces() {
        const traces = Array.from(this.localTraceStore.entries())
            .sort(([, a], [, b]) => a.createdAt.getTime() - b.createdAt.getTime());
        // Remove oldest traces to get back to 80% capacity
        const removeCount = Math.floor(traces.length * 0.2);
        for (let i = 0; i < removeCount; i++) {
            if (i < traces.length) {
                this.localTraceStore.delete(traces[i][0]);
            }
        }
        this.logger.log(`Cleaned up ${removeCount} old traces`);
    }
    /**
     * Clean up old generations to prevent memory issues
     */
    cleanupOldGenerations() {
        const generations = Array.from(this.localGenerationStore.entries())
            .sort(([, a], [, b]) => a.startTime.getTime() - b.startTime.getTime());
        // Remove oldest generations to get back to 80% capacity
        const removeCount = Math.floor(generations.length * 0.2);
        for (let i = 0; i < removeCount; i++) {
            if (i < generations.length) {
                this.localGenerationStore.delete(generations[i][0]);
            }
        }
        this.logger.log(`Cleaned up ${removeCount} old generations`);
    }
    /**
     * Check if Langfuse integration is enabled
     */
    isLangfuseEnabled() {
        return this.langfuseEnabled;
    }
    /**
     * Enable or disable Langfuse integration
     */
    setLangfuseEnabled(enabled) {
        this.langfuseEnabled = enabled;
        this.logger.log(`Langfuse integration ${enabled ? 'enabled' : 'disabled'}`);
    }
    /**
     * Enable or disable native monitoring
     */
    setMonitoringEnabled(enabled) {
        this.monitoringEnabled = enabled;
        this.logger.log(`Native monitoring ${enabled ? 'enabled' : 'disabled'}`);
    }
};
exports.FuseMonitoringService = FuseMonitoringService;
exports.FuseMonitoringService = FuseMonitoringService = FuseMonitoringService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_1.ConfigService, typeof (_a = typeof LLMRegistry_1.LLMRegistry !== "undefined" && LLMRegistry_1.LLMRegistry) === "function" ? _a : Object])
], FuseMonitoringService);
//# sourceMappingURL=LangfuseService.js.map