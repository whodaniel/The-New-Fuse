import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

export interface LLMMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

export interface LLMOptions {
  temperature?: number;
  maxTokens?: number;
}

export class LLMClient {
  private apiKey: string;
  private baseUrl: string;
  private model: string;
  private readonly role: 'orchestrator' | 'worker' | 'reviewer' | 'subagent';

  constructor(role: 'orchestrator' | 'worker' | 'reviewer' | 'subagent' = 'worker') {
    this.role = role;
    this.resolveProvider();
  }

  private resolveProvider(): void {
    // 0. Load env vars if not already loaded (simple manual parse if dotenv not handy)
    try {
      const currentDir = path.dirname(fileURLToPath(import.meta.url));
      const rootDir = path.resolve(currentDir, '../../../..');
      ['.env', '.env.local'].forEach((file) => {
        const p = path.join(rootDir, file);
        if (fs.existsSync(p)) {
          fs.readFileSync(p, 'utf8')
            .split('\n')
            .forEach((line) => {
              const match = line.match(/^([^#=]+)=(.*)$/);
              if (match) {
                const key = match[1].trim();
                const val = match[2].trim().replace(/^["'](.*)["']$/, '$1');
                if (!process.env[key]) process.env[key] = val;
              }
            });
        }
      });
    } catch (e) {
      // Ignore errors in env loading
    }

    // 1. Try to load dynamic status from the LLM Provider Tester agent
    const statusPath = path.resolve(process.cwd(), 'data/llm-provider-status.json');

    if (fs.existsSync(statusPath)) {
      try {
        const status = JSON.parse(fs.readFileSync(statusPath, 'utf8'));
        const allocation = status.allocations?.[this.role] || status.bestAvailable;

        if (allocation && allocation.active) {
          this.apiKey = process.env[allocation.envKey] || '';

          if (allocation.id === 'gemini') {
            this.baseUrl = 'https://generativelanguage.googleapis.com/v1beta';
            this.model = process.env.GEMINI_MODEL || process.env.TNF_LLM_MODEL || 'gemini-pro';
          } else if (allocation.id === 'groq') {
            this.baseUrl = 'https://api.groq.com/openai/v1';
            this.model = process.env.GROQ_MODEL || process.env.TNF_LLM_MODEL || 'llama3-8b-8192';
          } else if (allocation.id === 'deepseek') {
            this.baseUrl = 'https://api.deepseek.com/v1';
            this.model = process.env.DEEPSEEK_MODEL || process.env.TNF_LLM_MODEL || 'deepseek-chat';
          } else if (allocation.id === 'openrouter') {
            this.baseUrl = 'https://openrouter.ai/api/v1';
            this.model =
              process.env.OPENROUTER_MODEL || process.env.TNF_LLM_MODEL || 'openrouter/auto';
          } else {
            this.baseUrl = allocation.testUrl.replace(
              /\/chat\/completions$|\/models$|\/messages$/,
              ''
            );
            this.model = process.env.TNF_LLM_MODEL || process.env.OPENAI_MODEL || 'model-auto';
          }

          if (this.apiKey) return;
        }
      } catch (err) {
        // Fallback to environment variables if file is corrupt
      }
    }

    // 2. Fallback to standard environment variables if dynamic resolution fails
    this.apiKey =
      process.env.TNF_LLM_API_KEY || process.env.OPENAI_API_KEY || process.env.NVIDIA_API_KEY || '';
    const explicitBaseUrl = process.env.TNF_LLM_BASE_URL || process.env.OPENAI_API_BASE;

    if (explicitBaseUrl) {
      this.baseUrl = explicitBaseUrl;
      this.model = process.env.TNF_LLM_MODEL || process.env.OPENAI_MODEL || 'model-auto';
    } else if (process.env.NVIDIA_API_KEY) {
      this.baseUrl = 'https://integrate.api.nvidia.com/v1';
      this.model = process.env.NVIDIA_MODEL || process.env.TNF_LLM_MODEL || 'nemotron';
    } else {
      this.baseUrl = 'https://api.openai.com/v1';
      this.model = process.env.OPENAI_MODEL || process.env.TNF_LLM_MODEL || 'gpt-auto';
    }
  }

  async chatComplete(messages: LLMMessage[], options: LLMOptions = {}): Promise<string> {
    if (!this.apiKey) {
      // Re-resolve in case the tester agent just finished its first run
      this.resolveProvider();
      if (!this.apiKey) {
        throw new Error(
          'LLM API key not found. Please set TNF_LLM_API_KEY or run tnf boot goldberg.'
        );
      }
    }

    // Handle different API formats (Gemini vs OpenAI-compatible)
    if (this.baseUrl.includes('generativelanguage.googleapis.com')) {
      return this.callGemini(messages, options);
    }

    return this.callOpenAICompatible(messages, options);
  }

  private async callOpenAICompatible(messages: LLMMessage[], options: LLMOptions): Promise<string> {
    const response = await fetch(`${this.baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${this.apiKey}`,
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

    const data = (await response.json()) as any;
    return data.choices[0]?.message?.content || '';
  }

  private async callGemini(messages: LLMMessage[], options: LLMOptions): Promise<string> {
    const geminiMessages = messages.map((m) => ({
      role: m.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: m.content }],
    }));

    const response = await fetch(
      `${this.baseUrl}/models/${this.model}:generateContent?key=${this.apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contents: geminiMessages }),
      }
    );

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Gemini API error (${response.status}): ${error}`);
    }

    const data = (await response.json()) as any;
    return data.candidates?.[0]?.content?.parts?.[0]?.text || '';
  }

  async fetchAvailableModels(): Promise<string[]> {
    if (!this.apiKey) return [];

    // Gemini has a different models endpoint structure
    if (this.baseUrl.includes('generativelanguage.googleapis.com')) {
      const response = await fetch(`${this.baseUrl}/models?key=${this.apiKey}`);
      if (!response.ok) return [];
      const data = (await response.json()) as any;
      return data.models?.map((m: any) => m.name.replace('models/', '')) || [];
    }

    try {
      const response = await fetch(`${this.baseUrl}/models`, {
        headers: { Authorization: `Bearer ${this.apiKey}` },
      });
      if (!response.ok) return [];
      const data = (await response.json()) as any;
      // OpenAI format: data is an array of objects with 'id'
      if (Array.isArray(data.data)) {
        return data.data.map((m: any) => m.id);
      }
      return [];
    } catch (err) {
      return [];
    }
  }
}
