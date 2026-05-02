import { ContextPackage } from '../../types/events';

export interface LlmClientConfig {
  enabled: boolean;
  apiUrl: string;
  model: string;
  apiKey?: string;
  timeoutMs: number;
}

export interface ILlmClient {
  complete(prompt: string, pkg: ContextPackage): Promise<string>;
}

export class OpenaiCompatClient implements ILlmClient {
  constructor(private readonly config: LlmClientConfig) {}

  async complete(prompt: string, pkg: ContextPackage): Promise<string> {
    if (!this.config.enabled) {
      return 'OpenAI-compatible LLM disabled; request skipped.';
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.config.timeoutMs);

    try {
      const headers: Record<string, string> = {
        'content-type': 'application/json',
      };
      if (this.config.apiKey) {
        headers.authorization = `Bearer ${this.config.apiKey}`;
      }

      const response = await fetch(this.config.apiUrl,
        {
          method: 'POST',
          headers,
          body: JSON.stringify({
            model: this.config.model,
            messages: [{ role: 'user', content: prompt }],
            temperature: 0.7,
            // max_tokens: this.config.maxTokens, // Max tokens will be handled by the provider
          }),
          signal: controller.signal,
        }
      );

      if (!response.ok) {
        const errorText = await response.text();
        return `OpenAI-compatible LLM request failed: HTTP ${response.status} ${errorText.slice(0, 240)}`;
      }

      const data = (await response.json()) as {
        choices?: Array<{ message?: { content?: string } }>;
      };

      const content = data.choices?.[0]?.message?.content;
      return content && content.length > 0
        ? content
        : 'OpenAI-compatible LLM returned no content.';
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      return `OpenAI-compatible LLM request error: ${message}`;
    } finally {
      clearTimeout(timeoutId);
    }
  }
}
