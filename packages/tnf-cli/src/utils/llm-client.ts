export interface LLMMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

export interface LLMOptions {
  temperature?: number;
  maxTokens?: number;
}

export class LLMClient {
  private readonly apiKey: string;
  private readonly baseUrl: string;
  private readonly model: string;

  constructor() {
    // Primary Provider (via standard env vars)
    this.apiKey = process.env.TNF_LLM_API_KEY || process.env.OPENAI_API_KEY || process.env.NVIDIA_API_KEY || '';
    
    // Check for explicit base URL override
    const explicitBaseUrl = process.env.TNF_LLM_BASE_URL || process.env.OPENAI_API_BASE;
    
    if (explicitBaseUrl) {
      this.baseUrl = explicitBaseUrl;
      this.model = process.env.TNF_LLM_MODEL || process.env.OPENAI_MODEL || 'gpt-4o-mini';
    } else if (process.env.NVIDIA_API_KEY && !process.env.OPENAI_API_KEY) {
      // Fallback logic for secondary standard provider
      this.baseUrl = 'https://integrate.api.nvidia.com/v1';
      this.model = process.env.NVIDIA_MODEL || 'meta/llama-3.1-405b-instruct';
    } else {
      // Default to standard endpoint
      this.baseUrl = 'https://api.openai.com/v1';
      this.model = process.env.OPENAI_MODEL || 'gpt-4o-mini';
    }
  }

  async chatComplete(messages: LLMMessage[], options: LLMOptions = {}): Promise<string> {
    if (!this.apiKey) {
      throw new Error('LLM API key not found. Please set TNF_LLM_API_KEY.');
    }

    const response = await fetch(`${this.baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify({
        model: this.model,
        messages,
        temperature: options.temperature ?? 0.7,
        max_tokens: options.maxTokens ?? 1000,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`LLM provider error (${response.status}): ${error}`);
    }

    const data = await response.json() as any;
    return data.choices[0]?.message?.content || '';
  }
}
