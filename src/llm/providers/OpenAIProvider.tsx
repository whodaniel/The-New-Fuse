// filepath: src/llm/providers/OpenAIProvider.ts
import OpenAI from "openai";
import { Logger } from "@/utils/logger";
import { LLMProvider } from '../types.js';

export class OpenAIProvider implements LLMProvider {
  private client: OpenAI;
  private logger: Logger;

  constructor(apiKey: string) {
    this.client = new OpenAI({ apiKey });
    this.logger = new Logger("OpenAIProvider");
  }

  async generateCompletion(
    prompt: string,
    options: Record<string, unknown> = {}
  ): Promise<string> {
    try {
      const response = await this.client.chat.completions.create({
        model: (options.model as string) ?? "gpt-3.5-turbo",
        messages: [{ role: "user", content: prompt }],
        temperature: (options.temperature as number) ?? 0.7,
        max_tokens: (options.maxTokens as number) ?? 150,
      });

      return response.choices[0]?.message?.content ?? "";
    } catch (error) {
      this.logger.error(`Error generating completion: ${error}`);
      throw error;
    }
  }
}
