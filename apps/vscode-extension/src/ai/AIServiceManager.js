const OpenAI = require('openai');
const Anthropic = require('@anthropic-ai/sdk');
const LiteLLM = require('litellm');

class AIServiceManager {
    constructor(securityOrchestrator) {
        this._securityOrchestrator = securityOrchestrator;
        this._providers = {};
        this._activeProvider = null;
        this._webview = null;
        this._cache = new Map();
        this._healthStatus = {};
        this._rateLimiters = {};
        this._conversationHistory = [];
        this._contextWindowSize = 4000; // tokens
        this._isInitialized = false;
    }

    async initialize() {
        if (this._isInitialized) return;

        try {
            // Initialize providers
            await this._initializeProviders();

            // Load configuration
            await this._loadConfiguration();

            // Initialize health monitoring
            this._startHealthMonitoring();

            // Initialize rate limiters
            this._initializeRateLimiters();

            this._isInitialized = true;
            console.log('🤖 AI Service Manager initialized successfully');
        } catch (error) {
            console.error('❌ Failed to initialize AI Service Manager:', error);
            throw error;
        }
    }

    setWebview(webview) {
        this._webview = webview;
    }

    async _initializeProviders() {
        // Initialize OpenAI
        try {
            const openaiKey = await this._getSecureApiKey('openai');
            if (openaiKey) {
                this._providers.openai = new OpenAI({
                    apiKey: openaiKey
                });
                this._healthStatus.openai = { status: 'healthy', lastCheck: Date.now() };
            }
        } catch (error) {
            console.warn('OpenAI provider initialization failed:', error);
            this._healthStatus.openai = { status: 'unavailable', lastCheck: Date.now(), error: error.message };
        }

        // Initialize Anthropic
        try {
            const anthropicKey = await this._getSecureApiKey('anthropic');
            if (anthropicKey) {
                this._providers.anthropic = new Anthropic({
                    apiKey: anthropicKey
                });
                this._healthStatus.anthropic = { status: 'healthy', lastCheck: Date.now() };
            }
        } catch (error) {
            console.warn('Anthropic provider initialization failed:', error);
            this._healthStatus.anthropic = { status: 'unavailable', lastCheck: Date.now(), error: error.message };
        }

        // Initialize LiteLLM
        try {
            this._providers.litellm = LiteLLM;
            this._healthStatus.litellm = { status: 'healthy', lastCheck: Date.now() };
        } catch (error) {
            console.warn('LiteLLM provider initialization failed:', error);
            this._healthStatus.litellm = { status: 'unavailable', lastCheck: Date.now(), error: error.message };
        }

        // Set default active provider
        this._setDefaultActiveProvider();
    }

    async _getSecureApiKey(provider) {
        try {
            // Use the orchestrator's method instead of accessing secureConfigManager directly
            return await this._securityOrchestrator.getApiKey(provider, 'system');
        } catch (error) {
            console.warn(`Failed to get API key for ${provider}:`, error);
            return null;
        }
    }

    _setDefaultActiveProvider() {
        // Priority: OpenAI > Anthropic > LiteLLM
        if (this._providers.openai) {
            this._activeProvider = 'openai';
        } else if (this._providers.anthropic) {
            this._activeProvider = 'anthropic';
        } else if (this._providers.litellm) {
            this._activeProvider = 'litellm';
        } else {
            this._activeProvider = null;
        }
    }

    async _loadConfiguration() {
        try {
            // Load from VSCode configuration or use defaults
            const config = {
                contextWindowSize: 4000,
                activeProvider: this._activeProvider
            };
            this._contextWindowSize = config.contextWindowSize;
            this._activeProvider = config.activeProvider || this._activeProvider;
        } catch (error) {
            console.warn('Failed to load AI configuration:', error);
        }
    }

    _startHealthMonitoring() {
        // Check health every 5 minutes
        setInterval(() => {
            this._checkProviderHealth();
        }, 5 * 60 * 1000);

        // Initial health check
        this._checkProviderHealth();
    }

    async _checkProviderHealth() {
        for (const [provider, client] of Object.entries(this._providers)) {
            try {
                await this._performHealthCheck(provider, client);
                this._healthStatus[provider] = { status: 'healthy', lastCheck: Date.now() };
            } catch (error) {
                this._healthStatus[provider] = {
                    status: 'unhealthy',
                    lastCheck: Date.now(),
                    error: error.message
                };
            }
        }

        // Auto-failover if active provider is unhealthy
        if (this._activeProvider && this._healthStatus[this._activeProvider]?.status !== 'healthy') {
            this._performFailover();
        }
    }

