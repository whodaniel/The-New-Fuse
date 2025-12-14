/**
 * LLM Provider Manager
 *
 * Manages LLM provider configuration, API keys, and provider selection.
 * Supports OpenAI, Anthropic, Cohere, Google, and LiteLLM proxy.
 *
 * Based on official LiteLLM documentation:
 * - No API key needed for LiteLLM library itself
 * - API keys required for specific LLM providers (OpenAI, Anthropic, etc.)
 * - LiteLLM Proxy requires its own API key if deployed
 * - Local models (Ollama) require no API keys
 */

import * as vscode from 'vscode';
import { EventEmitter } from 'events';

export interface LLMProviderConfig {
	// Provider identification
	provider: 'openai' | 'anthropic' | 'cohere' | 'google' | 'litellm' | 'ollama' | 'openrouter' | 'custom';
	name: string;
	enabled: boolean;

	// Model configuration
	model: string;
	defaultModel?: string;
	availableModels?: string[];

	// Authentication
	apiKey?: string; // Provider API key (e.g., OpenAI, Anthropic)
	baseURL?: string; // For LiteLLM proxy or custom endpoints

	// LiteLLM proxy specific
	proxyAPIKey?: string; // LiteLLM proxy API key (if proxy deployed)

	// Provider-specific settings
	temperature?: number;
	maxTokens?: number;
	topP?: number;

	// Advanced features
	streaming?: boolean;
	caching?: boolean;
	retries?: number;
	timeout?: number;
}

export interface ProviderStatus {
	provider: string;
	connected: boolean;
	healthy: boolean;
	lastCheck: Date;
	error?: string;
	models?: string[];
}

/**
 * LLM Provider Manager
 *
 * Handles:
 * - Provider registration and configuration
 * - Secure API key storage via VSCode SecretStorage
 * - Provider health checks
 * - Model availability queries
 * - Provider switching
 */
export class LLMProviderManager extends EventEmitter {
	private context: vscode.ExtensionContext;
	private activeProvider: string;
	private providers: Map<string, LLMProviderConfig>;
	private providerStatus: Map<string, ProviderStatus>;

	// Default providers based on LiteLLM documentation
	private static readonly DEFAULT_PROVIDERS: Partial<LLMProviderConfig>[] = [
		{
			provider: 'openai',
			name: 'OpenAI',
			enabled: false,
			model: 'gpt-3.5-turbo',
			availableModels: ['gpt-4', 'gpt-4-turbo', 'gpt-3.5-turbo', 'gpt-4o'],
			baseURL: 'https://api.openai.com/v1',
			streaming: true,
			caching: true,
			retries: 3
		},
		{
			provider: 'anthropic',
			name: 'Anthropic (Claude)',
			enabled: false,
			model: 'claude-3-sonnet-20240229',
			availableModels: [
				'claude-3-opus-20240229',
				'claude-3-sonnet-20240229',
				'claude-3-haiku-20240307',
				'claude-sonnet-4',
				'claude-opus-4'
			],
			baseURL: 'https://api.anthropic.com',
			streaming: true,
			caching: true,
			retries: 3
		},
		{
			provider: 'cohere',
			name: 'Cohere',
			enabled: false,
			model: 'command-r-plus',
			availableModels: ['command-r-plus', 'command-r', 'command', 'command-light'],
			baseURL: 'https://api.cohere.ai/v1',
			streaming: true,
			retries: 3
		},
		{
			provider: 'google',
			name: 'Google (Gemini)',
			enabled: false,
			model: 'gemini-pro',
			availableModels: ['gemini-pro', 'gemini-2.5-pro', 'gemini-2.5-flash', 'gemini-ultra'],
			baseURL: 'https://generativelanguage.googleapis.com/v1',
			streaming: true,
			retries: 3
		},
		{
			provider: 'litellm',
			name: 'LiteLLM Proxy',
			enabled: false,
			model: 'gpt-3.5-turbo',
			baseURL: 'http://localhost:4000',
			streaming: true,
			caching: true,
			retries: 3,
			availableModels: []
		},
		{
			provider: 'ollama',
			name: 'Ollama (Local)',
			enabled: false,
			model: 'llama3',
			baseURL: 'http://localhost:11434',
			availableModels: ['llama3', 'mistral', 'codellama', 'phi'],
			streaming: true,
			retries: 1
		},
		{
			provider: 'openrouter',
			name: 'OpenRouter',
			enabled: false,
			model: 'openai/gpt-3.5-turbo',
			availableModels: [
				'openai/gpt-4',
				'openai/gpt-4-turbo',
				'openai/gpt-3.5-turbo',
				'anthropic/claude-3-opus',
				'anthropic/claude-3-sonnet',
				'anthropic/claude-3-haiku',
				'google/gemini-pro',
				'meta-llama/llama-3-70b-instruct',
				'mistralai/mistral-large'
			],
			baseURL: 'https://openrouter.ai/api/v1',
			streaming: true,
			caching: true,
			retries: 3
		}
	];

