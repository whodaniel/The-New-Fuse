/**
 * The New Fuse VSCode Extension - AI Service
 * Version 9.0.0 - Clean Architecture (December 2025)
 *
 * Unified AI service supporting multiple providers:
 * - OpenAI (GPT-5.2, GPT-5.1-Codex-Max)
 * - Anthropic (Claude Opus 4.5, Sonnet 4.5)
 * - Google Gemini (Gemini 3 Pro, Gemini 2.5 Flash)
 * - DeepSeek (V3.2-Speciale, DeepSeek-R1)
 * - Qwen (Qwen3-Coder, Qwen 2.5-Max)
 * - OpenRouter
 * - LiteLLM
 * - VS Code Copilot
 */

import * as vscode from 'vscode';
import { ConfigManager } from '../core/config';
import {
  ChatMessage,
  LLMProviderConfig,
  LLMProviderType,
  LLMRequest,
  LLMResponse,
} from '../core/types';
import { generateId } from '../utils/helpers';
import { log } from '../utils/logger';

interface ProviderStatus {
  available: boolean;
  lastError?: string;
  lastCheck: string;
}

/**
 * Unified AI Service managing multiple LLM providers
 */
export class AIService {
  private static instance: AIService;
  private activeProvider: LLMProviderType | null = null;
  private providerStatuses: Map<LLMProviderType, ProviderStatus> = new Map();
  private abortControllers: Map<string, AbortController> = new Map();

  private constructor() {}

  static getInstance(): AIService {
    if (!AIService.instance) {
      AIService.instance = new AIService();
    }
    return AIService.instance;
  }

  async initialize(): Promise<void> {
    log.info('Initializing AI Service');

    const config = ConfigManager.getInstance();
    const defaultProvider = config.getConfig().defaultProvider;

    // Check if default provider is available
    const isAvailable = await this.checkProvider(defaultProvider);
    if (isAvailable) {
      this.activeProvider = defaultProvider;
      log.info(`Active provider set to: ${defaultProvider}`);
    } else {
      log.warn(`Default provider ${defaultProvider} not available`);
      // Try to find an available provider
      await this.autoSelectProvider();
    }
  }

  /**
   * Check if a provider is available (has API key configured)
   */
  async checkProvider(provider: LLMProviderType): Promise<boolean> {
    const config = ConfigManager.getInstance();

    try {
      // Copilot doesn't need an API key
      if (provider === 'copilot') {
        // Check if Copilot extension is available
        const copilotExt = vscode.extensions.getExtension('GitHub.copilot');
        const isAvailable = !!copilotExt;
        this.updateProviderStatus(provider, isAvailable);
        return isAvailable;
      }

      // CLI Agents don't need API keys (they rely on local setup)
      if (provider.endsWith('-cli')) {
        const cliConfig = config.getCLIAgentConfig(provider);
        const isAvailable = !!cliConfig && cliConfig.enabled;
        this.updateProviderStatus(provider, isAvailable);
        return isAvailable;
      }

      // Other providers need API keys
      const apiKey = await config.getApiKey(provider);
      const isAvailable = !!apiKey && apiKey.length > 0;
      this.updateProviderStatus(provider, isAvailable);
      return isAvailable;
    } catch (error) {
      this.updateProviderStatus(provider, false, (error as Error).message);
      return false;
    }
  }

  private updateProviderStatus(
    provider: LLMProviderType,
    available: boolean,
    error?: string
  ): void {
    this.providerStatuses.set(provider, {
      available,
      lastError: error,
      lastCheck: new Date().toISOString(),
    });
  }

  /**
   * Automatically select an available provider
   */
  private async autoSelectProvider(): Promise<void> {
    // Priority order for auto-selection (December 2025)
    const providers: LLMProviderType[] = [
      'gemini-cli', // Priority for local user request
      'openai', // GPT-5.2
      'anthropic', // Claude Opus 4.5
      'gemini', // Gemini 3 Pro
      'deepseek', // DeepSeek-V3.2-Speciale
      'qwen', // Qwen3-Coder
      'openrouter',
      'litellm',
      'copilot',
    ];

    for (const provider of providers) {
      if (await this.checkProvider(provider)) {
        this.activeProvider = provider;
        log.info(`Auto-selected provider: ${provider}`);
        return;
      }
    }

    log.warn('No available providers found');
  }

  /**
   * Get the current active provider
   */
  getActiveProvider(): LLMProviderType | null {
    return this.activeProvider;
  }