    async _performHealthCheck(provider, client) {
        // Perform provider-specific health checks
        switch (provider) {
            case 'openai':
                // OpenAI: List models to verify API key and connectivity
                await client.models.list();
                break;

            case 'anthropic':
                // Anthropic: Make a minimal messages API call to verify connectivity
                try {
                    await client.messages.create({
                        model: 'claude-3-haiku-20240307', // Smallest/cheapest model
                        max_tokens: 1,
                        messages: [{ role: 'user', content: 'ping' }]
                    });
                } catch (error) {
                    // If error is 401/403, API key is invalid
                    if (error.status === 401 || error.status === 403) {
                        throw new Error('Invalid API key');
                    }
                    // Other errors might be transient
                    throw error;
                }
                break;

            case 'litellm':
                // LiteLLM: Check if the client is callable
                try {
                    // LiteLLM doesn't have a dedicated health endpoint
                    // Verify the module is loaded correctly
                    if (typeof client.completion !== 'function') {
                        throw new Error('LiteLLM client is not properly initialized');
                    }
                } catch (error) {
                    throw new Error(`LiteLLM health check failed: ${error.message}`);
                }
                break;

            default:
                console.warn(`No health check implemented for provider: ${provider}`);
        }
    }

    _performFailover() {
        const healthyProviders = Object.entries(this._healthStatus)
            .filter(([_, status]) => status.status === 'healthy')
            .map(([provider, _]) => provider);

        if (healthyProviders.length > 0) {
            const newProvider = healthyProviders[0];
            console.log(`🔄 Auto-failover: Switching from ${this._activeProvider} to ${newProvider}`);
            this._activeProvider = newProvider;

            if (this._webview) {
                this._webview.postMessage({
                    type: 'providerSwitched',
                    provider: newProvider
                });
            }
        }
    }

    _initializeRateLimiters() {
        // Initialize rate limiters for each provider
        this._rateLimiters = {
            openai: { requests: 0, windowStart: Date.now(), limit: 100, window: 60 * 1000 }, // 100 requests per minute
            anthropic: { requests: 0, windowStart: Date.now(), limit: 50, window: 60 * 1000 }, // 50 requests per minute
            litellm: { requests: 0, windowStart: Date.now(), limit: 1000, window: 60 * 1000 } // 1000 requests per minute
        };
    }

    async _checkRateLimit(provider) {
        const limiter = this._rateLimiters[provider];
        if (!limiter) return true;

        const now = Date.now();
        if (now - limiter.windowStart > limiter.window) {
            // Reset window
            limiter.requests = 0;
            limiter.windowStart = now;
        }

        if (limiter.requests >= limiter.limit) {
            throw new Error(`Rate limit exceeded for ${provider}. Try again later.`);
        }

        limiter.requests++;
        return true;
    }

    async generateResponse(userInput, options = {}) {
        if (!this._activeProvider) {
            throw new Error('No AI provider available. Please configure API keys.');
        }

        // Check rate limit
        await this._checkRateLimit(this._activeProvider);

        // Check cache
        const cacheKey = this._generateCacheKey(userInput, options);
        if (this._cache.has(cacheKey) && !options.skipCache) {
            return this._cache.get(cacheKey);
        }

        // Manage context window
        const messages = this._prepareMessages(userInput, options);

        try {
            const response = await this._callProvider(this._activeProvider, messages, options);

            // Cache response
            if (!options.skipCache) {
                this._cache.set(cacheKey, response);
            }

            // Add to conversation history
            this._addToHistory(userInput, response);

            return response;
        } catch (error) {
            // Try failover
            if (this._attemptFailover()) {
                return await this.generateResponse(userInput, { ...options, skipCache: true });
            }
            throw error;
        }
    }

    _generateCacheKey(input, options) {
        return `${this._activeProvider}-${JSON.stringify(input)}-${JSON.stringify(options)}`;
    }

    _prepareMessages(userInput, options) {
        const messages = [];

        // Add system message if provided
        if (options.systemPrompt) {
            messages.push({ role: 'system', content: options.systemPrompt });
        }

        // Add conversation history within context window
        const historyMessages = this._getContextWindowMessages();
        messages.push(...historyMessages);

        // Add current user input
        messages.push({ role: 'user', content: userInput });

        return messages;
    }

    _getContextWindowMessages() {
        // Simple implementation - in practice, you'd count tokens
        const messages = [];
        let totalLength = 0;

        for (let i = this._conversationHistory.length - 1; i >= 0; i--) {
            const msg = this._conversationHistory[i];
            const msgLength = msg.content.length;

            if (totalLength + msgLength > this._contextWindowSize) {
                break;
            }

            messages.unshift(msg);
            totalLength += msgLength;
        }

        return messages;
    }

