"use strict";
/**
 * Unified LLM Provider Registry
 *
 * Centralized registry for all LLM providers across The New Fuse framework.
 * Supports CLI agents, API providers, custom agents, and LiteLLM proxy providers.
 *
 * @module UnifiedLLMProviderRegistry
 * @since 2025-10-06
 */
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var UnifiedLLMProviderRegistry_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.UnifiedLLMProviderRegistry = exports.LLMProviderStatus = exports.LLMProviderType = void 0;
const common_1 = require("@nestjs/common");
const event_emitter_1 = require("@nestjs/event-emitter");
var LLMProviderType;
(function (LLMProviderType) {
    LLMProviderType["CLI_AGENT"] = "cli_agent";
    LLMProviderType["API_DIRECT"] = "api_direct";
    LLMProviderType["LITELLM_PROXY"] = "litellm_proxy";
    LLMProviderType["LOCAL_SERVER"] = "local_server";
    LLMProviderType["CUSTOM_AGENT"] = "custom_agent";
    LLMProviderType["MCP_INTEGRATED"] = "mcp_integrated";
})(LLMProviderType || (exports.LLMProviderType = LLMProviderType = {}));
var LLMProviderStatus;
(function (LLMProviderStatus) {
    LLMProviderStatus["AVAILABLE"] = "available";
    LLMProviderStatus["UNAVAILABLE"] = "unavailable";
    LLMProviderStatus["CHECKING"] = "checking";
    LLMProviderStatus["ERROR"] = "error";
    LLMProviderStatus["DISABLED"] = "disabled";
})(LLMProviderStatus || (exports.LLMProviderStatus = LLMProviderStatus = {}));
let UnifiedLLMProviderRegistry = UnifiedLLMProviderRegistry_1 = class UnifiedLLMProviderRegistry extends event_emitter_1.EventEmitter2 {
    logger = new common_1.Logger(UnifiedLLMProviderRegistry_1.name);
    providers = new Map();
    healthCheckIntervals = new Map();
    constructor() {
        super();
    }
    async onModuleInit() {
        await this.initializeDefaultProviders();
        await this.startHealthChecks();
        this.logger.log('Unified LLM Provider Registry initialized');
    }
    /**
     * Register a new LLM provider
     */
    async registerProvider(config) {
        this.logger.log(`Registering LLM provider: ${config.name} (${config.type}));
    
    // Validate configuration
    this.validateProviderConfig(config);
    
    // Store provider
    this.providers.set(config.id, config);
    
    // Start health monitoring if enabled
    if (config.metadata.healthCheckInterval) {
      await this.startProviderHealthCheck(config.id);
    }
    
    // Emit registration event
    this.emit('provider.registered', { providerId: config.id, config });
    `, this.logger.log(Provider, $, { config, : .name } ` registered successfully);
  }

  /**
   * Get all available providers
   */
  getProviders(filters?: {
    type?: LLMProviderType;
    status?: LLMProviderStatus;
    capability?: string;
    tags?: string[];
  }): LLMProviderConfig[] {
    let providers = Array.from(this.providers.values());
    
    if (filters) {
      if (filters.type) {
        providers = providers.filter(p => p.type === filters.type);
      }
      if (filters.status) {
        providers = providers.filter(p => p.status === filters.status);
      }
      if (filters.capability) {
        providers = providers.filter(p => 
          p.capabilities.some(cap => cap.name === filters.capability && cap.supported)
        );
      }
      if (filters.tags && filters.tags.length > 0) {
        providers = providers.filter(p => 
          filters.tags!.some(tag => p.metadata.tags.includes(tag))
        );
      }
    }
    
    return providers.sort((a, b) => b.priority - a.priority);
  }

  /**
   * Get provider by ID
   */
  getProvider(id: string): LLMProviderConfig | undefined {
    return this.providers.get(id);
  }

  /**
   * Execute a request using a specific provider
   */
  async executeWithProvider(
    providerId: string,
    prompt: string,
    context?: LLMProviderExecutionContext
  ): Promise<LLMProviderExecutionResult> {
    const provider = this.getProvider(providerId);
    if (!provider) {
      throw new Error(`, Provider, $, { providerId }, not, found));
    }
    if(provider, status) { }
};
exports.UnifiedLLMProviderRegistry = UnifiedLLMProviderRegistry;
exports.UnifiedLLMProviderRegistry = UnifiedLLMProviderRegistry = UnifiedLLMProviderRegistry_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [])
], UnifiedLLMProviderRegistry);
 !== LLMProviderStatus.AVAILABLE;
{
    `
      throw new Error(Provider ${providerId}`;
    is;
    not;
    available(status, $, { provider, : .status } `));
    }

    const startTime = Date.now();
    
    try {
      this.emit('execution.start', { providerId, prompt: prompt.substring(0, 100) });
      
      // Route to appropriate execution method based on provider type
      const result = await this.routeExecution(provider, prompt, context);
      
      const latency = Date.now() - startTime;
      
      const executionResult: LLMProviderExecutionResult = {
        success: true,
        content: result.content,
        usage: result.usage,
        metadata: {
          providerId,
          model: context?.model || provider.defaultModel,
          latency,
          timestamp: new Date()
        }
      };
      
      this.emit('execution.complete', { providerId, result: executionResult });
      return executionResult;
      
    } catch (error) {
      const latency = Date.now() - startTime;
      
      const executionResult: LLMProviderExecutionResult = {
        success: false,
        error: (error as Error).message,
        metadata: {
          providerId,
          model: context?.model || provider.defaultModel,
          latency,
          timestamp: new Date()
        }
      };
      
      this.emit('execution.error', { providerId, error, result: executionResult });
      
      // Try fallback providers if configured
      if (context?.fallbackProviders && context.fallbackProviders.length > 0) {
        for (const fallbackId of context.fallbackProviders) {
          try {
            return await this.executeWithProvider(fallbackId, prompt, {
              ...context,
              fallbackProviders: [] // Prevent infinite recursion
            });
          } catch (fallbackError) {
            this.logger.warn(Fallback provider ${fallbackId} also failed:, fallbackError);
          }
        }
      }
      
      throw error;
    }
  }

  /**
   * Execute with automatic provider selection
   */
  async executeWithBestProvider(
    prompt: string,
    context?: Partial<LLMProviderExecutionContext> & {
      preferredType?: LLMProviderType;
      requiredCapability?: string;
    }
  ): Promise<LLMProviderExecutionResult> {
    const availableProviders = this.getProviders({
      status: LLMProviderStatus.AVAILABLE,
      type: context?.preferredType,
      capability: context?.requiredCapability
    });

    if (availableProviders.length === 0) {
      throw new Error('No available providers found for request');
    }

    // Use highest priority provider
    const selectedProvider = availableProviders[0];
    
    return this.executeWithProvider(selectedProvider.id, prompt, {
      ...context,
      providerId: selectedProvider.id,
      fallbackProviders: availableProviders.slice(1, 3).map(p => p.id) // Top 2 fallbacks
    });
  }

  /**
   * Update provider status
   */
  async updateProviderStatus(providerId: string, status: LLMProviderStatus, error?: string): Promise<void> {
    const provider = this.providers.get(providerId);
    if (!provider) return;

    const oldStatus = provider.status;
    provider.status = status;
    provider.metadata.lastHealthCheck = new Date();

    if (error && status === LLMProviderStatus.ERROR) {`, this.logger.error(Provider, $, { providerId } ` error:`, error));
}
if (oldStatus !== status) {
    this.emit('provider.status.changed', { providerId, oldStatus, newStatus: status, error });
}
async;
initializeDefaultProviders();
Promise < void  > {
    // CLI Agents
    await, this: .registerProvider({
        id: 'claude-cli',
        name: 'Claude CLI',
        displayName: 'Claude Code CLI',
        type: LLMProviderType.CLI_AGENT,
        status: LLMProviderStatus.CHECKING,
        command: 'claude',
        defaultModel: 'claude-sonnet-4',
        availableModels: ['claude-sonnet-4', 'claude-haiku-3', 'claude-opus-3'],
        capabilities: [
            { name: 'code_generation', description: 'Generate code', supported: true },
            { name: 'code_analysis', description: 'Analyze code', supported: true },
            { name: 'debugging', description: 'Debug code', supported: true },
            { name: 'codebase_context', description: 'Understand codebase context', supported: true }
        ],
        priority: 90,
        maxTokens: 8192,
        metadata: {
            vendor: 'Anthropic',
            description: 'Claude CLI agent for agentic coding',
            tags: ['cli', 'coding', 'anthropic', 'agent'],
            healthCheckInterval: 300000 // 5 minutes
        }
    }),
    await, this: .registerProvider({
        id: 'gemini-cli',
        name: 'Gemini CLI',
        displayName: 'Google Gemini CLI',
        type: LLMProviderType.CLI_AGENT,
        status: LLMProviderStatus.CHECKING,
        command: 'gemini',
        defaultModel: 'gemini-2.5-pro',
        availableModels: ['gemini-2.5-pro', 'gemini-2.5-flash', 'gemini-exp-1206'],
        capabilities: [
            { name: 'code_generation', description: 'Generate code', supported: true },
            { name: 'multimodal', description: 'Process images and text', supported: true },
            { name: 'web_search', description: 'Search the web', supported: true }
        ],
        priority: 85,
        maxTokens: 8192,
        metadata: {
            vendor: 'Google',
            description: 'Google Gemini CLI for multimodal AI assistance',
            tags: ['cli', 'multimodal', 'google', 'agent'],
            healthCheckInterval: 300000
        }
    }),
    await, this: .registerProvider({
        id: 'auggie-cli',
        name: 'Auggie CLI',
        displayName: 'Augment Code Auggie CLI',
        type: LLMProviderType.CLI_AGENT,
        status: LLMProviderStatus.CHECKING,
        command: 'auggie',
        defaultModel: 'claude-sonnet-4',
        availableModels: ['claude-sonnet-4', 'claude-haiku-3', 'claude-opus-3'],
        capabilities: [
            { name: 'code_generation', description: 'Generate code', supported: true },
            { name: 'code_analysis', description: 'Analyze code', supported: true },
            { name: 'debugging', description: 'Debug code', supported: true },
            { name: 'refactoring', description: 'Refactor code', supported: true },
            { name: 'documentation', description: 'Generate documentation', supported: true },
            { name: 'test_generation', description: 'Generate tests', supported: true },
            { name: 'codebase_context', description: 'Deep codebase understanding', supported: true }
        ],
        priority: 95,
        maxTokens: 8192,
        metadata: {
            vendor: 'Augment Code',
            description: 'AI-powered coding assistant with deep codebase understanding',
            tags: ['cli', 'coding', 'augment', 'agent', 'codebase'],
            healthCheckInterval: 300000
        }
    }),
    await, this: .registerProvider({
        id: 'codex-cli',
        name: 'Codex CLI',
        displayName: 'OpenAI Codex CLI',
        type: LLMProviderType.CLI_AGENT,
        status: LLMProviderStatus.CHECKING,
        command: 'codex',
        defaultModel: 'code-davinci-002',
        availableModels: ['code-davinci-002', 'code-cushman-001'],
        capabilities: [
            { name: 'code_generation', description: 'Generate code', supported: true },
            { name: 'code_completion', description: 'Complete code', supported: true },
            { name: 'code_explanation', description: 'Explain code', supported: true },
            { name: 'debugging', description: 'Debug code', supported: true }
        ],
        priority: 80,
        maxTokens: 4096,
        metadata: {
            vendor: 'OpenAI',
            description: 'OpenAI Codex CLI for code generation and completion',
            tags: ['cli', 'coding', 'openai', 'agent', 'completion'],
            healthCheckInterval: 300000
        }
    }),
    // Continue with more providers...
    this: .logger.log('Default providers initialized')
};
validateProviderConfig(config, LLMProviderConfig);
void {
    if(, config) { }, : .id || !config.name || !config.type
};
{
    throw new Error('Provider config missing required fields: id, name, type');
}
if (!config.defaultModel) {
    throw new Error('Provider config missing defaultModel');
}
if (!config.capabilities || config.capabilities.length === 0) {
    throw new Error('Provider config must specify capabilities');
}
async;
routeExecution(provider, LLMProviderConfig, prompt, string, context ?  : LLMProviderExecutionContext);
Promise < { content: string, usage: any } > {
    // This would route to the appropriate execution method based on provider type
    // Implementation would depend on the specific provider integrations
    throw: new Error('Execution routing not implemented yet')
};
async;
startProviderHealthCheck(providerId, string);
Promise < void  > {
    const: provider = this.providers.get(providerId),
    if(, provider) { }
} || !provider.metadata.healthCheckInterval;
return;
const interval = setInterval(async () => {
    await this.checkProviderHealth(providerId);
}, provider.metadata.healthCheckInterval);
this.healthCheckIntervals.set(providerId, interval);
async;
startHealthChecks();
Promise < void  > {
    : .providers
};
{
    if (provider.metadata.healthCheckInterval) {
        await this.startProviderHealthCheck(providerId);
    }
}
async;
checkProviderHealth(providerId, string);
Promise < void  > {
    // Implementation would check provider availability
    // For now, just update the last check time
    const: provider = this.providers.get(providerId),
    if(provider) {
        provider.metadata.lastHealthCheck = new Date();
    }
};
//# sourceMappingURL=UnifiedLLMProviderRegistry.js.map