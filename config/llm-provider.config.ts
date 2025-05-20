import { ConfigModule, ConfigService } from '@nestjs/config';

export const llmProviderConfig = ConfigModule.forRoot({
  load: [
    () => ({
      providers: {
        openai: {
          apiKey: process.env.OPENAI_API_KEY,
          model: process.env.OPENAI_MODEL || 'gpt-4'
        },
        anthropic: {
          apiKey: process.env.ANTHROPIC_API_KEY
        },
        cohere: {
          apiKey: process.env.COHERE_API_KEY
        }
      },
      encryption: {
        key: process.env.ENCRYPTION_KEY,
        algorithm: 'aes-256-cbc'
      },
      defaultProvider: process.env.DEFAULT_LLM_PROVIDER || 'openai'
    })
  ],
  validationOptions: {
    allowUnknown: true
  }
});

export interface LLMProviderConfig {
  providers: {
    [key: string]: {
      apiKey?: string;
      model?: string;
    };
  };
  encryption: {
    key?: string;
    algorithm: string;
  };
  defaultProvider: string;
}