	constructor(context: vscode.ExtensionContext) {
		super();
		this.context = context;
		this.providers = new Map();
		this.providerStatus = new Map();
		this.activeProvider = 'openai'; // Default
	}

	/**
	 * Initialize provider manager
	 * Loads saved configuration and API keys
	 */
	async initialize(): Promise<void> {
		// Load saved providers or use defaults
		const savedProviders = this.context.globalState.get<any[]>('llm.providers');

		if (savedProviders && savedProviders.length > 0) {
			// Load from saved state
			for (const providerData of savedProviders) {
				const provider: LLMProviderConfig = {
					...providerData,
					apiKey: undefined // Will be loaded from SecretStorage
				};

				// Load API key from secure storage
				const apiKey = await this.context.secrets.get(`llm.apiKey.${provider.provider}`);
				if (apiKey) {
					provider.apiKey = apiKey;
				}

				// Load proxy API key if LiteLLM
				if (provider.provider === 'litellm') {
					const proxyKey = await this.context.secrets.get(`llm.proxyKey.${provider.provider}`);
					if (proxyKey) {
						provider.proxyAPIKey = proxyKey;
					}
				}

				this.providers.set(provider.provider, provider);
			}
		} else {
			// Initialize with defaults
			for (const defaultProvider of LLMProviderManager.DEFAULT_PROVIDERS) {
				const provider = defaultProvider as LLMProviderConfig;
				this.providers.set(provider.provider, provider);
			}
		}

		// Load active provider
		const savedActive = this.context.globalState.get<string>('llm.activeProvider');
		if (savedActive && this.providers.has(savedActive)) {
			this.activeProvider = savedActive;
		}

		// Initial health check for enabled providers
		await this.checkAllProviders();

		this.emit('initialized');
	}

	/**
	 * Get list of all configured providers
	 */
	getProviders(): LLMProviderConfig[] {
		return Array.from(this.providers.values());
	}

	/**
	 * Get specific provider configuration
	 */
	getProvider(provider: string): LLMProviderConfig | undefined {
		return this.providers.get(provider);
	}

	/**
	 * Get active provider
	 */
	getActiveProvider(): LLMProviderConfig | undefined {
		return this.providers.get(this.activeProvider);
	}

	/**
	 * Set active provider
	 */
	async setActiveProvider(provider: string): Promise<void> {
		if (!this.providers.has(provider)) {
			throw new Error(`Provider '${provider}' not found`);
		}

		const config = this.providers.get(provider);
		if (!config?.enabled) {
			throw new Error(`Provider '${provider}' is not enabled`);
		}

		if (!config?.apiKey && provider !== 'ollama' && provider !== 'litellm') {
			throw new Error(`Provider '${provider}' requires an API key`);
		}

		this.activeProvider = provider;
		await this.context.globalState.update('llm.activeProvider', provider);

		this.emit('providerChanged', provider);
	}

	/**
	 * Update provider configuration
	 */
	async updateProvider(provider: string, config: Partial<LLMProviderConfig>): Promise<void> {
		const existing = this.providers.get(provider);
		if (!existing) {
			throw new Error(`Provider '${provider}' not found`);
		}

		// Update config
		const updated: LLMProviderConfig = {
			...existing,
			...config,
			provider: existing.provider // Don't allow changing provider type
		};

		// Save API key securely if provided
		if (config.apiKey !== undefined) {
			if (config.apiKey) {
				await this.context.secrets.store(`llm.apiKey.${provider}`, config.apiKey);
			} else {
				await this.context.secrets.delete(`llm.apiKey.${provider}`);
			}
			updated.apiKey = config.apiKey;
		}

		// Save proxy API key if LiteLLM
		if (provider === 'litellm' && config.proxyAPIKey !== undefined) {
			if (config.proxyAPIKey) {
				await this.context.secrets.store(`llm.proxyKey.${provider}`, config.proxyAPIKey);
			} else {
				await this.context.secrets.delete(`llm.proxyKey.${provider}`);
			}
			updated.proxyAPIKey = config.proxyAPIKey;
		}

		this.providers.set(provider, updated);
		await this.saveProviders();

		this.emit('providerUpdated', provider, updated);
	}

