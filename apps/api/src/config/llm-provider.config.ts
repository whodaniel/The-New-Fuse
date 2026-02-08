export default () => ({
  llm: {
    provider: process.env.LLM_PROVIDER || 'openai',
    openai: {
      apiKey: process.env.OPENAI_API_KEY,
      model: process.env.OPENAI_MODEL || 'gpt-4',
      maxTokens: parseInt(process.env.OPENAI_MAX_TOKENS || '4000'),
      temperature: parseFloat(process.env.OPENAI_TEMPERATURE || '0.7'),
    },
    anthropic: {
      apiKey: process.env.ANTHROPIC_API_KEY,
      model: process.env.ANTHROPIC_MODEL || 'claude-3-sonnet-20240229',
      maxTokens: parseInt(process.env.ANTHROPIC_MAX_TOKENS || '4000'),
      temperature: parseFloat(process.env.ANTHROPIC_TEMPERATURE || '0.7'),
    },
    sambanova: {
      apiKey: process.env.SAMBANOVA_API_KEY,
      model: process.env.SAMBANOVA_MODEL || 'llama3-405b-instruct',
      baseUrl: process.env.SAMBANOVA_BASE_URL || 'https://api.sambanova.ai/v1',
      maxTokens: parseInt(process.env.SAMBANOVA_MAX_TOKENS || '4000'),
      temperature: parseFloat(process.env.SAMBANOVA_TEMPERATURE || '0.7'),
    },
    openrouter: {
      apiKey: process.env.OPENROUTER_API_KEY,
      model: process.env.OPENROUTER_MODEL || 'qwen/qwen3-coder-next',
      baseUrl: process.env.OPENROUTER_BASE_URL || 'https://openrouter.ai/api/v1',
      maxTokens: parseInt(process.env.OPENROUTER_MAX_TOKENS || '4000'),
      temperature: parseFloat(process.env.OPENROUTER_TEMPERATURE || '0.7'),
    },
    siliconflow: {
      apiKey: process.env.SILICONFLOW_API_KEY,
      model: process.env.SILICONFLOW_MODEL || 'deepseek-ai/DeepSeek-V3',
      baseUrl: process.env.SILICONFLOW_BASE_URL || 'https://api.siliconflow.cn/v1',
      maxTokens: parseInt(process.env.SILICONFLOW_MAX_TOKENS || '4000'),
      temperature: parseFloat(process.env.SILICONFLOW_TEMPERATURE || '0.7'),
    },
  },
});
