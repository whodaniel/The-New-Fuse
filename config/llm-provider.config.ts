import { ConfigModule } from '@nestjs/config';

export const llmProviderConfig = ConfigModule.forRoot({
  load: [
    () => ({
      providers: {
        openai: {
          apiKey: process.env.OPENAI_API_KEY,
          model: process.env.OPENAI_MODEL || 'gpt-4',
          baseURL: process.env.OPENAI_BASE_URL,
        },
        anthropic: {
          apiKey: process.env.ANTHROPIC_API_KEY,
          model: process.env.ANTHROPIC_MODEL || 'claude-3-5-sonnet-20241022',
          baseURL: process.env.ANTHROPIC_BASE_URL,
          maxRetries: parseInt(process.env.ANTHROPIC_MAX_RETRIES || '3'),
          timeout: parseInt(process.env.ANTHROPIC_TIMEOUT || '600000'),
        },
        gemini: {
          apiKey: process.env.GEMINI_API_KEY || process.env.GOOGLE_AI_API_KEY,
          model: process.env.GEMINI_MODEL || 'gemini-2.0-flash-exp',
        },
        cohere: {
          apiKey: process.env.COHERE_API_KEY,
        },
        litellm: {
          apiKey: process.env.LITELLM_API_KEY,
          baseURL: process.env.LITELLM_BASE_URL || 'http://localhost:4000',
        },
      },
      encryption: {
        key: process.env.ENCRYPTION_KEY,
        algorithm: 'aes-256-cbc',
      },
      defaultProvider: process.env.DEFAULT_LLM_PROVIDER || 'openai',
    }),
  ],
  validationOptions: {
    allowUnknown: true,
  },
});

export interface LLMProviderConfig {
  providers: {
    [key: string]: {
      apiKey?: string;
      model?: string;
      baseURL?: string;
      maxRetries?: number;
      timeout?: number;
    };
  };
  encryption: {
    key?: string;
    algorithm: string;
  };
  defaultProvider: string;
}
