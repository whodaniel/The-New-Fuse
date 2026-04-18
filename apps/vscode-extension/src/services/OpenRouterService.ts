/**
 * The New Fuse VSCode Extension - OpenRouter Service
 * Version 9.0.0
 *
 * Handles OpenRouter API integration including dynamic model discovery
 */

import * as vscode from 'vscode';
import { ConfigManager } from '../core/config';
import { log } from '../utils/logger';

export interface OpenRouterModel {
  id: string;
  name: string;
  description?: string;
  context_length: number;
  pricing: {
    prompt: number;
    completion: number;
  };
  top_provider?: {
    max_context_length?: number;
  };
  architecture?: {
    modality: string;
    tokenizer: string;
  };
}

export interface OpenRouterModelsResponse {
  data: OpenRouterModel[];
}

/**
 * Service for interacting with OpenRouter API
 */
export class OpenRouterService {
  private static instance: OpenRouterService;
  private cachedModels: OpenRouterModel[] = [];
  private lastFetchTime: number = 0;
  private readonly CACHE_DURATION_MS = 5 * 60 * 1000; // 5 minutes cache
  private isFetching: boolean = false;

  private constructor() {}

  static getInstance(): OpenRouterService {
    if (!OpenRouterService.instance) {
      OpenRouterService.instance = new OpenRouterService();
    }
    return OpenRouterService.instance;
  }

  /**
   * Get OpenRouter API key from secure storage
   */
  private async getApiKey(): Promise<string | undefined> {
    try {
      const configManager = ConfigManager.getInstance();
      return await configManager.getApiKey('openrouter');
    } catch {
      return undefined;
    }
  }

  /**
   * Get base URL for OpenRouter API
   */
  private getBaseUrl(): string {
    try {
      const configManager = ConfigManager.getInstance();
      const config = configManager.getLLMConfig('openrouter');
      return config.baseUrl || 'https://openrouter.ai/api/v1';
    } catch {
      return 'https://openrouter.ai/api/v1';
    }
  }