  /**
   * Set the active provider
   */
  async setActiveProvider(provider: LLMProviderType): Promise<boolean> {
    const isAvailable = await this.checkProvider(provider);
    if (isAvailable) {
      this.activeProvider = provider;
      log.info(`Switched to provider: ${provider}`);
      return true;
    }
    return false;
  }

  /**
   * Get all available providers
   */
  getAvailableProviders(): LLMProviderType[] {
    return Array.from(this.providerStatuses.entries())
      .filter(([, status]) => status.available)
      .map(([provider]) => provider);
  }

  /**
   * Send a chat request to the active provider
   */
  async chat(request: LLMRequest): Promise<LLMResponse> {
    if (!this.activeProvider) {
      throw new Error('No AI provider configured. Please set up an API key.');
    }

    const config = ConfigManager.getInstance();
    const providerConfig = config.getLLMConfig(this.activeProvider);
    const apiKey = await config.getApiKey(this.activeProvider);

    if (!apiKey && this.activeProvider !== 'copilot') {
      throw new Error(`API key not configured for ${this.activeProvider}`);
    }

    const requestId = generateId();
    const abortController = new AbortController();
    this.abortControllers.set(requestId, abortController);

    try {
      log.debug(`Chat request to ${this.activeProvider}`, {
        model: request.model || providerConfig.model,
        messageCount: request.messages.length,
      });

      const response = await this.sendRequest(
        this.activeProvider,
        { ...providerConfig, apiKey },
        request,
        abortController.signal
      );

      log.debug('Chat response received', {
        model: response.model,
        tokens: response.usage?.totalTokens,
      });

      return response;
    } finally {
      this.abortControllers.delete(requestId);
    }
  }

  /**
   * Cancel an ongoing request
   */
  cancelRequest(requestId: string): void {
    const controller = this.abortControllers.get(requestId);
    if (controller) {
      controller.abort();
      this.abortControllers.delete(requestId);
    }
  }

  /**
   * Cancel all ongoing requests
   */
  cancelAllRequests(): void {
    for (const [id, controller] of this.abortControllers) {
      controller.abort();
      this.abortControllers.delete(id);
    }
  }

  /**
   * Send request to specific provider
   */
  private async sendRequest(
    provider: LLMProviderType,
    config: LLMProviderConfig & { apiKey?: string },
    request: LLMRequest,
    signal: AbortSignal
  ): Promise<LLMResponse> {
    switch (provider) {
      case 'openai':
      case 'openrouter':
      case 'litellm':
      case 'deepseek': // DeepSeek uses OpenAI-compatible API
      case 'qwen': // Qwen/DashScope uses OpenAI-compatible API
        return this.sendOpenAICompatibleRequest(config, request, signal);
      case 'anthropic':
        return this.sendAnthropicRequest(config, request, signal);
      case 'gemini':
        return this.sendGeminiRequest(config, request, signal);
      case 'copilot':
        return this.sendCopilotRequest(request);
      // CLI-based agents
      case 'claude-cli':
      case 'gemini-cli':
      case 'jules-cli':
      case 'aider-cli':
      case 'custom-cli':
        return this.sendCLIAgentRequest(provider, request);
      default:
        throw new Error(`Unsupported provider: ${provider}`);
    }
  }

