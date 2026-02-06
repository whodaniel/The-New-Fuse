/**
 * The New Fuse VSCode Extension - Configuration Management
 * Version 9.0.0 - Clean Architecture
 */

import * as vscode from 'vscode';
import {
  CLIAgentConfig,
  ExtensionConfig,
  LLMProviderConfig,
  LLMProviderType,
  MCPServerConfig,
  ToolSearchConfig,
} from './types';

const CONFIG_NAMESPACE = 'theNewFuse';

/**
 * Centralized configuration manager for the extension
 */
export class ConfigManager {
  private static instance: ConfigManager;
  private context: vscode.ExtensionContext;

  private constructor(context: vscode.ExtensionContext) {
    this.context = context;
  }

  static initialize(context: vscode.ExtensionContext): ConfigManager {
    if (!ConfigManager.instance) {
      ConfigManager.instance = new ConfigManager(context);
    }
    return ConfigManager.instance;
  }

  static getInstance(): ConfigManager {
    if (!ConfigManager.instance) {
      throw new Error('ConfigManager not initialized. Call initialize() first.');
    }
    return ConfigManager.instance;
  }

  // ============================================
  // General Configuration
  // ============================================

  getConfig(): ExtensionConfig {
    const config = vscode.workspace.getConfiguration(CONFIG_NAMESPACE);
    return {
      defaultProvider: config.get<LLMProviderType>('defaultProvider', 'openai'),
      defaultModel: config.get<string>('defaultModel', 'gpt-4'),
      autoConnect: config.get<boolean>('autoConnect', true),
      enableTelemetry: config.get<boolean>('enableTelemetry', false),
      theme: config.get<'auto' | 'light' | 'dark'>('theme', 'auto'),
    };
  }

  async updateConfig<K extends keyof ExtensionConfig>(
    key: K,
    value: ExtensionConfig[K]
  ): Promise<void> {
    const config = vscode.workspace.getConfiguration(CONFIG_NAMESPACE);
    await config.update(key, value, vscode.ConfigurationTarget.Global);
  }

  // ============================================
  // LLM Provider Configuration
  // ============================================

  getLLMConfig(provider: LLMProviderType): LLMProviderConfig {
    const config = vscode.workspace.getConfiguration(`${CONFIG_NAMESPACE}.providers.${provider}`);

    // December 2025 - Latest model defaults (API + CLI providers)
    const defaults: Record<LLMProviderType, Partial<LLMProviderConfig>> = {
      // API-based providers
      openai: { model: 'gpt-5.2', baseUrl: 'https://api.openai.com/v1' },
      anthropic: { model: 'claude-opus-4.5-20251124', baseUrl: 'https://api.anthropic.com/v1' },
      gemini: { model: 'gemini-3-pro', baseUrl: 'https://generativelanguage.googleapis.com/v1' },
      sambanova: {
        model: 'llama3-405b-instruct',
        baseUrl: 'https://api.sambanova.ai/v1',
      },
      openrouter: { model: 'anthropic/claude-opus-4.5', baseUrl: 'https://openrouter.ai/api/v1' },
      litellm: { model: 'gpt-5.2', baseUrl: 'http://localhost:4000' },
      deepseek: { model: 'deepseek-v3.2-speciale', baseUrl: 'https://api.deepseek.com/v1' },
      qwen: {
        model: 'qwen3-coder-480b',
        baseUrl: 'https://dashscope.aliyuncs.com/compatible-mode/v1',
      },
      copilot: { model: 'gpt-5.2' },
      'google-antigravity': {
        model: 'claude-opus-4-5-thinking',
        baseUrl: 'https://cloudcode-pa.googleapis.com',
      },
      kilocode: {
        model: 'glm-4.7-free',
        baseUrl: 'http://localhost:18790/v1',
      },
      // CLI-based agents (local tools)
      'claude-cli': { model: 'claude-cli' },
      'gemini-cli': { model: 'gemini-cli' },
      'jules-cli': { model: 'jules-cli' },
      'aider-cli': { model: 'aider-cli' },
      'custom-cli': { model: 'custom-cli' },
    };

    return {
      type: provider,
      apiKey: config.get<string>('apiKey', ''),
      baseUrl: config.get<string>('baseUrl', defaults[provider]?.baseUrl || ''),
      model: config.get<string>('model', defaults[provider]?.model || 'gpt-5.2'),
      maxTokens: config.get<number>('maxTokens', 8192),
      temperature: config.get<number>('temperature', 0.7),
    };
  }

  // ============================================
  // Secure Storage (API Keys)
  // ============================================

  async getApiKey(provider: LLMProviderType): Promise<string | undefined> {
    return this.context.secrets.get(`${CONFIG_NAMESPACE}.${provider}.apiKey`);
  }

  async setApiKey(provider: LLMProviderType, apiKey: string): Promise<void> {
    await this.context.secrets.store(`${CONFIG_NAMESPACE}.${provider}.apiKey`, apiKey);
  }

  async deleteApiKey(provider: LLMProviderType): Promise<void> {
    await this.context.secrets.delete(`${CONFIG_NAMESPACE}.${provider}.apiKey`);
  }

  // ============================================
  // MCP Configuration
  // ============================================

  getMCPServers(): MCPServerConfig[] {
    const config = vscode.workspace.getConfiguration(CONFIG_NAMESPACE);
    return config.get<MCPServerConfig[]>('mcpServers', []);
  }

  // ============================================
  // Tool Discovery Protocol Configuration
  // ============================================