	/**
	 * Test provider connection and health
	 */
	async testProvider(provider: string): Promise<ProviderStatus> {
		const config = this.providers.get(provider);
		if (!config) {
			throw new Error(`Provider '${provider}' not found`);
		}

		const status: ProviderStatus = {
			provider,
			connected: false,
			healthy: false,
			lastCheck: new Date()
		};

		try {
			if (provider === 'litellm') {
				// Test LiteLLM proxy health endpoint
				const response = await fetch(`${config.baseURL}/health`, {
					headers: config.proxyAPIKey ? {
						'Authorization': `Bearer ${config.proxyAPIKey}`
					} : {}
				});

				if (response.ok) {
					const data = await response.json();
					status.connected = true;
					status.healthy = true;

					// Get available models from proxy
					try {
						const modelsResponse = await fetch(`${config.baseURL}/models`, {
							headers: config.proxyAPIKey ? {
								'Authorization': `Bearer ${config.proxyAPIKey}`
							} : {}
						});
						if (modelsResponse.ok) {
							const modelsData = await modelsResponse.json();
							status.models = modelsData.data?.map((m: any) => m.id) || [];
						}
					} catch (e) {
						// Models endpoint optional
					}
				}
			} else if (provider === 'ollama') {
				// Test Ollama local endpoint
				const response = await fetch(`${config.baseURL}/api/tags`);
				if (response.ok) {
					const data = await response.json();
					status.connected = true;
					status.healthy = true;
					status.models = data.models?.map((m: any) => m.name) || [];
				}
			} else if (provider === 'openrouter') {
				// Test OpenRouter API
				if (!config.apiKey) {
					status.error = 'API key not configured';
				} else {
					try {
						const response = await fetch(`${config.baseURL}/models`, {
							headers: {
								'Authorization': `Bearer ${config.apiKey}`,
								'HTTP-Referer': 'https://github.com/The-New-Fuse/vscode-extension',
								'X-Title': 'The New Fuse VSCode Extension'
							}
						});

						if (response.ok) {
							const data = await response.json();
							status.connected = true;
							status.healthy = true;
							// OpenRouter returns models in data array
							status.models = data.data?.map((m: any) => m.id) || [];
						} else {
							const errorData = await response.json().catch(() => ({}));
							status.error = errorData.error?.message || `HTTP ${response.status}`;
						}
					} catch (e) {
						status.error = e instanceof Error ? e.message : 'Connection failed';
					}
				}
			} else {
				// Test provider API with simple completion
				// For now, just check if API key is set
				if (config.apiKey) {
					status.connected = true;
					status.healthy = true;
				} else {
					status.error = 'API key not configured';
				}
			}
		} catch (error) {
			status.error = error instanceof Error ? error.message : 'Unknown error';
		}

		this.providerStatus.set(provider, status);
		this.emit('providerTested', provider, status);

		return status;
	}

	/**
	 * Check health of all enabled providers
	 */
	async checkAllProviders(): Promise<Map<string, ProviderStatus>> {
		const results = new Map<string, ProviderStatus>();

		for (const [provider, config] of this.providers.entries()) {
			if (config.enabled) {
				try {
					const status = await this.testProvider(provider);
					results.set(provider, status);
				} catch (error) {
					console.error(`Health check failed for ${provider}:`, error);
				}
			}
		}

		return results;
	}

	/**
	 * Get provider status
	 */
	getProviderStatus(provider: string): ProviderStatus | undefined {
		return this.providerStatus.get(provider);
	}

	/**
	 * Get all provider statuses
	 */
	getAllStatuses(): Map<string, ProviderStatus> {
		return new Map(this.providerStatus);
	}

	/**
	 * Save providers to global state (without API keys)
	 */
	private async saveProviders(): Promise<void> {
		const providersToSave = Array.from(this.providers.values()).map(p => ({
			...p,
			apiKey: undefined, // Don't save API keys in state
			proxyAPIKey: undefined
		}));

		await this.context.globalState.update('llm.providers', providersToSave);
	}

	/**
	 * Clear all API keys (for security)
	 */
	async clearAllAPIKeys(): Promise<void> {
		for (const provider of this.providers.keys()) {
			await this.context.secrets.delete(`llm.apiKey.${provider}`);
			await this.context.secrets.delete(`llm.proxyKey.${provider}`);
		}

		// Clear from memory
		for (const [key, config] of this.providers.entries()) {
			config.apiKey = undefined;
			config.proxyAPIKey = undefined;
			this.providers.set(key, config);
		}

		this.emit('keysCleared');
	}

	/**
	 * Reset to default configuration
	 */
	async resetToDefaults(): Promise<void> {
		await this.clearAllAPIKeys();
		this.providers.clear();

		for (const defaultProvider of LLMProviderManager.DEFAULT_PROVIDERS) {
			const provider = defaultProvider as LLMProviderConfig;
			this.providers.set(provider.provider, provider);
		}

		await this.saveProviders();
		this.activeProvider = 'openai';
		await this.context.globalState.update('llm.activeProvider', 'openai');

		this.emit('reset');
	}
}
