export const PROVIDER_MODELS: Record<string, string[]> = {
  openai: ['gpt-5.2', 'gpt-5.1-codex-max', 'gpt-4o', 'gpt-4o-mini', 'o1', 'o1-mini'],
  anthropic: ['claude-opus-4.5-20251124', 'claude-sonnet-4.5-20251124', 'claude-3-5-sonnet-20241022'],
  gemini: ['gemini-3-pro', 'gemini-2.5-flash', 'gemini-1.5-pro', 'gemini-1.5-flash'],
  deepseek: ['deepseek-v3.2-speciale', 'deepseek-r1', 'deepseek-chat', 'deepseek-coder'],
  qwen: ['qwen3-coder-480b', 'qwen-2.5-max', 'qwen-2.5-coder-32b', 'qwen-turbo'],
  openrouter: ['anthropic/claude-opus-4.5', 'openai/gpt-5.2', 'google/gemini-3-pro'],
  litellm: ['gpt-5.2', 'claude-opus-4.5', 'gemini-3-pro', 'custom-model'],
  copilot: ['gpt-4o', 'gpt-4o-mini', 'claude-sonnet-4.5'],
};

export const DEFAULT_MODEL_FALLBACKS = ['gpt-5.2', 'claude-opus-4.5'];
