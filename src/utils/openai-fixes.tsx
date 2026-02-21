/**
 * This file provides utility functions to help with OpenAI SDK version compatibility
 */

import OpenAI from "openai";

/**
 * Create a properly typed OpenAI client instance
 * This helps with the transition from the old { OpenAI } import pattern to the new default import
 */
export function createOpenAIClient(apiKey: string): OpenAI {
  return new OpenAI({ apiKey });
}

/**
 * Create a compatible API for chat completions
 */
export function createChatCompletion(
  client: OpenAI,
  messages: OpenAI.Chat.Completions.ChatCompletionMessageParam[], // More specific type
  options: {
    model?: string;
    temperature?: number;
    maxTokens?: number;
    topP?: number;
    frequencyPenalty?: number;
    presencePenalty?: number;
    stream?: boolean;
  } = {}
) {
  const { model = "gpt-3.5-turbo", maxTokens, ...rest } = options;

  return client.chat.completions.create({
    model,
    messages,
    max_tokens: maxTokens,
    ...rest,
  });
}
