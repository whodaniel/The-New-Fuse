/**
 * Gemini Nano Service
 *
 * Integrates Chrome's built-in AI (Gemini Nano) via window.ai APIs
 * Provides on-device AI capabilities when available in the user's browser
 *
 * @see https://developer.chrome.com/docs/ai/built-in
 */

// Type definitions for window.ai (Chrome Built-in AI)
interface AILanguageModelCapabilities {
  available: 'readily' | 'after-download' | 'no';
  defaultTemperature?: number;
  defaultTopK?: number;
  maxTopK?: number;
}

interface AILanguageModel {
  prompt(input: string, options?: AIPromptOptions): Promise<string>;
  promptStreaming(input: string, options?: AIPromptOptions): ReadableStream;
  countPromptTokens(input: string): Promise<number>;
  destroy(): void;
}

interface AIPromptOptions {
  signal?: AbortSignal;
}

interface AILanguageModelFactory {
  capabilities(): Promise<AILanguageModelCapabilities>;
  create(options?: AICreateOptions): Promise<AILanguageModel>;
}

interface AICreateOptions {
  temperature?: number;
  topK?: number;
  signal?: AbortSignal;
  systemPrompt?: string;
}

interface WindowAI {
  languageModel: AILanguageModelFactory;
  summarizer?: any; // Summarizer API
  writer?: any; // Writer API
  rewriter?: any; // Rewriter API
}

declare global {
  interface Window {
    ai?: WindowAI;
  }
}

export interface GeminiNanoCapabilities {
  available: boolean;
  status: 'readily' | 'after-download' | 'no' | 'unsupported';
  features: {
    languageModel: boolean;
    summarizer: boolean;
    writer: boolean;
    rewriter: boolean;
  };
  defaultTemperature?: number;
  defaultTopK?: number;
  maxTopK?: number;
}

export interface GeminiPromptOptions {
  temperature?: number;
  topK?: number;
  systemPrompt?: string;
  signal?: AbortSignal;
  streaming?: boolean;
}

export class GeminiNanoService {
  private static instance: GeminiNanoService;
  private languageModel: AILanguageModel | null = null;
  private capabilities: GeminiNanoCapabilities | null = null;

  private constructor() {}

  static getInstance(): GeminiNanoService {
    if (!GeminiNanoService.instance) {
      GeminiNanoService.instance = new GeminiNanoService();
    }
    return GeminiNanoService.instance;
  }

  /**
   * Check if Gemini Nano is available in the browser
   */
  async checkCapabilities(): Promise<GeminiNanoCapabilities> {
    if (this.capabilities) {
      return this.capabilities;
    }

    // Check if window.ai exists
    if (!window.ai) {
      this.capabilities = {
        available: false,
        status: 'unsupported',
        features: {
          languageModel: false,
          summarizer: false,
          writer: false,
          rewriter: false,
        },
      };
      return this.capabilities;
    }

    try {
      const langModelCaps = await window.ai.languageModel.capabilities();

      this.capabilities = {
        available: langModelCaps.available !== 'no',
        status: langModelCaps.available,
        features: {
          languageModel: langModelCaps.available !== 'no',
          summarizer: !!window.ai.summarizer,
          writer: !!window.ai.writer,
          rewriter: !!window.ai.rewriter,
        },
        defaultTemperature: langModelCaps.defaultTemperature,
        defaultTopK: langModelCaps.defaultTopK,
        maxTopK: langModelCaps.maxTopK,
      };

      console.log('[GeminiNano] Capabilities detected:', this.capabilities);
      return this.capabilities;
    } catch (error) {
      console.error('[GeminiNano] Error checking capabilities:', error);
      this.capabilities = {
        available: false,
        status: 'no',
        features: {
          languageModel: false,
          summarizer: false,
          writer: false,
          rewriter: false,
        },
      };
      return this.capabilities;
    }
  }

  /**
   * Initialize the language model
   */
  async initialize(options?: AICreateOptions): Promise<boolean> {
    const caps = await this.checkCapabilities();

    if (!caps.available) {
      console.warn('[GeminiNano] Not available in this browser');
      return false;
    }

    if (caps.status === 'after-download') {
      console.log('[GeminiNano] Model needs to be downloaded first');
      // The model will be downloaded automatically when create() is called
    }

    try {
      this.languageModel = await window.ai!.languageModel.create(options);
      console.log('[GeminiNano] Language model initialized successfully');
      return true;
    } catch (error) {
      console.error('[GeminiNano] Failed to initialize language model:', error);
      return false;
    }
  }

  /**
   * Send a prompt to Gemini Nano
   */
  async prompt(input: string, options?: GeminiPromptOptions): Promise<string> {
    if (!this.languageModel) {
      const initialized = await this.initialize({
        temperature: options?.temperature,
        topK: options?.topK,
        systemPrompt: options?.systemPrompt,
      });

      if (!initialized) {
        throw new Error('Gemini Nano is not available');
      }
    }

    try {
      const response = await this.languageModel!.prompt(input, {
        signal: options?.signal,
      });
      return response;
    } catch (error) {
      console.error('[GeminiNano] Prompt error:', error);
      throw error;
    }
  }

  /**
   * Send a streaming prompt to Gemini Nano
   */
  async promptStreaming(
    input: string,
    onChunk: (chunk: string) => void,
    options?: GeminiPromptOptions
  ): Promise<void> {
    if (!this.languageModel) {
      const initialized = await this.initialize({
        temperature: options?.temperature,
        topK: options?.topK,
        systemPrompt: options?.systemPrompt,
      });

      if (!initialized) {
        throw new Error('Gemini Nano is not available');
      }
    }

    try {
      const stream = this.languageModel!.promptStreaming(input, {
        signal: options?.signal,
      });

      const reader = stream.getReader();
      const decoder = new TextDecoder();

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        onChunk(chunk);
      }
    } catch (error) {
      console.error('[GeminiNano] Streaming error:', error);
      throw error;
    }
  }

  /**
   * Count tokens in a prompt
   */
  async countTokens(input: string): Promise<number> {
    if (!this.languageModel) {
      await this.initialize();
    }

    if (!this.languageModel) {
      throw new Error('Gemini Nano is not available');
    }

    try {
      return await this.languageModel.countPromptTokens(input);
    } catch (error) {
      console.error('[GeminiNano] Token counting error:', error);
      throw error;
    }
  }

  /**
   * Destroy the current session
   */
  destroy(): void {
    if (this.languageModel) {
      this.languageModel.destroy();
      this.languageModel = null;
      console.log('[GeminiNano] Session destroyed');
    }
  }

  /**
   * Get current capabilities
   */
  getCapabilities(): GeminiNanoCapabilities | null {
    return this.capabilities;
  }

  /**
   * Check if Gemini Nano is ready to use
   */
  isReady(): boolean {
    return this.languageModel !== null;
  }
}

// Export singleton instance
export const geminiNano = GeminiNanoService.getInstance();
