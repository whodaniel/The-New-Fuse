/**
 * The New Fuse VSCode Extension - Configuration Management
 * Version 9.2.0 - Full TNF Ecosystem Integration
 */

import * as fs from 'fs';
import * as path from 'path';
import * as vscode from 'vscode';
import {
  CLIAgentConfig,
  ExtensionConfig,
  LLMProviderConfig,
  LLMProviderType,
  MCPServerConfig,
} from './types';

const CONFIG_NAMESPACE = 'theNewFuse';
const EXTENSION_VERSION = '9.2.0';

export interface TnfProjectConfig {
  $schema?: string;
  model?: string;
  provider?: string;
  apiBaseUrl?: string;
  permission?: {
    bash: Record<string, 'allow' | 'deny'>;
    read: Record<string, 'allow' | 'deny'>;
    external_directory: Record<string, 'allow' | 'deny'>;
  };
  mcp?: Record<string, {
    type?: 'local' | 'remote' | 'sse' | 'ws';
    command: string[] | string;
    environment?: Record<string, string>;
    env?: Record<string, string>;
    enabled?: boolean;
    args?: string[];
    cwd?: string;
  }>;
  custom?: Record<string, unknown>;
}

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
    const projectConfig = this.getTnfProjectConfig();
    return {
      defaultProvider: projectConfig.provider || config.get<LLMProviderType>('defaultProvider', 'openai'),
      defaultModel: projectConfig.model || config.get<string>('defaultModel', 'gpt-5.2'),
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
      openrouter: { model: 'anthropic/claude-opus-4.5', baseUrl: 'https://openrouter.ai/api/v1' },
      litellm: { model: 'gpt-5.2', baseUrl: 'http://localhost:4000' },
      deepseek: { model: 'deepseek-v3.2-speciale', baseUrl: 'https://api.deepseek.com/v1' },
      qwen: {
        model: 'qwen3-coder-480b',
        baseUrl: 'https://dashscope.aliyuncs.com/compatible-mode/v1',
      },
      copilot: { model: 'gpt-5.2' },
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

  // ============================================
  // tnf.jsonc Project Configuration
  // ============================================

  private stripJsoncComments(content: string): string {
    let result = '';
    let inString = false;
    let escape = false;
    let i = 0;
    while (i < content.length) {
      const ch = content[i];
      if (escape) {
        result += ch;
        escape = false;
        i++;
        continue;
      }
      if (ch === '\\' && inString) {
        result += ch;
        escape = true;
        i++;
        continue;
      }
      if (ch === '"') {
        inString = !inString;
        result += ch;
        i++;
        continue;
      }
      if (!inString && ch === '/' && i + 1 < content.length) {
        if (content[i + 1] === '/') {
          while (i < content.length && content[i] !== '\n') i++;
          continue;
        }
        if (content[i + 1] === '*') {
          i += 2;
          while (i + 1 < content.length && !(content[i] === '*' && content[i + 1] === '/')) i++;
          i += 2;
          continue;
        }
      }
      result += ch;
      i++;
    }
    return result;
  }

  private readTnfConfigFile(configPath: string): TnfProjectConfig | null {
    try {
      if (!fs.existsSync(configPath)) return null;
      let raw = fs.readFileSync(configPath, 'utf8');
      if (configPath.endsWith('.jsonc')) {
        raw = this.stripJsoncComments(raw);
      }
      return JSON.parse(raw) as TnfProjectConfig;
    } catch {
      return null;
    }
  }

  getTnfProjectConfig(): TnfProjectConfig {
    const workspaceFolders = vscode.workspace.workspaceFolders;
    if (!workspaceFolders || workspaceFolders.length === 0) return {};

    const root = workspaceFolders[0].uri.fsPath;
    const jsoncPath = path.join(root, 'tnf.jsonc');
    const jsonPath = path.join(root, 'tnf.json');

    return this.readTnfConfigFile(jsoncPath) || this.readTnfConfigFile(jsonPath) || {};
  }

  getTnfProjectMcpServers(): MCPServerConfig[] {
    const projectConfig = this.getTnfProjectConfig();
    if (!projectConfig.mcp) return [];

    const servers: MCPServerConfig[] = [];
    for (const [name, server] of Object.entries(projectConfig.mcp)) {
      if (server.enabled === false) continue;
      servers.push({
        name,
        command: Array.isArray(server.command) ? server.command[0] : server.command,
        args: Array.isArray(server.command) ? server.command.slice(1) : (server.args || []),
        env: server.environment || server.env,
        type: server.type,
        enabled: server.enabled !== false,
        cwd: server.cwd,
      });
    }
    return servers;
  }

  getTnfProjectCommands(): Array<{ name: string; filePath: string }> {
    const workspaceFolders = vscode.workspace.workspaceFolders;
    if (!workspaceFolders || workspaceFolders.length === 0) return [];
    const root = workspaceFolders[0].uri.fsPath;
    const commandDir = path.join(root, '.tnf', 'command');
    if (!fs.existsSync(commandDir)) return [];
    try {
      return fs.readdirSync(commandDir)
        .filter(f => f.endsWith('.md'))
        .map(f => ({ name: f.replace(/\.md$/, ''), filePath: path.join(commandDir, f) }));
    } catch { return []; }
  }

  getTnfProjectAgents(): Array<{ name: string; filePath: string }> {
    const workspaceFolders = vscode.workspace.workspaceFolders;
    if (!workspaceFolders || workspaceFolders.length === 0) return [];
    const root = workspaceFolders[0].uri.fsPath;
    const agentDir = path.join(root, '.tnf', 'agent');
    if (!fs.existsSync(agentDir)) return [];
    try {
      return fs.readdirSync(agentDir)
        .filter(f => f.endsWith('.md'))
        .map(f => ({ name: f.replace(/\.md$/, ''), filePath: path.join(agentDir, f) }));
    } catch { return []; }
  }

  checkBashPermission(command: string): boolean {
    const projectConfig = this.getTnfProjectConfig();
    if (!projectConfig.permission?.bash) return true;
    const cmdPart = command.trim().split(/\s+/)[0] || command.trim();
    for (const [pattern, action] of Object.entries(projectConfig.permission.bash)) {
      if (pattern === '*') return action === 'allow';
      if (this.matchGlob(pattern, command.trim()) || this.matchGlob(pattern, cmdPart + ' *')) {
        return action === 'allow';
      }
    }
    return true;
  }

  private matchGlob(pattern: string, value: string): boolean {
    const regexStr = pattern.replace(/\*/g, '.*').replace(/\?/g, '.');
    try {
      return new RegExp(`^${regexStr}$`).test(value);
    } catch { return false; }
  }

  getExtensionVersion(): string {
    return EXTENSION_VERSION;
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
