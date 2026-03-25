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
    'google-adk': {
      apiKey: process.env.GOOGLE_ADK_API_KEY || process.env.ADK_GATEWAY_API_KEY,
      model: process.env.GOOGLE_ADK_MODEL || 'gemini-2.5-pro',
      baseURL:
        process.env.GOOGLE_ADK_BASE_URL || process.env.ADK_GATEWAY_URL || 'http://localhost:8089',
      gatewayApiKey: process.env.ADK_GATEWAY_API_KEY,
      maxTokens: parseInt(process.env.GOOGLE_ADK_MAX_TOKENS || '4000'),
      temperature: parseFloat(process.env.GOOGLE_ADK_TEMPERATURE || '0.7'),
      timeout: parseInt(process.env.GOOGLE_ADK_TIMEOUT || '120000'),
    },
    opencode: {
      apiKey: process.env.OPENCODE_API_KEY,
      model: process.env.OPENCODE_MODEL || 'anthropic/claude-sonnet-4-5',
      baseURL: process.env.OPENCODE_BASE_URL || 'http://localhost:4096',
      serverPassword: process.env.OPENCODE_SERVER_PASSWORD,
      maxTokens: parseInt(process.env.OPENCODE_MAX_TOKENS || '4000'),
      temperature: parseFloat(process.env.OPENCODE_TEMPERATURE || '0.7'),
    },
    'opencode-cli': {
      cliPath: process.env.OPENCODE_CLI_PATH || 'opencode',
      model: process.env.OPENCODE_CLI_MODEL || 'anthropic/claude-sonnet-4-5',
      maxTokens: parseInt(process.env.OPENCODE_CLI_MAX_TOKENS || '4000'),
      temperature: parseFloat(process.env.OPENCODE_CLI_TEMPERATURE || '0.7'),
    },
    minimax: {
      apiKey: process.env.MINIMAX_API_KEY,
      model: process.env.MINIMAX_MODEL || 'MiniMax-Text-01',
      groupId: process.env.MINIMAX_GROUP_ID,
      maxTokens: parseInt(process.env.MINIMAX_MAX_TOKENS || '8000'),
      temperature: parseFloat(process.env.MINIMAX_TEMPERATURE || '0.7'),
    },
  },
});
