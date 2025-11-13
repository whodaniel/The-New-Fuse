"use strict";
/**
 * LLM Provider Configuration Service
 *
 * Centralized configuration management for all LLM providers across The New Fuse framework.
 * Handles provider discovery, configuration validation, and dynamic updates.
 *
 * @module LLMProviderConfigurationService
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
var LLMProviderConfigurationService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.LLMProviderConfigurationService = void 0;
const common_1 = require("@nestjs/common");
const event_emitter_1 = require("@nestjs/event-emitter");
const child_process_1 = require("child_process");
const util_1 = require("util");
const execAsync = (0, util_1.promisify)(child_process_1.exec);
let LLMProviderConfigurationService = LLMProviderConfigurationService_1 = class LLMProviderConfigurationService extends event_emitter_1.EventEmitter2 {
    logger = new common_1.Logger(LLMProviderConfigurationService_1.name);
    configTemplates = new Map();
    discoveredProviders = new Map();
    constructor() {
        super();
    }
    async onModuleInit() {
        await this.initializeConfigTemplates();
        await this.discoverAvailableProviders();
        this.logger.log('LLM Provider Configuration Service initialized');
    }
    /**
     * Discover all available LLM providers
     */
    async discoverAvailableProviders() {
        this.logger.log('Discovering available LLM providers...');
        const discoveries = await Promise.allSettled([
            this.discoverCLIAgents(),
            this.discoverLiteLLMProxy(),
            this.discoverLocalServers(),
            this.discoverAPIProviders()
        ]);
        const allProviders = [];
        discoveries.forEach((result, index) => {
            if (result.status === 'fulfilled') {
                allProviders.push(...result.value);
            }
            else {
                this.logger.warn(`Discovery method ${index} failed: ${result.reason}`);
            }
        });
        // Update discovered providers map
        this.discoveredProviders.clear();
        allProviders.forEach(provider => {
            this.discoveredProviders.set(provider.id, provider);
        });
        this.emit('providers.discovered', { providers: allProviders });
        this.logger.log(`Discovered ${allProviders.length} LLM providers`);
        return allProviders;
    }
    /**
     * Discover CLI agents
     */
    async discoverCLIAgents() {
        const cliAgents = [
            { command: 'claude', id: 'claude-cli', name: 'Claude CLI' },
            { command: 'gemini', id: 'gemini-cli', name: 'Gemini CLI' },
            { command: 'auggie', id: 'auggie-cli', name: 'Auggie CLI' },
            { command: 'codex', id: 'codex-cli', name: 'OpenAI Codex CLI' },
            { command: 'copilot', id: 'copilot-cli', name: 'GitHub Copilot CLI' },
            { command: 'aider', id: 'aider-cli', name: 'Aider CLI' },
            { command: 'cursor', id: 'cursor-cli', name: 'Cursor CLI' }
        ];
        const results = [];
        for (const agent of cliAgents) {
            try {
                // Check if command exists
                await execAsync(`which ${agent.command}`);
                // Try to get version
                let version;
                try {
                    const { stdout } = await execAsync(`${agent.command} --version`);
                    version = stdout.trim();
                }
                catch {
                    // Version command might not be available
                }
                results.push({
                    id: agent.id,
                    name: agent.name,
                    type: 'cli_agent',
                    available: true,
                    version,
                    capabilities: this.getCLIAgentCapabilities(agent.id)
                });
                this.logger.log(`✅ Found CLI agent: ${agent.name}`);
            }
            catch (error) {
                results.push({
                    id: agent.id,
                    name: agent.name,
                    type: 'cli_agent',
                    available: false,
                    error: `Command '${agent.command}' not found`
                });
            }
        }
        return results;
    }
    /**
     * Discover LiteLLM proxy
     */
    async discoverLiteLLMProxy() {
        const baseURL = process.env.LITELLM_BASE_URL || 'http://localhost:4000';
        try {
            const response = await fetch(`${baseURL}/health`, {
                signal: AbortSignal.timeout(5000)
            });
            if (response.ok) {
                // Try to get available models
                let models = [];
                try {
                    const modelsResponse = await fetch(`${baseURL}/models`);
                    if (modelsResponse.ok) {
                        const data = await modelsResponse.json();
                        models = data.data?.map((model) => model.id) || [];
                    }
                }
                catch {
                    // Models endpoint might not be available
                }
                return [{
                        id: 'litellm-proxy',
                        name: 'LiteLLM Proxy',
                        type: 'litellm_proxy',
                        available: true,
                        endpoint: baseURL,
                        models,
                        capabilities: ['chat', 'completion', 'embedding', 'multi_provider']
                    }];
            }
        }
        catch (error) {
            this.logger.warn('LiteLLM proxy not available:', error.message);
        }
        return [{
                id: 'litellm-proxy',
                name: 'LiteLLM Proxy',
                type: 'litellm_proxy',
                available: false,
                endpoint: baseURL,
                error: 'LiteLLM proxy not responding'
            }];
    }
    /**
     * Discover local servers
     */
    async discoverLocalServers() {
        const localServers = [
            {
                id: 'ollama',
                name: 'Ollama',
                endpoint: process.env.OLLAMA_API_BASE || 'http://localhost:11434',
                healthPath: '/api/tags'
            },
            {
                id: 'lm-studio',
                name: 'LM Studio',
                endpoint: 'http://localhost:1234',
                healthPath: '/v1/models'
            },
            {
                id: 'text-generation-webui',
                name: 'Text Generation WebUI',
                endpoint: 'http://localhost:5000',
                healthPath: '/api/v1/models'
            }
        ];
        const results = [];
        for (const server of localServers) {
            try {
                const response = await fetch(`${server.endpoint}${server.healthPath}`, {
                    signal: AbortSignal.timeout(3000)
                });
                if (response.ok) {
                    let models = [];
                    try {
                        const data = await response.json();
                        if (server.id === 'ollama') {
                            models = data.models?.map((m) => m.name) || [];
                        }
                        else {
                            models = data.data?.map((m) => m.id) || [];
                        }
                    }
                    catch {
                        // Models parsing might fail
                    }
                    results.push({
                        id: server.id,
                        name: server.name,
                        type: 'local_server',
                        available: true,
                        endpoint: server.endpoint,
                        models,
                        capabilities: ['chat', 'completion', 'local_deployment', 'privacy']
                    });
                    this.logger.log(`✅ Found local server: ${server.name}`);
                }
                else {
                    throw new Error(`HTTP ${response.status}`);
                }
            }
            catch (error) {
                results.push({
                    id: server.id,
                    name: server.name,
                    type: 'local_server',
                    available: false,
                    endpoint: server.endpoint,
                    error: `Server not responding: ${error.message}`
                });
            }
        }
        return results;
    }
    /**
     * Discover API providers
     */
    async discoverAPIProviders() {
        const apiProviders = [
            {
                id: 'openai-api',
                name: 'OpenAI API',
                envVar: 'OPENAI_API_KEY',
                endpoint: 'https://api.openai.com/v1'
            },
            {
                id: 'anthropic-api',
                name: 'Anthropic API',
                envVar: 'ANTHROPIC_API_KEY',
                endpoint: 'https://api.anthropic.com'
            },
            {
                id: 'google-ai-api',
                name: 'Google AI API',
                envVar: 'GOOGLE_API_KEY',
                endpoint: 'https://generativelanguage.googleapis.com'
            },
            {
                id: 'cohere-api',
                name: 'Cohere API',
                envVar: 'COHERE_API_KEY',
                endpoint: 'https://api.cohere.ai'
            }
        ];
        const results = [];
        for (const provider of apiProviders) {
            const apiKey = process.env[provider.envVar];
            results.push({
                id: provider.id,
                name: provider.name,
                type: 'api_direct',
                available: !!apiKey,
                endpoint: provider.endpoint,
                error: apiKey ? undefined : `${provider.envVar} not configured`,
                capabilities: ['chat', 'completion', 'cloud_api']
            });
        }
        return results;
    }
    /**
     * Get CLI agent capabilities
     */
    getCLIAgentCapabilities(agentId) {
        const capabilityMap = {
            'claude-cli': ['chat', 'completion', 'code_generation', 'code_analysis', 'debugging'],
            'gemini-cli': ['chat', 'completion', 'multimodal', 'web_search', 'code_generation'],
            'auggie-cli': ['code_generation', 'code_analysis', 'debugging', 'refactoring', 'documentation', 'test_generation', 'codebase_context'],
            'codex-cli': ['code_generation', 'code_completion', 'code_explanation', 'debugging'],
            'copilot-cli': ['code_generation', 'code_completion', 'git_integration'],
            'aider-cli': ['code_generation', 'code_editing', 'git_integration', 'file_operations'],
            'cursor-cli': ['code_generation', 'code_editing', 'ide_integration']
        };
        return capabilityMap[agentId] || ['chat', 'completion'];
    }
    /**
     * Generate configuration for a provider
     */
    async generateProviderConfig(providerId) {
        const template = this.configTemplates.get(providerId);
        const discovered = this.discoveredProviders.get(providerId);
        if (!template || !discovered) {
            return null;
        }
        const config = { ...template.defaultConfig };
        // Add discovered information
        if (discovered.endpoint) {
            config.endpoint = discovered.endpoint;
        }
        if (discovered.models && discovered.models.length > 0) {
            config.availableModels = discovered.models;
            config.defaultModel = discovered.models[0];
        }
        if (discovered.version) {
            config.version = discovered.version;
        }
        // Add environment variables if available
        template.requiredEnvVars.forEach(envVar => {
            const value = process.env[envVar];
            if (value) {
                config[envVar.toLowerCase().replace(/_/g, '')] = value;
            }
        });
        return config;
    }
    /**
     * Validate provider configuration
     */
    validateProviderConfig(providerId, config) {
        const template = this.configTemplates.get(providerId);
        if (!template) {
            return { valid: false, errors: ['Unknown provider'] };
        }
        const errors = [];
        // Check required environment variables
        template.requiredEnvVars.forEach(envVar => {
            const value = process.env[envVar];
            if (!value) {
                errors.push(`Missing required environment variable: ${envVar}`);
            }
        });
        // Apply validation rules
        Object.entries(template.validationRules).forEach(([field, rule]) => {
            if (rule.required && !config[field]) {
                errors.push(`Missing required field: ${field}`);
            }
            if (rule.type && config[field] && typeof config[field] !== rule.type) {
                errors.push(`Invalid type for field ${field}: expected ${rule.type}`);
            }
        });
        return { valid: errors.length === 0, errors };
    }
    /**
     * Get discovered providers
     */
    getDiscoveredProviders() {
        return Array.from(this.discoveredProviders.values());
    }
    /**
     * Get available providers only
     */
    getAvailableProviders() {
        return this.getDiscoveredProviders().filter(p => p.available);
    }
    /**
     * Initialize configuration templates
     */
    async initializeConfigTemplates() {
        // CLI Agent templates
        this.configTemplates.set('claude-cli', {
            id: 'claude-cli',
            name: 'Claude CLI',
            type: 'cli_agent',
            defaultConfig: {
                command: 'claude',
                defaultModel: 'claude-sonnet-4',
                temperature: 0.7,
                maxTokens: 8192
            },
            requiredEnvVars: ['ANTHROPIC_API_KEY'],
            optionalEnvVars: [],
            validationRules: {
                command: { required: true, type: 'string' },
                defaultModel: { required: true, type: 'string' },
                temperature: { required: false, type: 'number' },
                maxTokens: { required: false, type: 'number' }
            },
            setupInstructions: 'Install Claude CLI: pnpm install -g @anthropic-ai/claude-cli'
        });
        this.configTemplates.set('auggie-cli', {
            id: 'auggie-cli',
            name: 'Auggie CLI',
            type: 'cli_agent',
            defaultConfig: {
                command: 'auggie',
                defaultModel: 'claude-sonnet-4',
                temperature: 0.7,
                maxTokens: 8192,
                codebaseContext: true
            },
            requiredEnvVars: ['AUGMENT_API_KEY'],
            optionalEnvVars: [],
            validationRules: {
                command: { required: true, type: 'string' },
                defaultModel: { required: true, type: 'string' }
            },
            setupInstructions: 'Install Auggie CLI from Augment Code'
        });
        this.configTemplates.set('codex-cli', {
            id: 'codex-cli',
            name: 'OpenAI Codex CLI',
            type: 'cli_agent',
            defaultConfig: {
                command: 'codex',
                defaultModel: 'code-davinci-002',
                temperature: 0.1,
                maxTokens: 4096
            },
            requiredEnvVars: ['OPENAI_API_KEY'],
            optionalEnvVars: [],
            validationRules: {
                command: { required: true, type: 'string' },
                defaultModel: { required: true, type: 'string' }
            },
            setupInstructions: 'Install OpenAI Codex CLI: uv add openai-codex-cli'
        });
        // Add more templates...
        this.logger.log('Configuration templates initialized');
    }
};
exports.LLMProviderConfigurationService = LLMProviderConfigurationService;
exports.LLMProviderConfigurationService = LLMProviderConfigurationService = LLMProviderConfigurationService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [])
], LLMProviderConfigurationService);
//# sourceMappingURL=LLMProviderConfigurationService.js.map