  /**
   * Fetch available models from OpenRouter API
   */
  async fetchModels(forceRefresh: boolean = false): Promise<OpenRouterModel[]> {
    // Return cached if available and not expired
    if (
      !forceRefresh &&
      this.cachedModels.length > 0 &&
      Date.now() - this.lastFetchTime < this.CACHE_DURATION_MS
    ) {
      return this.cachedModels;
    }

    // Prevent concurrent fetches
    if (this.isFetching) {
      return this.cachedModels;
    }

    this.isFetching = true;

    try {
      const apiKey = await this.getApiKey();
      const baseUrl = this.getBaseUrl();

      const response = await fetch(`${baseUrl}/models`, {
        method: 'GET',
        headers: {
          Authorization: apiKey ? `Bearer ${apiKey}` : '',
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch models: ${response.status} ${response.statusText}`);
      }

      const data = (await response.json()) as OpenRouterModelsResponse;

      if (data.data && Array.isArray(data.data)) {
        this.cachedModels = data.data;
        this.lastFetchTime = Date.now();
        log.info(`Fetched ${this.cachedModels.length} models from OpenRouter`);
      }

      return this.cachedModels;
    } catch (error) {
      log.error('Failed to fetch OpenRouter models', error);
      // Return cached models if fetch fails
      return this.cachedModels;
    } finally {
      this.isFetching = false;
    }
  }

  /**
   * Get popular/recommended models (curated list)
   */
  async getPopularModels(): Promise<OpenRouterModel[]> {
    const allModels = await this.fetchModels();

    const popularIds = [
      'anthropic/claude-3.5-sonnet',
      'anthropic/claude-3-opus',
      'anthropic/claude-3-haiku',
      'openai/gpt-4-turbo',
      'openai/gpt-4o',
      'openai/gpt-4o-mini',
      'google/gemini-pro-1.5',
      'google/gemini-flash-1.5',
      'meta-llama/llama-3.1-405b-instruct',
      'meta-llama/llama-3.1-70b-instruct',
      'mistralai/mixtral-8x22b-instruct',
      'deepseek/deepseek-chat',
      'x-ai/grok-beta',
    ];

    return allModels.filter((model) => popularIds.some((id) => model.id.includes(id)));
  }

  /**
   * Search models by name or ID
   */
  async searchModels(query: string): Promise<OpenRouterModel[]> {
    const allModels = await this.fetchModels();
    const lowerQuery = query.toLowerCase();

    return allModels.filter(
      (model) =>
        model.id.toLowerCase().includes(lowerQuery) || model.name.toLowerCase().includes(lowerQuery)
    );
  }

  /**
   * Get free models
   */
  async getFreeModels(): Promise<OpenRouterModel[]> {
    const allModels = await this.fetchModels();
    return allModels.filter(
      (model) =>
        model.id.includes(':free') || (model.pricing.prompt === 0 && model.pricing.completion === 0)
    );
  }

  /**
   * Show model picker UI
   */
  async showModelPicker(): Promise<string | undefined> {
    await vscode.window.withProgress(
      {
        location: vscode.ProgressLocation.Notification,
        title: 'Fetching OpenRouter Models...',
        cancellable: false,
      },
      async () => {
        await this.fetchModels(true);
      }
    );

    if (this.cachedModels.length === 0) {
      vscode.window.showErrorMessage(
        'Failed to fetch models from OpenRouter. Please check your API key.'
      );
      return undefined;
    }

    // Create quick pick items
    const items: vscode.QuickPickItem[] = this.cachedModels.map((model) => ({
      label: model.name || model.id,
      description: model.id,
      detail: `Context: ${model.context_length?.toLocaleString() || 'N/A'} tokens | Prompt: $${model.pricing?.prompt?.toFixed(6) || '0'}/1K | Completion: $${model.pricing?.completion?.toFixed(6) || '0'}/1K`,
    }));

    // Add categories
    const freeModels = await this.getFreeModels();
    const popularModels = await this.getPopularModels();

    const quickPick = vscode.window.createQuickPick();
    quickPick.items = items;
    quickPick.placeholder = 'Search and select an OpenRouter model...';
    quickPick.title = `OpenRouter Models (${this.cachedModels.length} available)`;
    quickPick.matchOnDescription = true;
    quickPick.matchOnDetail = true;

    // Add filter buttons
    quickPick.buttons = [
      {
        iconPath: new vscode.ThemeIcon('star'),
        tooltip: 'Show Popular Models',
      },
      {
        iconPath: new vscode.ThemeIcon('gift'),
        tooltip: 'Show Free Models',
      },
      {
        iconPath: new vscode.ThemeIcon('list-unordered'),
        tooltip: 'Show All Models',
      },
    ];

    quickPick.onDidTriggerButton((button) => {
      if (button.tooltip === 'Show Popular Models') {
        quickPick.items = popularModels.map((model) => ({
          label: `⭐ ${model.name || model.id}`,
          description: model.id,
          detail: `Context: ${model.context_length?.toLocaleString() || 'N/A'} | $${model.pricing?.prompt?.toFixed(6) || '0'}/1K prompt`,
        }));
        quickPick.title = `Popular OpenRouter Models (${popularModels.length})`;
      } else if (button.tooltip === 'Show Free Models') {
        quickPick.items = freeModels.map((model) => ({
          label: `🆓 ${model.name || model.id}`,
          description: model.id,
          detail: `Context: ${model.context_length?.toLocaleString() || 'N/A'} | FREE`,
        }));
        quickPick.title = `Free OpenRouter Models (${freeModels.length})`;
      } else {
        quickPick.items = items;
        quickPick.title = `OpenRouter Models (${this.cachedModels.length} available)`;
      }
    });

    return new Promise((resolve) => {
      quickPick.onDidAccept(() => {
        const selection = quickPick.selectedItems[0];
        quickPick.hide();
        resolve(selection?.description);
      });

      quickPick.onDidHide(() => {
        quickPick.dispose();
        resolve(undefined);
      });

      quickPick.show();
    });
  }

  /**
   * Get model by ID
   */
  async getModel(modelId: string): Promise<OpenRouterModel | undefined> {
    const allModels = await this.fetchModels();
    return allModels.find((model) => model.id === modelId);
  }

  /**
   * Clear cached models
   */
  clearCache(): void {
    this.cachedModels = [];
    this.lastFetchTime = 0;
  }
}

// Export singleton getter
export function getOpenRouterService(): OpenRouterService {
  return OpenRouterService.getInstance();
}
