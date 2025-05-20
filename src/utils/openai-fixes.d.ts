/**
 * This file provides utility functions to help with OpenAI SDK version compatibility
 */
import OpenAI from "openai";
/**
 * Create a properly typed OpenAI client instance
 * This helps with the transition from the old { OpenAI } import pattern to the new default import
 */
export declare function createOpenAIClient(apiKey: string): OpenAI;
/**
 * Fix code that expects the old OpenAI constructor style
 * Example usage:
 *   // Instead of: const openai: 'your-key' })
 *   const openai  = new OpenAI( { apiKey createCompatOpenAI(apiKey: string): OpenAI;
/**
 * Create chat completion with proper typing
 */
export declare function createChatCompletion(
  client: OpenAI,
  messages: Array<{
    role: string;
    content: string;
  }>,
  options?: {
    model?: string;
    temperature?: number;
    maxTokens?: number;
    topP?: number;
    frequencyPenalty?: number;
    presencePenalty?: number;
    stream?: boolean;
  },
): Promise<OpenAI.Chat.Completions.ChatCompletion | OpenAI.Streaming.Stream<OpenAI.Chat.Completions.ChatCompletionChunk>>;
