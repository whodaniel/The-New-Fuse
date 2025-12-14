import OpenAI from 'openai';
import Anthropic from '@anthropic-ai/sdk';
import { SecurityOrchestrator } from '../security/SecurityOrchestrator';
import {
	AIProvider,
	AIHealthStatus,
	AIGenerationOptions,
	RateLimiter,
	ConversationExport,
	Message
} from '../types';

export class AIServiceManager {
	private _securityOrchestrator: SecurityOrchestrator;
	private _providers: Record<string, AIProvider> = {};
	private _activeProvider: string | null = null;
	private _webview: unknown = null;
	private _cache: Map<string, string> = new Map();
	private _healthStatus: AIHealthStatus = {};
	private _rateLimiters: Record<string, RateLimiter> = {};
	private _conversationHistory: Message[] = [];
	private _contextWindowSize: number = 4000; // tokens
	private _isInitialized: boolean = false;

	constructor(securityOrchestrator: SecurityOrchestrator) {
		this._securityOrchestrator = securityOrchestrator;
	}

	async initialize(): Promise<void> {
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

	setWebview(webview: unknown): void {
		this._webview = webview;
	}

	async _initializeProviders(): Promise<void> {
		// Initialize OpenAI
		try {
			const openaiKey = await this._getSecureApiKey('openai');
			if (openaiKey) {
				this._providers.openai = {
					name: 'openai',
					client: new OpenAI({ apiKey: openaiKey }),
					status: 'healthy',
					lastCheck: Date.now()
				};
				this._healthStatus.openai = { status: 'healthy', lastCheck: Date.now() };
			}
		} catch (error) {
			console.warn('OpenAI provider initialization failed:', error);
			this._healthStatus.openai = { status: 'unavailable', lastCheck: Date.now(), error: (error as Error).message };
		}

		// Initialize Anthropic
		try {
			const anthropicKey = await this._getSecureApiKey('anthropic');
			if (anthropicKey) {
				this._providers.anthropic = {
					name: 'anthropic',
					client: new Anthropic({ apiKey: anthropicKey }),
					status: 'healthy',
					lastCheck: Date.now()
				};
				this._healthStatus.anthropic = { status: 'healthy', lastCheck: Date.now() };
			}
		} catch (error) {
			console.warn('Anthropic provider initialization failed:', error);
			this._healthStatus.anthropic = { status: 'unavailable', lastCheck: Date.now(), error: (error as Error).message };
		}

		// Note: LiteLLM support can be added when the module is available

		// Set default active provider
		this._setDefaultActiveProvider();
	}

	async _getSecureApiKey(provider: string): Promise<string | null> {
		try {
			return await this._securityOrchestrator.getApiKey(provider);
		} catch (error) {
			console.warn(`Failed to get API key for ${provider}:`, error);
			return null;
		}
	}

	_setDefaultActiveProvider(): void {
		// Priority: OpenAI > Anthropic
		if (this._providers.openai) {
			this._activeProvider = 'openai';
		} else if (this._providers.anthropic) {
			this._activeProvider = 'anthropic';
		} else {
			this._activeProvider = null;
		}
	}

	async _loadConfiguration(): Promise<void> {
		try {
			const config = await this._securityOrchestrator.configManager.getConfiguration('ai');
			this._contextWindowSize = config.contextWindowSize || 4000;
			this._activeProvider = config.activeProvider || this._activeProvider;
		} catch (error) {
			console.warn('Failed to load AI configuration:', error);
		}
	}

	_startHealthMonitoring(): void {
		// Check health every 5 minutes
		setInterval(() => {
			this._checkProviderHealth();
		}, 5 * 60 * 1000);

		// Initial health check
		this._checkProviderHealth();
	}

	async _checkProviderHealth(): Promise<void> {
		for (const [provider, client] of Object.entries(this._providers)) {
			try {
				await this._performHealthCheck(provider, client);
				this._healthStatus[provider] = { status: 'healthy', lastCheck: Date.now() };
			} catch (error) {
				this._healthStatus[provider] = {
					status: 'unhealthy',
					lastCheck: Date.now(),
					error: (error as Error).message
				};
			}
		}

		// Auto-failover if active provider is unhealthy
		if (this._activeProvider && this._healthStatus[this._activeProvider]?.status !== 'healthy') {
			this._performFailover();
		}
	}

	async _performHealthCheck(provider: string, client: AIProvider): Promise<void> {
		// Simple health check - try a minimal request
		switch (provider) {
			case 'openai':
				await (client.client as OpenAI).models.list();
				break;
			case 'anthropic':
				// Anthropic doesn't have a simple health check, so we'll assume healthy
				break;
			case 'litellm':
				// LiteLLM health check
				break;
		}
	}

	_performFailover(): void {
		const healthyProviders = Object.entries(this._healthStatus)
			.filter(([, status]) => status.status === 'healthy')
			.map(([provider, _]) => provider);

		if (healthyProviders.length > 0) {
			const newProvider = healthyProviders[0];
			console.log(`🔄 Auto-failover: Switching from ${this._activeProvider} to ${newProvider}`);
			this._activeProvider = newProvider;

			if (this._webview) {
				(this._webview as any).postMessage({
					type: 'providerSwitched',
					provider: newProvider
				});
			}
		}
	}

	_initializeRateLimiters(): void {
		// Initialize rate limiters for each provider
		this._rateLimiters = {
			openai: { requests: 0, windowStart: Date.now(), limit: 100, window: 60 * 1000 }, // 100 requests per minute
			anthropic: { requests: 0, windowStart: Date.now(), limit: 50, window: 60 * 1000 } // 50 requests per minute
		};
	}

	async _checkRateLimit(provider: string): Promise<boolean> {
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

	async generateResponse(userInput: string, options: AIGenerationOptions = {}): Promise<string> {
		if (!this._activeProvider) {
			throw new Error('No AI provider available. Please configure API keys.');
		}

		// Check rate limit
		await this._checkRateLimit(this._activeProvider);

		// Check cache
		const cacheKey = this._generateCacheKey(userInput, options);
		if (this._cache.has(cacheKey) && !options.skipCache) {
			return this._cache.get(cacheKey)!;
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

	_generateCacheKey(input: string, options: AIGenerationOptions): string {
		return `${this._activeProvider}-${JSON.stringify(input)}-${JSON.stringify(options)}`;
	}

	_prepareMessages(userInput: string, options: AIGenerationOptions): Message[] {
		const messages: Message[] = [];

		// Add system message if provided
		if (options.systemPrompt) {
			messages.push({ role: 'system', content: options.systemPrompt, timestamp: new Date().toISOString() });
		}

		// Add conversation history within context window
		const historyMessages = this._getContextWindowMessages();
		messages.push(...historyMessages);

		// Add current user input
		messages.push({ role: 'user', content: userInput, timestamp: new Date().toISOString() });

		return messages;
	}

	_getContextWindowMessages(): Message[] {
		// Simple implementation - in practice, you'd count tokens
		const messages: Message[] = [];
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

	async _callProvider(provider: string, messages: Message[], options: AIGenerationOptions): Promise<string> {
		const client = this._providers[provider];
		if (!client) {
			throw new Error(`Provider ${provider} not available`);
		}

		switch (provider) {
			case 'openai':
				return await this._callOpenAI(client.client as OpenAI, messages, options);
			case 'anthropic':
				return await this._callAnthropic(client.client as Anthropic, messages, options);
			default:
				throw new Error(`Unknown provider: ${provider}`);
		}
	}

	async _callOpenAI(client: OpenAI, messages: Message[], options: AIGenerationOptions): Promise<string> {
		if (options.stream && this._webview) {
			// Handle streaming
			const stream = await client.chat.completions.create({
				model: options.model || 'gpt-4',
				messages: messages.map(m => ({ role: m.role as 'user' | 'assistant' | 'system', content: m.content })),
				max_tokens: options.maxTokens || 1000,
				temperature: options.temperature || 0.7,
				stream: true
			});

			let fullContent = '';
			for await (const chunk of stream) {
				const content = chunk.choices[0]?.delta?.content || '';
				fullContent += content;
				(this._webview as any).postMessage({
					type: 'streamChunk',
					content: content
				});
			}
			return fullContent;
		} else {
			const response = await client.chat.completions.create({
				model: options.model || 'gpt-4',
				messages: messages.map(m => ({ role: m.role as 'user' | 'assistant' | 'system', content: m.content })),
				max_tokens: options.maxTokens || 1000,
				temperature: options.temperature || 0.7,
				stream: false
			});
			return response.choices[0].message.content || '';
		}
	}

	async _callAnthropic(client: Anthropic, messages: Message[], options: AIGenerationOptions): Promise<string> {
		// Convert messages to Anthropic format
		const systemMessage = messages.find(m => m.role === 'system');
		const chatMessages = messages.filter(m => m.role !== 'system');

		if (options.stream && this._webview) {
			const stream = await client.messages.create({
				model: options.model || 'claude-3-sonnet-20240229',
				max_tokens: options.maxTokens || 1000,
				temperature: options.temperature || 0.7,
				system: systemMessage?.content,
				messages: chatMessages.map(m => ({ role: m.role as 'user' | 'assistant', content: m.content })),
				stream: true
			});

			let fullContent = '';
			for await (const chunk of stream) {
				if (chunk.type === 'content_block_delta' && 'delta' in chunk && 'text' in chunk.delta) {
					const content = chunk.delta.text || '';
					fullContent += content;
					(this._webview as any).postMessage({
						type: 'streamChunk',
						content: content
					});
				}
			}
			return fullContent;
		} else {
			const response = await client.messages.create({
				model: options.model || 'claude-3-sonnet-20240229',
				max_tokens: options.maxTokens || 1000,
				temperature: options.temperature || 0.7,
				system: systemMessage?.content,
				messages: chatMessages.map(m => ({ role: m.role as 'user' | 'assistant', content: m.content })),
				stream: false
			});
			return response.content[0].type === 'text' ? response.content[0].text : '';
		}
	}

	_addToHistory(userInput: string, response: string): void {
		this._conversationHistory.push(
			{ role: 'user', content: userInput, timestamp: new Date().toISOString() },
			{ role: 'assistant', content: response, timestamp: new Date().toISOString() }
		);

		// Limit history size
		if (this._conversationHistory.length > 1000) {
			this._conversationHistory = this._conversationHistory.slice(-1000);
		}
	}

	_attemptFailover(): boolean {
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
	async switchProvider(provider: string): Promise<boolean> {
		if (!this._providers[provider]) {
			throw new Error(`Provider ${provider} not available`);
		}

		if (this._healthStatus[provider]?.status !== 'healthy') {
			throw new Error(`Provider ${provider} is not healthy`);
		}

		this._activeProvider = provider;

		// Save configuration
		await (this._securityOrchestrator.configManager as any).setConfiguration('ai', {
			activeProvider: provider
		});

		if (this._webview) {
			(this._webview as any).postMessage({
				type: 'providerSwitched',
				provider: provider
			});
		}

		return true;
	}

	getActiveProvider(): string | null {
		return this._activeProvider;
	}

	getAvailableProviders(): string[] {
		return Object.keys(this._providers).filter(provider =>
			this._healthStatus[provider]?.status === 'healthy'
		);
	}

	getHealthStatus(): AIHealthStatus {
		return { ...this._healthStatus };
	}

	clearCache(): void {
		this._cache.clear();
	}

	exportConversation(): ConversationExport {
		return {
			history: this._conversationHistory,
			provider: this._activeProvider || '',
			exportedAt: Date.now()
		};
	}

	importConversation(data: ConversationExport): void {
		if (data.history && Array.isArray(data.history)) {
			this._conversationHistory = data.history;
		}
	}

	setContextWindowSize(size: number): void {
		this._contextWindowSize = size;
	}

	getContextWindowSize(): number {
		return this._contextWindowSize;
	}
}