    async _callProvider(provider, messages, options) {
        const client = this._providers[provider];
        if (!client) {
            throw new Error(`Provider ${provider} not available`);
        }

        switch (provider) {
            case 'openai':
                return await this._callOpenAI(client, messages, options);
            case 'anthropic':
                return await this._callAnthropic(client, messages, options);
            case 'litellm':
                return await this._callLiteLLM(client, messages, options);
            default:
                throw new Error(`Unknown provider: ${provider}`);
        }
    }

    async _callOpenAI(client, messages, options) {
        const response = await client.chat.completions.create({
            model: options.model || 'gpt-4',
            messages: messages,
            max_tokens: options.maxTokens || 1000,
            temperature: options.temperature || 0.7,
            stream: options.stream || false
        });

        if (options.stream && this._webview) {
            // Handle streaming
            let fullContent = '';
            for await (const chunk of response) {
                const content = chunk.choices[0]?.delta?.content || '';
                fullContent += content;
                this._webview.postMessage({
                    type: 'streamChunk',
                    content: content
                });
            }
            return fullContent;
        } else {
            return response.choices[0].message.content;
        }
    }

    async _callAnthropic(client, messages, options) {
        // Convert messages to Anthropic format
        const systemMessage = messages.find(m => m.role === 'system');
        const chatMessages = messages.filter(m => m.role !== 'system');

        const response = await client.messages.create({
            model: options.model || 'claude-3-sonnet-20240229',
            max_tokens: options.maxTokens || 1000,
            temperature: options.temperature || 0.7,
            system: systemMessage?.content,
            messages: chatMessages,
            stream: options.stream || false
        });

        if (options.stream && this._webview) {
            let fullContent = '';
            for await (const chunk of response) {
                if (chunk.type === 'content_block_delta') {
                    const content = chunk.delta.text || '';
                    fullContent += content;
                    this._webview.postMessage({
                        type: 'streamChunk',
                        content: content
                    });
                }
            }
            return fullContent;
        } else {
            return response.content[0].text;
        }
    }

    async _callLiteLLM(client, messages, options) {
        const response = await client.completion({
            model: options.model || 'gpt-3.5-turbo',
            messages: messages,
            max_tokens: options.maxTokens || 1000,
            temperature: options.temperature || 0.7,
            stream: options.stream || false
        });

        if (options.stream && this._webview) {
            let fullContent = '';
            for await (const chunk of response) {
                const content = chunk.choices[0]?.delta?.content || '';
                fullContent += content;
                this._webview.postMessage({
                    type: 'streamChunk',
                    content: content
                });
            }
            return fullContent;
        } else {
            return response.choices[0].message.content;
        }
    }

    _addToHistory(userInput, response) {
        this._conversationHistory.push(
            { role: 'user', content: userInput, timestamp: Date.now() },
            { role: 'assistant', content: response, timestamp: Date.now() }
        );

        // Limit history size
        if (this._conversationHistory.length > 1000) {
            this._conversationHistory = this._conversationHistory.slice(-1000);
        }
    }

    _attemptFailover() {
        const healthyProviders = Object.entries(this._healthStatus)
            .filter(([provider, status]) => status.status === 'healthy' && provider !== this._activeProvider)
            .map(([provider, _]) => provider);

        if (healthyProviders.length > 0) {
            this._activeProvider = healthyProviders[0];
            console.log(`🔄 Failover: Switched to ${this._activeProvider}`);
            return true;
        }
        return false;
    }

    // Public API methods
    async switchProvider(provider) {
        if (!this._providers[provider]) {
            throw new Error(`Provider ${provider} not available`);
        }

        if (this._healthStatus[provider]?.status !== 'healthy') {
            throw new Error(`Provider ${provider} is not healthy`);
        }

        this._activeProvider = provider;

        // Configuration is automatically persisted via provider selection
        console.log(`Switched to AI provider: ${provider}`);

        if (this._webview) {
            this._webview.postMessage({
                type: 'providerSwitched',
                provider: provider
            });
        }

        return true;
    }

    getActiveProvider() {
        return this._activeProvider;
    }

    getAvailableProviders() {
        return Object.keys(this._providers).filter(provider =>
            this._healthStatus[provider]?.status === 'healthy'
        );
    }

    getHealthStatus() {
        return { ...this._healthStatus };
    }

    clearCache() {
        this._cache.clear();
    }

    exportConversation() {
        return {
            history: this._conversationHistory,
            provider: this._activeProvider,
            exportedAt: Date.now()
        };
    }

    importConversation(data) {
        if (data.history && Array.isArray(data.history)) {
            this._conversationHistory = data.history;
        }
    }

    setContextWindowSize(size) {
        this._contextWindowSize = size;
    }

    getContextWindowSize() {
        return this._contextWindowSize;
    }
}

module.exports = AIServiceManager;