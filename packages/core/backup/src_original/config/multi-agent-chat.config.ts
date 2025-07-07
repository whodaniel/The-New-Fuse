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
      name: 'OpenAI GPT'
      endpoint: 'https://api.openai.com/v1/chat/completions'
      model: 'gpt-4'
      name: 'Anthropic Claude'
      endpoint: 'https://api.anthropic.com/v1/messages'
      model: 'claude-3-sonnet-20240229'
      name: 'Cohere'
      endpoint: 'https://api.cohere.com/v1/chat'
      model: 'command-r-plus'
      name: 'SambaNova'
      endpoint: 'https://api.sambanova.ai/v1/chat/completions'
      model: 'Meta-Llama-3.1-405B-Instruct'
      name: 'DeepSeek'
      endpoint: 'https://api.deepseek.ai/v1/chat/completions'
      model: 'deepseek-chat'
      name: 'Mistral'
      endpoint: 'https://api.mistral.ai/v1/chat/completions'
      model: 'mistral-large-latest'
      name: 'OpenRouter'
      endpoint: 'https://openrouter.ai/api/v1/chat/completions'
      model: 'meta-llama/llama-3.1-405b-instruct'
      name: 'Google Gemini'
      endpoint: 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent'
      model: 'gemini-2.0-flash'
  defaultProvider: 'gemini'