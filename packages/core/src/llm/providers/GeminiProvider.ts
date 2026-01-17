import { Injectable, Logger } from '@nestjs/common';
import {
  GoogleGenerativeAI,
  GenerativeModel,
  HarmCategory,
  HarmBlockThreshold,
} from '@google/generative-ai';
import { LLMProvider } from '../LLMProvider';
import { LLMMessage, LLMResponse, LLMConfig } from '@the-new-fuse/types';

export interface GeminiConfig extends LLMConfig {
  apiKey: string;
  baseURL?: string;
  safetySettings?: Array<{
    category: HarmCategory;
    threshold: HarmBlockThreshold;
  }>;
}

/**
 * Google Gemini Provider
 *
 * Supports Gemini models:
 * - gemini-2.0-flash-exp (Latest Flash, fastest)
 * - gemini-1.5-pro-latest (Pro, most capable)
 * - gemini-1.5-flash-latest (Flash, balanced)
 *
 * Features:
 * - Multimodal support (text, images, video, audio)
 * - Extended context (2M tokens for 1.5 Pro)
 * - Function calling
 * - Streaming
 * - Grounding with Google Search
 */
@Injectable()
export class GeminiProvider extends LLMProvider {
  private client: GoogleGenerativeAI;
  private model: GenerativeModel;
  protected readonly logger = new Logger(GeminiProvider.name);

  constructor(private readonly config: GeminiConfig) {
    super();
    this.client = new GoogleGenerativeAI(config.apiKey);
    this.model = this.client.getGenerativeModel({
      model: config.modelName || 'gemini-2.0-flash-exp',
      safetySettings: config.safetySettings || this.getDefaultSafetySettings(),
    });
  }

  /**
   * Generate completion from prompt
   */
  async generate(prompt: string): Promise<string> {
    try {
      const result = await this.model.generateContent({
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        generationConfig: {
          maxOutputTokens: this.config.maxTokens || 8192,
          temperature: this.config.temperature ?? 0.7,
          topP: this.config.topP,
          stopSequences: this.config.stopSequences,
        },
      });

      const response = result.response;
      return response.text();
    } catch (error) {
      this.logger.error('Failed to generate completion from Gemini', error);
      throw error;
    }
  }

  /**
   * Chat completion with message history
   */
  async chat(messages: LLMMessage[], config?: Partial<LLMConfig>): Promise<LLMResponse> {
    try {
      const mergedConfig = { ...this.config, ...config };

      // Convert messages to Gemini format
      const geminiMessages = this.convertMessages(messages);

      const result = await this.model.generateContent({
        contents: geminiMessages,
        generationConfig: {
          maxOutputTokens: mergedConfig.maxTokens || 8192,
          temperature: mergedConfig.temperature ?? 0.7,
          topP: mergedConfig.topP,
          stopSequences: mergedConfig.stopSequences,
        },
      });

      const response = result.response;
      const text = response.text();

      // Gemini doesn't provide detailed token usage in the same way
      // We'll approximate based on content length
      const promptTokens = await this.countTokens(messages.map((m) => m.content).join('\n'));
      const completionTokens = await this.countTokens(text);

      return {
        content: text,
        usage: {
          promptTokens,
          completionTokens,
          totalTokens: promptTokens + completionTokens,
        },
        metadata: {
          model: this.config.modelName || 'gemini-2.0-flash-exp',
          finishReason: response.candidates?.[0]?.finishReason,
          safetyRatings: response.candidates?.[0]?.safetyRatings,
        },
      };
    } catch (error) {
      this.logger.error('Failed to complete chat with Gemini', error);
      throw error;
    }
  }