  /**
   * OpenAI-compatible API request (OpenAI, OpenRouter, LiteLLM)
   */
  private async sendOpenAICompatibleRequest(
    config: LLMProviderConfig & { apiKey?: string },
    request: LLMRequest,
    signal: AbortSignal
  ): Promise<LLMResponse> {
    const messages = this.formatMessagesForOpenAI(request);
    const enableStreaming = request.stream ?? false;

    // Build request body
    const requestBody: any = {
      model: request.model || config.model,
      messages,
      temperature: request.temperature ?? config.temperature,
      max_tokens: request.maxTokens ?? config.maxTokens,
      stream: enableStreaming,
    };

    // Add tools if provided
    if (request.tools && request.tools.length > 0) {
      requestBody.tools = request.tools.map((tool) => ({
        type: 'function',
        function: {
          name: tool.name,
          description: tool.description,
          parameters: tool.input_schema,
        },
      }));
    }

    const response = await fetch(`${config.baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${config.apiKey}`,
      },
      body: JSON.stringify(requestBody),
      signal,
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`API error: ${response.status} - ${error}`);
    }

    // Handle streaming response
    if (enableStreaming) {
      return this.handleOpenAIStreamingResponse(response, request.onChunk);
    }

    // Handle non-streaming response
    const data = (await response.json()) as {
      choices: Array<{ message: { content: string; tool_calls?: any[] } }>;
      model: string;
      usage?: { prompt_tokens: number; completion_tokens: number; total_tokens: number };
    };

    return {
      content: data.choices[0]?.message?.content || '',
      model: data.model,
      usage: data.usage
        ? {
            promptTokens: data.usage.prompt_tokens,
            completionTokens: data.usage.completion_tokens,
            totalTokens: data.usage.total_tokens,
          }
        : undefined,
      toolCalls: data.choices[0]?.message?.tool_calls,
    };
  }

  /**
   * Handle OpenAI-compatible streaming response
   */
  private async handleOpenAIStreamingResponse(
    response: Response,
    onChunk?: (chunk: string) => void
  ): Promise<LLMResponse> {
    const reader = response.body?.getReader();
    if (!reader) {
      throw new Error('Response body is not readable');
    }

    const decoder = new TextDecoder();
    let fullContent = '';
    let model = '';

    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split('\n').filter((line) => line.trim() !== '');

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6);
            if (data === '[DONE]') continue;

            try {
              const parsed = JSON.parse(data);
              const content = parsed.choices?.[0]?.delta?.content || '';
              model = parsed.model || model;

              if (content) {
                fullContent += content;
                if (onChunk) {
                  onChunk(content);
                }
              }
            } catch (e) {
              // Skip invalid JSON
              log.warn('Failed to parse streaming chunk', e);
            }
          }
        }
      }
    } finally {
      reader.releaseLock();
    }

    return {
      content: fullContent,
      model,
    };
  }

  /**
   * Anthropic Claude API request
   */
  private async sendAnthropicRequest(
    config: LLMProviderConfig & { apiKey?: string },
    request: LLMRequest,
    signal: AbortSignal
  ): Promise<LLMResponse> {
    const { systemPrompt, messages } = this.formatMessagesForAnthropic(request);
    const enableStreaming = request.stream ?? false;

    // Build request body
    const requestBody: any = {
      model: request.model || config.model,
      max_tokens: request.maxTokens ?? config.maxTokens,
      system: systemPrompt,
      messages,
      stream: enableStreaming,
    };

    // Add tools if provided
    if (request.tools && request.tools.length > 0) {
      requestBody.tools = request.tools;
    }

    // Add extended thinking if enabled (Claude 3.7+)
    if (request.enableThinking) {
      requestBody.thinking = {
        type: 'enabled',
        budget_tokens: request.thinkingBudget || 10000,
      };
    }

    const response = await fetch(`${config.baseUrl}/messages`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': config.apiKey || '',
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify(requestBody),
      signal,
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Anthropic API error: ${response.status} - ${error}`);
    }

    // Handle streaming response
    if (enableStreaming) {
      return this.handleAnthropicStreamingResponse(response, request.onChunk);
    }

    // Handle non-streaming response
    const data = (await response.json()) as {
      content: Array<{ type: string; text?: string; name?: string; input?: any; id?: string }>;
      model: string;
      usage?: { input_tokens: number; output_tokens: number };
    };

    // Extract text content and tool uses
    let textContent = '';
    const toolUses: any[] = [];

    for (const block of data.content) {
      if (block.type === 'text' && block.text) {
        textContent += block.text;
      } else if (block.type === 'tool_use') {
        toolUses.push({
          id: block.id,
          name: block.name,
          input: block.input,
        });
      }
    }

    return {
      content: textContent,
      model: data.model,
      usage: data.usage
        ? {
            promptTokens: data.usage.input_tokens,
            completionTokens: data.usage.output_tokens,
            totalTokens: data.usage.input_tokens + data.usage.output_tokens,
          }
        : undefined,
      toolCalls: toolUses.length > 0 ? toolUses : undefined,
    };
  }

  /**
   * Handle Anthropic streaming response
   */
  private async handleAnthropicStreamingResponse(
    response: Response,
    onChunk?: (chunk: string) => void
  ): Promise<LLMResponse> {
    const reader = response.body?.getReader();
    if (!reader) {
      throw new Error('Response body is not readable');
    }

    const decoder = new TextDecoder();
    let fullContent = '';
    let model = '';

    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split('\n').filter((line) => line.trim() !== '');

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6);

            try {
              const parsed = JSON.parse(data);

              // Handle different event types
              if (parsed.type === 'content_block_delta') {
                const content = parsed.delta?.text || '';
                model = parsed.model || model;

                if (content) {
                  fullContent += content;
                  if (onChunk) {
                    onChunk(content);
                  }
                }
              } else if (parsed.type === 'message_start') {
                model = parsed.message?.model || model;
              }
            } catch (e) {
              // Skip invalid JSON
              log.warn('Failed to parse Anthropic streaming chunk', e);
            }
          }
        }
      }
    } finally {
      reader.releaseLock();
    }

    return {
      content: fullContent,
      model,
    };
  }

  /**
   * Google Gemini API request
   */
  private async sendGeminiRequest(
    config: LLMProviderConfig & { apiKey?: string },
    request: LLMRequest,
    signal: AbortSignal
  ): Promise<LLMResponse> {
    const contents = this.formatMessagesForGemini(request);
    const model = request.model || config.model;
    const enableStreaming = request.stream ?? false;

    // Build request body
    const requestBody: any = {
      contents,
      generationConfig: {
        temperature: request.temperature ?? config.temperature,
        maxOutputTokens: request.maxTokens ?? config.maxTokens,
      },
    };

    // Add tools if provided (Gemini uses function calling)
    if (request.tools && request.tools.length > 0) {
      requestBody.tools = [
        {
          functionDeclarations: request.tools.map((tool) => ({
            name: tool.name,
            description: tool.description,
            parameters: tool.input_schema,
          })),
        },
      ];
    }

    // Determine endpoint based on streaming
    const endpoint = enableStreaming ? 'streamGenerateContent' : 'generateContent';

    const response = await fetch(
      `${config.baseUrl}/models/${model}:${endpoint}?key=${config.apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody),
        signal,
      }
    );

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Gemini API error: ${response.status} - ${error}`);
    }

    // Handle streaming response
    if (enableStreaming) {
      return this.handleGeminiStreamingResponse(response, model, request.onChunk);
    }

    // Handle non-streaming response
    const data = (await response.json()) as {
      candidates: Array<{
        content: { parts: Array<{ text?: string; functionCall?: any }> };
      }>;
      usageMetadata?: {
        promptTokenCount: number;
        candidatesTokenCount: number;
        totalTokenCount: number;
      };
    };

    // Extract text content and function calls
    let textContent = '';
    const functionCalls: any[] = [];

    const parts = data.candidates[0]?.content?.parts || [];
    for (const part of parts) {
      if (part.text) {
        textContent += part.text;
      } else if (part.functionCall) {
        functionCalls.push(part.functionCall);
      }
    }

    return {
      content: textContent,
      model,
      usage: data.usageMetadata
        ? {
            promptTokens: data.usageMetadata.promptTokenCount,
            completionTokens: data.usageMetadata.candidatesTokenCount,
            totalTokens: data.usageMetadata.totalTokenCount,
          }
        : undefined,
      toolCalls: functionCalls.length > 0 ? functionCalls : undefined,
    };
  }

  /**
   * Handle Gemini streaming response
   */
  private async handleGeminiStreamingResponse(
    response: Response,
    model: string,
    onChunk?: (chunk: string) => void
  ): Promise<LLMResponse> {
    const reader = response.body?.getReader();
    if (!reader) {
      throw new Error('Response body is not readable');
    }

    const decoder = new TextDecoder();
    let fullContent = '';

    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split('\n').filter((line) => line.trim() !== '');

        for (const line of lines) {
          try {
            const parsed = JSON.parse(line);
            const text = parsed.candidates?.[0]?.content?.parts?.[0]?.text || '';

            if (text) {
              fullContent += text;
              if (onChunk) {
                onChunk(text);
              }
            }
          } catch (e) {
            // Skip invalid JSON
            log.warn('Failed to parse Gemini streaming chunk', e);
          }
        }
      }
    } finally {
      reader.releaseLock();
    }

    return {
      content: fullContent,
      model,
    };
  }

  /**
   * VS Code Copilot Language Model API request
   */
  private async sendCopilotRequest(request: LLMRequest): Promise<LLMResponse> {
    // Use VS Code's built-in Language Model API
    const models = await vscode.lm.selectChatModels({ vendor: 'copilot' });

    if (models.length === 0) {
      throw new Error('No Copilot models available');
    }

    const model = models[0];
    const messages = request.messages.map((m) => {
      if (m.role === 'user') {
        return vscode.LanguageModelChatMessage.User(m.content);
      } else if (m.role === 'assistant') {
        return vscode.LanguageModelChatMessage.Assistant(m.content);
      }
      return vscode.LanguageModelChatMessage.User(m.content);
    });

    const response = await model.sendRequest(messages, {});

    let content = '';
    for await (const chunk of response.text) {
      content += chunk;
    }

    return {
      content,
      model: model.id,
    };
  }

  // ============================================
  // Message Formatting Helpers
  // ============================================

  private formatMessagesForOpenAI(request: LLMRequest): Array<{ role: string; content: string }> {
    const messages: Array<{ role: string; content: string }> = [];

    if (request.systemPrompt) {
      messages.push({ role: 'system', content: request.systemPrompt });
    }

    for (const msg of request.messages) {
      messages.push({ role: msg.role, content: msg.content });
    }

    return messages;
  }

  private formatMessagesForAnthropic(request: LLMRequest): {
    systemPrompt: string;
    messages: Array<{ role: string; content: string }>;
  } {
    let systemPrompt = request.systemPrompt || 'You are a helpful AI assistant.';
    const messages: Array<{ role: string; content: string }> = [];

    for (const msg of request.messages) {
      if (msg.role === 'system') {
        systemPrompt = msg.content;
      } else {
        messages.push({ role: msg.role, content: msg.content });
      }
    }

    return { systemPrompt, messages };
  }

  private formatMessagesForGemini(request: LLMRequest): Array<{
    role: string;
    parts: Array<{ text: string }>;
  }> {
    return request.messages
      .filter((m) => m.role !== 'system')
      .map((m) => ({
        role: m.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: m.content }],
      }));
  }

  /**
   * CLI Agent request - executes local CLI tools like claude, gemini, jules, aider
   */
  private async sendCLIAgentRequest(
    provider: LLMProviderType,
    request: LLMRequest
  ): Promise<LLMResponse> {
    const config = ConfigManager.getInstance();
    const cliConfig = config.getCLIAgentConfig(provider);

    if (!cliConfig || !cliConfig.enabled) {
      throw new Error(`CLI agent ${provider} is not configured or not enabled`);
    }

    // Build the prompt from messages
    const prompt = request.messages.map((m) => `${m.role}: ${m.content}`).join('\n');

    log.info(`Executing CLI agent: ${provider}`, { command: cliConfig.command });

    try {
      const { spawn } = await import('child_process');

      return new Promise((resolve, reject) => {
        const args = [...(cliConfig.args || [])];

        // Add prompt based on input format
        if (cliConfig.inputFormat === 'arg') {
          args.push(prompt);
        }

        const child = spawn(cliConfig.command, args, {
          cwd: cliConfig.workingDirectory || process.cwd(),
          env: { ...process.env, ...cliConfig.env },
          shell: true,
        });

        let stdout = '';
        let stderr = '';

        child.stdout?.on('data', (data) => {
          stdout += data.toString();
        });

        child.stderr?.on('data', (data) => {
          stderr += data.toString();
        });

        // Send prompt via stdin if configured
        if (cliConfig.inputFormat === 'stdin') {
          child.stdin?.write(prompt);
          child.stdin?.end();
        }

        // Set timeout
        const timeout = setTimeout(() => {
          child.kill();
          reject(
            new Error(`CLI agent ${provider} timed out after ${cliConfig.timeout || 60000}ms`)
          );
        }, cliConfig.timeout || 60000);

        child.on('close', (code) => {
          clearTimeout(timeout);

          if (code !== 0) {
            log.error(`CLI agent ${provider} exited with code ${code}`, { stderr });
            reject(new Error(`CLI agent failed: ${stderr || 'Unknown error'}`));
            return;
          }

          let content = stdout.trim();

          // Parse JSON output if configured
          if (cliConfig.outputFormat === 'json') {
            try {
              const parsed = JSON.parse(content);
              content = parsed.content || parsed.response || parsed.message || content;
            } catch {
              // Keep as-is if not valid JSON
            }
          }

          log.debug(`CLI agent ${provider} response received`, { length: content.length });

          resolve({
            content,
            model: provider,
          });
        });

        child.on('error', (error) => {
          clearTimeout(timeout);
          log.error(`CLI agent ${provider} error`, error);
          reject(new Error(`Failed to execute CLI agent: ${error.message}`));
        });
      });
    } catch (error) {
      log.error(`CLI agent ${provider} execution failed`, error);
      throw error;
    }
  }

  /**
   * Quick chat helper - single message interaction
   */
  async quickChat(prompt: string, systemPrompt?: string): Promise<string> {
    const message: ChatMessage = {
      id: generateId(),
      role: 'user',
      content: prompt,
      timestamp: new Date().toISOString(),
    };

    const response = await this.chat({
      messages: [message],
      systemPrompt,
    });

    return response.content;
  }
}

// Export singleton getter
export function getAIService(): AIService {
  return AIService.getInstance();
}