  /**
   * Get Tool Search configuration for Anthropic Tool Discovery Protocol
   * See: https://platform.claude.com/docs/en/agents-and-tools/tool-use/tool-search-tool
   */
  getToolSearchConfig(): ToolSearchConfig {
    const config = vscode.workspace.getConfiguration(CONFIG_NAMESPACE);
    return {
      enabled: config.get<boolean>('toolSearch.enabled', true),
      maxResults: config.get<number>('toolSearch.maxResults', 5),
      defaultMethod: config.get<'regex' | 'bm25'>('toolSearch.defaultMethod', 'bm25'),
      alwaysLoadedTools: config.get<string[]>('toolSearch.alwaysLoadedTools', [
        'read_file',
        'write_file',
        'list_directory',
        'search_files',
      ]),
      deferredCategories: config.get<string[]>('toolSearch.deferredCategories', [
        'google',
        'automation',
        'external',
        'database',
      ]),
    };
  }

  /**
   * Update Tool Search configuration
   */
  async updateToolSearchConfig(updates: Partial<ToolSearchConfig>): Promise<void> {
    const config = vscode.workspace.getConfiguration(CONFIG_NAMESPACE);
    for (const [key, value] of Object.entries(updates)) {
      await config.update(`toolSearch.${key}`, value, vscode.ConfigurationTarget.Global);
    }
  }

  async addMCPServer(server: MCPServerConfig): Promise<void> {
    const servers = this.getMCPServers();
    const existingIndex = servers.findIndex((s) => s.name === server.name);

    if (existingIndex >= 0) {
      servers[existingIndex] = server;
    } else {
      servers.push(server);
    }

    const config = vscode.workspace.getConfiguration(CONFIG_NAMESPACE);
    await config.update('mcpServers', servers, vscode.ConfigurationTarget.Global);
  }

  async removeMCPServer(name: string): Promise<void> {
    const servers = this.getMCPServers().filter((s) => s.name !== name);
    const config = vscode.workspace.getConfiguration(CONFIG_NAMESPACE);
    await config.update('mcpServers', servers, vscode.ConfigurationTarget.Global);
  }

  // ============================================
  // State Persistence
  // ============================================

  getState<T>(key: string, defaultValue: T): T {
    return this.context.globalState.get<T>(key, defaultValue);
  }

  async setState<T>(key: string, value: T): Promise<void> {
    await this.context.globalState.update(key, value);
  }

  getWorkspaceState<T>(key: string, defaultValue: T): T {
    return this.context.workspaceState.get<T>(key, defaultValue);
  }

  async setWorkspaceState<T>(key: string, value: T): Promise<void> {
    await this.context.workspaceState.update(key, value);
  }

  // ============================================
  // CLI Agent Configuration
  // ============================================

  /**
   * Get CLI agent configurations
   */
  getCLIAgents(): CLIAgentConfig[] {
    const config = vscode.workspace.getConfiguration(CONFIG_NAMESPACE);
    return config.get<CLIAgentConfig[]>('cliAgents', this.getDefaultCLIAgents());
  }

  /**
   * Get configuration for a specific CLI agent provider
   */
  getCLIAgentConfig(provider: LLMProviderType): CLIAgentConfig | undefined {
    const agents = this.getCLIAgents();
    const providerName = provider.replace('-cli', '');
    return agents.find((a) => a.name.toLowerCase() === providerName || a.name === provider);
  }

  /**
   * Default CLI agent configurations
   */
  private getDefaultCLIAgents(): CLIAgentConfig[] {
    return [
      {
        name: 'claude',
        command: 'claude',
        args: ['--print'],
        inputFormat: 'stdin',
        outputFormat: 'stdout',
        timeout: 120000,
        enabled: false,
      },
      {
        name: 'gemini',
        command: 'gemini',
        args: [],
        inputFormat: 'arg',
        outputFormat: 'stdout',
        timeout: 120000,
        enabled: true,
      },
      {
        name: 'jules',
        command: 'jules',
        args: ['chat'],
        inputFormat: 'stdin',
        outputFormat: 'stdout',
        timeout: 120000,
        enabled: false,
      },
      {
        name: 'aider',
        command: 'aider',
        args: ['--message'],
        inputFormat: 'arg',
        outputFormat: 'stdout',
        timeout: 180000,
        enabled: false,
      },
    ];
  }

  /**
   * Add or update a CLI agent configuration
   */
  async addCLIAgent(agent: CLIAgentConfig): Promise<void> {
    const agents = this.getCLIAgents();
    const existingIndex = agents.findIndex((a) => a.name === agent.name);

    if (existingIndex >= 0) {
      agents[existingIndex] = agent;
    } else {
      agents.push(agent);
    }

    const config = vscode.workspace.getConfiguration(CONFIG_NAMESPACE);
    await config.update('cliAgents', agents, vscode.ConfigurationTarget.Global);
  }

  /**
   * Remove a CLI agent configuration
   */
  async removeCLIAgent(name: string): Promise<void> {
    const agents = this.getCLIAgents().filter((a) => a.name !== name);
    const config = vscode.workspace.getConfiguration(CONFIG_NAMESPACE);
    await config.update('cliAgents', agents, vscode.ConfigurationTarget.Global);
  }
}

/**
 * Configuration change listener
 */
export function onConfigurationChanged(
  callback: (e: vscode.ConfigurationChangeEvent) => void
): vscode.Disposable {
  return vscode.workspace.onDidChangeConfiguration((e) => {
    if (e.affectsConfiguration(CONFIG_NAMESPACE)) {
      callback(e);
    }
  });
}