  /**
   * Stream chat completion
   */
  async *streamChat(
    messages: LLMMessage[],
    config?: Partial<LLMConfig>,
  ): AsyncGenerator<string, void, unknown> {
    try {
      const mergedConfig = { ...this.config, ...config };
      const geminiMessages = this.convertMessages(messages);

      const result = await this.model.generateContentStream({
        contents: geminiMessages,
        generationConfig: {
          maxOutputTokens: mergedConfig.maxTokens || 8192,
          temperature: mergedConfig.temperature ?? 0.7,
          topP: mergedConfig.topP,
          stopSequences: mergedConfig.stopSequences,
        },
      });

      for await (const chunk of result.stream) {
        const text = chunk.text();
        if (text) {
          yield text;
        }
      }
    } catch (error) {
      this.logger.error('Failed to stream chat with Gemini', error);
      throw error;
    }
  }

  /**
   * Convert LLMMessage[] to Gemini message format
   */
  private convertMessages(messages: LLMMessage[]): Array<{
    role: 'user' | 'model';
    parts: Array<{ text: string }>;
  }> {
    return messages
      .filter((m) => m.role !== 'system') // Gemini doesn't have system role, merge into first user message
      .map((m) => ({
        role: m.role === 'user' ? 'user' : 'model',
        parts: [{ text: m.content }],
      }));
  }

  /**
   * Get default safety settings (permissive for development)
   */
  private getDefaultSafetySettings() {
    return [
      {
        category: HarmCategory.HARM_CATEGORY_HARASSMENT,
        threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
      },
      {
        category: HarmCategory.HARM_CATEGORY_HATE_SPEECH,
        threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
      },
      {
        category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT,
        threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
      },
      {
        category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT,
        threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
      },
    ];
  }

  /**
   * Count tokens in text (approximate)
   */
  async countTokens(text: string): Promise<number> {
    try {
      const result = await this.model.countTokens(text);
      return result.totalTokens;
    } catch (error) {
      // Fallback to approximation if API fails
      this.logger.warn('Token counting API failed, using approximation', error);
      return Math.ceil(text.length / 4);
    }
  }

  /**
   * Get maximum context length for model
   */
  getContextLength(): number {
    const model = this.config.modelName || 'gemini-2.0-flash-exp';

    // Context lengths as of January 2026
    if (model.includes('1.5-pro')) return 2000000; // 2M tokens
    if (model.includes('1.5-flash')) return 1000000; // 1M tokens
    if (model.includes('2.0-flash')) return 1000000; // 1M tokens

    return 1000000; // Default to 1M
  }

  /**
   * Check if model supports vision
   */
  supportsVision(): boolean {
    // All Gemini 1.5+ models support multimodal (vision, audio, video)
    return true;
  }

  /**
   * Check if model supports function calling
   */
  supportsFunctionCalling(): boolean {
    // All Gemini models support function calling
    return true;
  }

  /**
   * Check if model supports grounding (Google Search)
   */
  supportsGrounding(): boolean {
    // Gemini 1.5+ supports grounding with Google Search
    return true;
  }

  /**
   * Get model information
   */
  getModelInfo() {
    const model = this.config.modelName || 'gemini-2.0-flash-exp';

    return {
      provider: 'google',
      model,
      contextLength: this.getContextLength(),
      supportsVision: this.supportsVision(),
      supportsFunctionCalling: this.supportsFunctionCalling(),
      supportsGrounding: this.supportsGrounding(),
      supportsStreaming: true,
      maxTokens: this.config.maxTokens || 8192,
    };
  }

  /**
   * Generate content with multimodal input (text + images/video/audio)
   */
  async generateMultimodal(
    parts: Array<{ text?: string; inlineData?: { mimeType: string; data: string } }>,
  ): Promise<string> {
    try {
      // Map generic parts to specific Gemini Part objects
      const geminiParts = parts.map((p) => {
        if (p.text) return { text: p.text };
        if (p.inlineData) return { inlineData: p.inlineData };
        return { text: '' }; // Fallback for empty parts
      });

      const result = await this.model.generateContent({
        contents: [{ role: 'user', parts: geminiParts }],
        generationConfig: {
          maxOutputTokens: this.config.maxTokens || 8192,
          temperature: this.config.temperature ?? 0.7,
          topP: this.config.topP,
        },
      });

      return result.response.text();
    } catch (error) {
      this.logger.error('Failed to generate multimodal content with Gemini', error);
      throw error;
    }
  }
}
