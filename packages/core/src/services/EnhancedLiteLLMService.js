"use strict";
/**
 * Enhanced LiteLLM Service
 *
 * Comprehensive LiteLLM integration supporting 100+ LLM providers through LiteLLM proxy.
 * Provides unified access to all major LLM providers with advanced features.
 *
 * @module EnhancedLiteLLMService
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
var EnhancedLiteLLMService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.EnhancedLiteLLMService = void 0;
const common_1 = require("@nestjs/common");
const event_emitter_1 = require("@nestjs/event-emitter");
let EnhancedLiteLLMService = EnhancedLiteLLMService_1 = class EnhancedLiteLLMService {
    eventEmitter;
    logger = new common_1.Logger(EnhancedLiteLLMService_1.name);
    config;
    availableProviders = new Map();
    constructor(eventEmitter) {
        this.eventEmitter = eventEmitter;
        this.config = this.loadConfiguration();
        this.initializeProviderDefinitions();
    }
    /**
     * Get all supported LiteLLM providers
     */
    getSupportedProviders() {
        return Array.from(this.availableProviders.values());
    }
    /**
     * Get providers by category
     */
    getProvidersByCategory(category) {
        return this.getSupportedProviders().filter(p => p.category === category);
    }
    /**
     * Get major/popular providers
     */
    getMajorProviders() {
        return this.getProvidersByCategory('major');
    }
    /**
     * Get all available models from LiteLLM proxy
     */
    async getAvailableModels() {
        try {
            const response = await fetch(`${this.config.baseURL}/models, {
        headers: this.getHeaders()
      });
      
      if (!response.ok) {`);
            throw new Error(`Failed to fetch models: ${response.statusText}`);
        }
        finally {
        }
        const data = await response.json();
        return data.data?.map((model) => model.id) || [];
    }
    catch(error) {
        this.logger.error('Failed to fetch available models:', error);
        return [];
    }
};
exports.EnhancedLiteLLMService = EnhancedLiteLLMService;
exports.EnhancedLiteLLMService = EnhancedLiteLLMService = EnhancedLiteLLMService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [event_emitter_1.EventEmitter2])
], EnhancedLiteLLMService);
/**
 * Test connection to LiteLLM proxy
 */
async;
testConnection();
Promise < { success: boolean, error: string, models: string[] } > {
    try: {
        const: models = await this.getAvailableModels(),
        return: { success: true, models }
    }, catch(error) {
        return {
            success: false,
            error: error.message
        };
    }
};
/**
 * Generate completion using LiteLLM
 */
