// Multi-Agent Chat Configuration
export interface LLMProviderConfig {
  name: string;
  apiKey?: string;
  endpoint?: string;
  model?: string;
}

export interface MultiAgentChatConfig {
  providers: {
    openai: LLMProviderConfig;
    anthropic: LLMProviderConfig;
    cohere: LLMProviderConfig;
    sambanova: LLMProviderConfig;
    deepseek: LLMProviderConfig;
    mistral: LLMProviderConfig;
    openrouter: LLMProviderConfig;
    gemini: LLMProviderConfig;
  };
  firebase: {
    apiKey?: string;
    authDomain?: string;
    projectId?: string;
    storageBucket?: string;
    messagingSenderId?: string;
    appId?: string;
  };
  defaultProvider: string;
  maxConversationHistory: number;
  heartbeatInterval: number;
  imageGeneration: {
    enabled: boolean;
    defaultSize: { width: number; height: number };
    quality: number;
  };
}

export const defaultConfig: MultiAgentChatConfig = {
  providers: {
    openai: {
      name: "OpenAI GPT",
      apiKey: process.env.OPENAI_API_KEY,
      endpoint: "https://api.openai.com/v1/chat/completions",
      model: "gpt-4"
    },
    anthropic: {
      name: "Anthropic Claude",
      apiKey: process.env.ANTHROPIC_API_KEY,
      endpoint: "https://api.anthropic.com/v1/messages",
      model: "claude-3-sonnet-20240229"
    },
    cohere: {
      name: "Cohere",
      apiKey: process.env.COHERE_API_KEY,
      endpoint: "https://api.cohere.com/v1/chat",
      model: "command-r-plus"
    },
    sambanova: {
      name: "SambaNova",
      apiKey: process.env.SAMBANOVA_API_KEY,
      endpoint: "https://api.sambanova.ai/v1/chat/completions",
      model: "Meta-Llama-3.1-405B-Instruct"
    },
    deepseek: {
      name: "DeepSeek",
      apiKey: process.env.DEEPSEEK_API_KEY,
      endpoint: "https://api.deepseek.ai/v1/chat/completions",
      model: "deepseek-chat"
    },
    mistral: {
      name: "Mistral",
      apiKey: process.env.MISTRAL_API_KEY,
      endpoint: "https://api.mistral.ai/v1/chat/completions",
      model: "mistral-large-latest"
    },
    openrouter: {
      name: "OpenRouter",
      apiKey: process.env.OPENROUTER_API_KEY,
      endpoint: "https://openrouter.ai/api/v1/chat/completions",
      model: "meta-llama/llama-3.1-405b-instruct"
    },
    gemini: {
      name: "Google Gemini",
      apiKey: process.env.GEMINI_API_KEY,
      endpoint: "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent",
      model: "gemini-2.0-flash"
    }
  },
  firebase: {
    apiKey: process.env.FIREBASE_API_KEY,
    authDomain: process.env.FIREBASE_AUTH_DOMAIN,
    projectId: process.env.FIREBASE_PROJECT_ID,
    storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.FIREBASE_APP_ID
  },
  defaultProvider: "gemini",
  maxConversationHistory: 50,
  heartbeatInterval: 30000,
  imageGeneration: {
    enabled: true,
    defaultSize: { width: 256, height: 256 },
    quality: 0.7
  }
};
