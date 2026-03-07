/**
 * VS Code LM Bridge Configuration
 */

module.exports = {
  // Server configuration
  server: {
    port: process.env.PORT || 8080,
    host: process.env.HOST || 'localhost',
    cors: {
      enabled: true,
      origin: '*'
    }
  },

  // API configuration
  api: {
    // Accept any API key (set to false for strict validation)
    acceptAllKeys: true,

    // Default accepted key
    defaultKey: 'vscode-lm-bridge-token',

    // Request timeout (ms)
    requestTimeout: 30000,

    // WebSocket timeout (ms)
    wsTimeout: 5000
  },

  // Model configuration
  models: {
    // Auto-refresh models from VS Code
    autoRefresh: true,

    // Refresh interval (ms) - only if autoRefresh is true
    refreshInterval: 60000,

    // Fallback models when VS Code is not connected
    fallback: [
      {
        id: 'gpt-4o',
        object: 'model',
        owned_by: 'vscode-copilot',
        family: 'gpt-4',
        vendor: 'openai',
        maxInputTokens: 8192,
        capabilities: { chat: true, streaming: true }
      },
      {
        id: 'gpt-4',
        object: 'model',
        owned_by: 'vscode-copilot',
        family: 'gpt-4',
        vendor: 'openai',
        maxInputTokens: 8192,
        capabilities: { chat: true, streaming: true }
      },
      {
        id: 'gpt-3.5-turbo',
        object: 'model',
        owned_by: 'vscode-copilot',
        family: 'gpt-3.5',
        vendor: 'openai',
        maxInputTokens: 4096,
        capabilities: { chat: true, streaming: true }
      },
      {
        id: 'claude-3-5-sonnet',
        object: 'model',
        owned_by: 'vscode-copilot',
        family: 'claude-3',
        vendor: 'anthropic',
        maxInputTokens: 8192,
        capabilities: { chat: true, streaming: true }
      },
      {
        id: 'claude-3-haiku',
        object: 'model',
        owned_by: 'vscode-copilot',
        family: 'claude-3',
        vendor: 'anthropic',
        maxInputTokens: 8192,
        capabilities: { chat: true, streaming: true }
      },
      {
        id: 'gemini-1.5-pro',
        object: 'model',
        owned_by: 'vscode-copilot',
        family: 'gemini',
        vendor: 'google',
        maxInputTokens: 8192,
        capabilities: { chat: true, streaming: true }
      }
    ]
  },

  // Streaming configuration
  streaming: {
    // Chunk delay (ms) for simulated streaming
    chunkDelay: 50,

    // Enable SSE compression
    compress: false
  },

  // Logging configuration
  logging: {
    enabled: process.env.NODE_ENV !== 'production',
    level: process.env.LOG_LEVEL || 'info',
    format: 'json'
  },

  // Health check configuration
  health: {
    // Include detailed model information
    includeModels: true,

    // Include connection status
    includeConnection: true
  },

  // WebSocket configuration
  websocket: {
    // Enable WebSocket server
    enabled: true,

    // Ping interval (ms)
    pingInterval: 30000,

    // Connection timeout (ms)
    connectionTimeout: 60000
  }
};