async;
generateCompletion(messages, (Array), options ?  : {
    model: string,
    temperature: number,
    maxTokens: number,
    stream: boolean
});
Promise < string > {
    try: {
        const: response = await fetch($, { this: .config.baseURL } / chat / completions, {
            method: 'POST',
            headers: {
                ...this.getHeaders(),
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                model: options?.model || 'gpt-3.5-turbo',
                messages,
                temperature: options?.temperature || 0.7,
                max_tokens: options?.maxTokens || 4096,
                stream: options?.stream || false
            })
        }),
        if(, response) { }, : .ok
    }
};
{
    `
        throw new Error(LiteLLM request failed: ${response.statusText}`;
    ;
}
const data = await response.json();
return data.choices[0]?.message?.content || '';
try { }
catch (error) {
    this.logger.error('LiteLLM completion failed:', error);
    throw error;
}
initializeProviderDefinitions();
void {
    // Major Cloud Providers
    this: .addProvider({
        id: 'openai',
        name: 'OpenAI',
        vendor: 'OpenAI',
        category: 'major',
        models: ['gpt-4', 'gpt-4-turbo', 'gpt-3.5-turbo', 'gpt-4o', 'gpt-4o-mini'],
        requiresApiKey: true,
        supportedFeatures: ['chat', 'completion', 'embedding', 'vision', 'function_calling'],
        costTier: 'medium',
        documentation: 'https://platform.openai.com/docs'
    }),
    this: .addProvider({
        id: 'anthropic',
        name: 'Anthropic Claude',
        vendor: 'Anthropic',
        category: 'major',
        models: ['claude-3-opus-20240229', 'claude-3-sonnet-20240229', 'claude-3-haiku-20240307', 'claude-sonnet-4'],
        requiresApiKey: true,
        supportedFeatures: ['chat', 'completion', 'vision', 'long_context'],
        costTier: 'medium',
        documentation: 'https://docs.anthropic.com'
    }),
    this: .addProvider({
        id: 'google',
        name: 'Google AI',
        vendor: 'Google',
        category: 'major',
        models: ['gemini-pro', 'gemini-pro-vision', 'gemini-2.5-pro', 'gemini-2.5-flash'],
        requiresApiKey: true,
        supportedFeatures: ['chat', 'completion', 'vision', 'multimodal'],
        costTier: 'low',
        documentation: 'https://ai.google.dev'
    }),
    // Enterprise Providers
    this: .addProvider({
        id: 'azure',
        name: 'Azure OpenAI',
        vendor: 'Microsoft',
        category: 'enterprise',
        models: ['gpt-4', 'gpt-35-turbo', 'gpt-4-vision'],
        requiresApiKey: true,
        supportedFeatures: ['chat', 'completion', 'embedding', 'enterprise_security'],
        costTier: 'enterprise',
        documentation: 'https://docs.microsoft.com/azure/cognitive-services/openai'
    }),
    this: .addProvider({
        id: 'aws_bedrock',
        name: 'AWS Bedrock',
        vendor: 'Amazon',
        category: 'enterprise',
        models: ['anthropic.claude-v2', 'anthropic.claude-instant-v1', 'amazon.titan-text-express-v1'],
        requiresApiKey: true,
        supportedFeatures: ['chat', 'completion', 'enterprise_security', 'compliance'],
        costTier: 'enterprise',
        documentation: 'https://docs.aws.amazon.com/bedrock'
    }),
    // Specialized Providers
    this: .addProvider({
        id: 'cohere',
        name: 'Cohere',
        vendor: 'Cohere',
        category: 'specialized',
        models: ['command', 'command-light', 'command-nightly'],
        requiresApiKey: true,
        supportedFeatures: ['chat', 'completion', 'embedding', 'classification'],
        costTier: 'medium',
        documentation: 'https://docs.cohere.ai'
    }),
    this: .addProvider({
        id: 'mistral',
        name: 'Mistral AI',
        vendor: 'Mistral AI',
        category: 'specialized',
        models: ['mistral-tiny', 'mistral-small', 'mistral-medium', 'mistral-large'],
        requiresApiKey: true,
        supportedFeatures: ['chat', 'completion', 'function_calling'],
        costTier: 'medium',
        documentation: 'https://docs.mistral.ai'
    }),
    this: .addProvider({
        id: 'together_ai',
        name: 'Together AI',
        vendor: 'Together AI',
        category: 'specialized',
        models: ['togethercomputer/llama-2-70b-chat', 'mistralai/Mixtral-8x7B-Instruct-v0.1'],
        requiresApiKey: true,
        supportedFeatures: ['chat', 'completion', 'open_source_models'],
        costTier: 'low',
        documentation: 'https://docs.together.ai'
    }),
    // Local/Open Source Providers
    this: .addProvider({
        id: 'ollama',
        name: 'Ollama',
        vendor: 'Ollama',
        category: 'local',
        models: ['llama3', 'mistral', 'codellama', 'phi3', 'gemma'],
        requiresApiKey: false,
        supportedFeatures: ['chat', 'completion', 'local_deployment', 'privacy'],
        costTier: 'free',
        documentation: 'https://ollama.ai/docs'
    }),
    this: .addProvider({
        id: 'lm_studio',
        name: 'LM Studio',
        vendor: 'LM Studio',
        category: 'local',
        models: ['local-model'],
        requiresApiKey: false,
        supportedFeatures: ['chat', 'completion', 'local_deployment', 'custom_models'],
        costTier: 'free',
        documentation: 'https://lmstudio.ai'
    }),
    // Additional providers (Hugging Face, Replicate, etc.)
    this: .addProvider({
        id: 'huggingface',
        name: 'Hugging Face',
        vendor: 'Hugging Face',
        category: 'specialized',
        models: ['microsoft/DialoGPT-medium', 'facebook/blenderbot-400M-distill'],
        requiresApiKey: true,
        supportedFeatures: ['chat', 'completion', 'open_source_models', 'custom_models'],
        costTier: 'low',
        documentation: 'https://huggingface.co/docs'
    }),
    this: .addProvider({
        id: 'replicate',
        name: 'Replicate',
        vendor: 'Replicate',
        category: 'specialized',
        models: ['meta/llama-2-70b-chat', 'mistralai/mixtral-8x7b-instruct-v0.1'],
        requiresApiKey: true,
        supportedFeatures: ['chat', 'completion', 'image_generation', 'custom_models'],
        costTier: 'medium',
        documentation: 'https://replicate.com/docs'
    }),
    this: .logger.log(Initialized, $, { this: .availableProviders.size }, LiteLLM, provider, definitions)
};
addProvider(definition, LiteLLMProviderDefinition);
void {
    this: .availableProviders.set(definition.id, definition)
};
loadConfiguration();
LiteLLMConfig;
{
    return {
        baseURL: process.env.LITELLM_BASE_URL || 'http://localhost:4000',
        apiKey: process.env.LITELLM_API_KEY,
        masterKey: process.env.LITELLM_MASTER_KEY,
        timeout: parseInt(process.env.LITELLM_TIMEOUT || '30000', 10),
        maxRetries: parseInt(process.env.LITELLM_MAX_RETRIES || '3', 10),
        enableFallback: process.env.LITELLM_ENABLE_FALLBACK === 'true' || true,
        fallbackModels: (process.env.LITELLM_FALLBACK_MODELS || '').split(',').filter(Boolean),
        enableCaching: process.env.LITELLM_ENABLE_CACHING === 'true' || true,
        cacheType: process.env.LITELLM_CACHE_TYPE || 'memory',
        enableBudgetTracking: process.env.LITELLM_ENABLE_BUDGET === 'true' || false,
        budgetLimit: process.env.LITELLM_BUDGET_LIMIT ? parseInt(process.env.LITELLM_BUDGET_LIMIT, 10) : undefined,
        enableLogging: process.env.LITELLM_ENABLE_LOGGING === 'true' || true,
        logLevel: process.env.LITELLM_LOG_LEVEL || 'info'
    };
}
getHeaders();
Record < string, string > {
    const: headers
};
{ }
;
`
    `;
if (this.config.apiKey) {
    headers['Authorization'] = Bearer;
    $;
    {
        this.config.apiKey;
    }
    ``;
}
if (this.config.masterKey) {
    headers['X-LiteLLM-Master-Key'] = this.config.masterKey;
}
return headers;
/**
 * Get configuration for a specific provider
 */
getProviderConfig(providerId, string);
LiteLLMProviderDefinition | undefined;
{
    return this.availableProviders.get(providerId);
}
/**
 * Update service configuration
 */
updateConfig(newConfig, (Partial));
void {
    this: .config = { ...this.config, ...newConfig },
    this: .logger.log('LiteLLM configuration updated')
};
/**
 * Get current configuration
 */
getConfig();
LiteLLMConfig;
{
    return { ...this.config };
}
//# sourceMappingURL=EnhancedLiteLLMService.js.map