import * as fs from 'fs';
import * as http from 'http';
import { emptyPluginConfigSchema } from 'openclaw/plugin-sdk';
import * as path from 'path';

const DEFAULT_BASE_URL = 'http://localhost:18790/v1';
const DEFAULT_API_KEY = 'none';
const DEFAULT_CONTEXT_WINDOW = 128_000;
const DEFAULT_MAX_TOKENS = 8192;
const PROXY_PORT = 18790;

// Context cache to avoid repeated file reads
let codebaseContextCache: string | null = null;
let openclawContextCache: string | null = null;

/**
 * Gather codebase context by reading key files and structure
 */
function gatherCodebaseContext(): string {
  if (codebaseContextCache) {
    return codebaseContextCache;
  }

  const workspaceDir = process.cwd();
  const context: string[] = [];

  context.push('## CODEBASE CONTEXT\n');
  context.push(`Workspace: ${workspaceDir}\n`);

  // Read package.json for project info
  try {
    const packageJsonPath = path.join(workspaceDir, 'package.json');
    if (fs.existsSync(packageJsonPath)) {
      const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf-8'));
      context.push('### Project Information\n');
      context.push(`Name: ${packageJson.name || 'Unknown'}\n`);
      context.push(`Version: ${packageJson.version || 'Unknown'}\n`);
      context.push(`Description: ${packageJson.description || 'N/A'}\n`);
      context.push('\n');
    }
  } catch (error) {
    // Ignore errors reading package.json
  }

  // Read .kilocoderules for project-specific rules
  try {
    const kilocoderulesPath = path.join(workspaceDir, '.kilocoderules');
    if (fs.existsSync(kilocoderulesPath)) {
      const rules = fs.readFileSync(kilocoderulesPath, 'utf-8');
      context.push('### Project Rules (.kilocoderules)\n');
      context.push('```\n');
      context.push(rules.substring(0, 5000)); // Limit to 5000 chars
      context.push('\n```\n\n');
    }
  } catch (error) {
    // Ignore errors reading .kilocoderules
  }

  // Get directory structure
  context.push('### Directory Structure\n');
  try {
    function getDirectoryStructure(dir: string, depth: number = 0, maxDepth: number = 3): string {
      if (depth > maxDepth) return '';

      let result = '';
      const items = fs.readdirSync(dir, { withFileTypes: true });

      for (const item of items) {
        if (item.name.startsWith('.') || item.name === 'node_modules') continue;

        const indent = '  '.repeat(depth);
        if (item.isDirectory()) {
          result += `${indent}${item.name}/\n`;
          result += getDirectoryStructure(path.join(dir, item.name), depth + 1, maxDepth);
        } else {
          result += `${indent}${item.name}\n`;
        }
      }

      return result;
    }

    const structure = getDirectoryStructure(workspaceDir);
    context.push('```\n');
    context.push(structure.substring(0, 3000)); // Limit to 3000 chars
    context.push('\n```\n\n');
  } catch (error) {
    context.push('(Unable to read directory structure)\n\n');
  }

  // Read key documentation files
  const docFiles = ['README.md', 'docs/README.md', 'docs/architecture/README.md'];

  context.push('### Key Documentation\n');
  for (const docFile of docFiles) {
    try {
      const docPath = path.join(workspaceDir, docFile);
      if (fs.existsSync(docPath)) {
        const docContent = fs.readFileSync(docPath, 'utf-8');
        context.push(`#### ${docFile}\n`);
        context.push('```\n');
        context.push(docContent.substring(0, 2000)); // Limit to 2000 chars per doc
        context.push('\n```\n\n');
      }
    } catch (error) {
      // Ignore errors reading docs
    }
  }

  codebaseContextCache = context.join('');
  return codebaseContextCache;
}

/**
 * Gather OpenClaw protocol context from documentation
 */
function gatherOpenclawContext(): string {
  if (openclawContextCache) {
    return openclawContextCache;
  }

  const workspaceDir = process.cwd();
  const context: string[] = [];

  context.push('## OPENCLAW PROTOCOL CONTEXT\n');

  // Read OpenClaw protocol documentation
  const docFiles = [
    'docs/architecture/OPENCLAW_PROTOCOL_DEEP_DIVE.md',
    'docs/integrations/KILOCODE_INTEGRATION.md',
  ];

  for (const docFile of docFiles) {
    try {
      const docPath = path.join(workspaceDir, docFile);
      if (fs.existsSync(docPath)) {
        const docContent = fs.readFileSync(docPath, 'utf-8');
        context.push(`### ${docFile}\n`);
        context.push('```\n');
        context.push(docContent.substring(0, 3000)); // Limit to 3000 chars per doc
        context.push('\n```\n\n');
      }
    } catch (error) {
      // Ignore errors reading docs
    }
  }

  // Add key OpenClaw concepts
  context.push('### Key OpenClaw Concepts\n');
  context.push(`
- **Model Provider System**: OpenClaw uses a plugin-based provider system where each provider (like Kilo Code) registers available models
- **Authentication Profiles**: Multi-profile credential management with automatic failover
- **Plugin API**: Plugins can register tools, hooks, HTTP routes, channels, and providers
- **Model Resolution**: Models are referenced as \`provider/model\` (e.g., \`kilocode/glm-4.7-free\`)
- **Gateway**: HTTP/WebSocket gateway for agent communication
- **Channels**: Integration points for external platforms (Telegram, Discord, etc.)
- **Agent Configuration**: Each agent can have its own model preferences, tool access, and settings
- **Message Protocol**: OpenClaw uses a structured message format with roles (system, user, assistant, tool)
- **Streaming Support**: OpenClaw expects streaming responses via Server-Sent Events (SSE)
- **Tool Calling**: Agents can call tools/functions during conversations
- **Thinking Mode**: Extended reasoning mode for complex tasks
`);

  openclawContextCache = context.join('');
  return openclawContextCache;
}

/**
 * Build the enhanced system prompt with context
 */
function buildSystemPrompt(originalSystem?: string): string {
  const codebaseContext = gatherCodebaseContext();
  const openclawContext = gatherOpenclawContext();

  let systemPrompt = '';

  // Add original system message if present
  if (originalSystem && originalSystem.trim()) {
    systemPrompt += `${originalSystem}\n\n`;
  }

  // Add context sections
  systemPrompt += '---\n\n';
  systemPrompt += codebaseContext;
  systemPrompt += '\n---\n\n';
  systemPrompt += openclawContext;
  systemPrompt += '\n---\n\n';

  // Add instructions for using the context
  systemPrompt += `### Instructions for Using Context

You have been provided with:
1. **Codebase Context**: Information about the project structure, rules, and documentation
2. **OpenClaw Protocol Context**: Documentation about the OpenClaw agent framework

When responding to user queries:
- Reference the codebase structure when discussing files or components
- Follow the project rules defined in .kilocoderules
- Use the OpenClaw protocol knowledge when discussing agent communication or configuration
- Be aware of the project's technology stack and architecture patterns
- If you need to reference specific files, use the directory structure provided

The context above should help you provide more accurate and relevant responses about this project.
`;

  return systemPrompt;
}

/**
 * Clean messages for free tier compatibility
 */
function cleanMessages(messages: any[]): any[] {
  const cleaned: any[] = [];

  for (const msg of messages) {
    // Skip empty messages
    if (!msg || (!msg.content && !msg.tool_calls)) {
      continue;
    }

    const cleanedMsg: any = {
      role: msg.role,
    };

    // Handle content
    if (msg.content) {
      if (Array.isArray(msg.content)) {
        // Convert multi-part content to plain string
        cleanedMsg.content = msg.content
          .map((part: any) => {
            if (typeof part === 'string') return part;
            if (part.type === 'text') return part.text;
            if (part.type === 'image_url') return '[Image]';
            return '';
          })
          .join('\n');
      } else {
        cleanedMsg.content = msg.content;
      }
    }

    // Handle tool calls
    if (msg.tool_calls && msg.tool_calls.length > 0) {
      cleanedMsg.tool_calls = msg.tool_calls;
    }

    // Map tool role to user (free tier doesn't support tool role)
    if (cleanedMsg.role === 'tool') {
      cleanedMsg.role = 'user';
    }

    cleaned.push(cleanedMsg);
  }

  return cleaned;
}

/**
 * Inject context into messages
 */
function injectContext(messages: any[]): any[] {
  if (messages.length === 0) {
    return messages;
  }

  // Find or create system message
  let systemIndex = messages.findIndex((msg) => msg.role === 'system');

  if (systemIndex === -1) {
    // No system message, insert at beginning
    const enhancedSystem = buildSystemPrompt();
    return [{ role: 'system', content: enhancedSystem }, ...messages];
  }

  // Enhance existing system message
  const originalSystem = messages[systemIndex].content;
  const enhancedSystem = buildSystemPrompt(originalSystem);

  const result = [...messages];
  result[systemIndex] = { role: 'system', content: enhancedSystem };

  return result;
}

/**
 * Create the proxy server
 */
function createProxyServer(api: any): http.Server {
  const server = http.createServer(async (req, res) => {
    // Only handle POST requests to /v1/chat/completions
    if (req.method !== 'POST' || !req.url?.startsWith('/v1/chat/completions')) {
      res.writeHead(404);
      res.end('Not Found');
      return;
    }

    let body = '';
    req.on('data', (chunk) => {
      body += chunk.toString();
    });

    req.on('end', async () => {
      try {
        const requestBody = JSON.parse(body);
        const { messages, model, stream, ...otherParams } = requestBody;

        // Inject context into messages
        const messagesWithContext = injectContext(messages);

        // Clean messages for free tier compatibility
        const cleanedMessages = cleanMessages(messagesWithContext);

        // Strip provider prefix from model ID
        const cleanModel = model?.replace(/^kilocode\//, '') || 'minimax-m2.1-free';

        // Prepare request to Kilo Code API
        const apiRequestBody = {
          model: cleanModel,
          messages: cleanedMessages,
          stream: false, // Always use non-streaming for free tier
          ...otherParams,
        };

        // Forward to Kilo Code API
        api.logger.info(`Forwarding request to Kilo Code: ${cleanModel}`);
        const apiResponse = await fetch('https://opencode.ai/zen/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            // Strip Authorization header for free tier
          },
          body: JSON.stringify(apiRequestBody),
        });

        if (!apiResponse.ok) {
          const errorText = await apiResponse.text();
          api.logger.error(`Kilo Code API error: ${apiResponse.status}`, { error: errorText });
          res.writeHead(apiResponse.status);
          res.end(JSON.stringify({ error: errorText }));
          return;
        }

        const apiData = await apiResponse.json();

        // Handle response with reasoning_content
        let responseData = apiData;
        if (apiData.choices && apiData.choices[0]) {
          const choice = apiData.choices[0];

          // Merge reasoning_content into content if present
          if (choice.message?.reasoning_content) {
            const reasoning = choice.message.reasoning_content;
            const content = choice.message.content || '';

            choice.message.content = `<thinking>\n${reasoning}\n</thinking>\n\n${content}`;
            delete choice.message.reasoning_content;
          }
        }

        // Handle streaming if requested
        if (stream) {
          res.writeHead(200, {
            'Content-Type': 'text/event-stream',
            'Cache-Control': 'no-cache',
            Connection: 'keep-alive',
          });

          // Fake streaming: send single chunk with full response
          const chunk = JSON.stringify(responseData);
          res.write(`data: ${chunk}\n\n`);
          res.write('data: [DONE]\n\n');
          res.end();
        } else {
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify(responseData));
        }
      } catch (error) {
        api.logger.error('Proxy error', {
          error: error instanceof Error ? error.message : String(error),
        });
        res.writeHead(500);
        res.end(JSON.stringify({ error: 'Internal server error' }));
      }
    });
  });

  return server;
}

const kilocodeAuthPlugin = {
  id: 'kilocode-auth',
  name: 'Kilo Code Auth',
  description: 'Kilo Code free tier provider with context injection',
  configSchema: emptyPluginConfigSchema(),
  register(api: any) {
    // Start the proxy server
    const server = createProxyServer(api);

    server.listen(PROXY_PORT, () => {
      api.logger.info(`Kilo Code proxy server listening on port ${PROXY_PORT}`);
    });

    server.on('error', (error: any) => {
      if (error.code === 'EADDRINUSE') {
        api.logger.warn(`Port ${PROXY_PORT} already in use, assuming proxy is already running`);
      } else {
        api.logger.error('Proxy server error', { error: error.message });
      }
    });

    // Register the provider
    api.registerProvider({
      id: 'kilocode',
      label: 'Kilo Code (Free)',
      docsPath: '/providers/models',
      auth: [
        {
          id: 'free',
          label: 'Free Access',
          hint: 'No authentication required for Kilo Code free tier',
          kind: 'custom',
          run: async () => {
            return {
              profiles: [
                {
                  profileId: 'kilocode:free',
                  credential: {
                    type: 'token',
                    provider: 'kilocode',
                    token: 'none',
                  },
                },
              ],
              configPatch: {
                models: {
                  providers: {
                    kilocode: {
                      baseUrl: DEFAULT_BASE_URL,
                      apiKey: DEFAULT_API_KEY,
                      api: 'openai-completions',
                      authHeader: false,
                      models: [
                        {
                          id: 'minimax-m2.1-free',
                          name: 'MiniMax-M2.1 (Free)',
                          reasoning: true,
                          input: ['text'],
                          cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
                          contextWindow: DEFAULT_CONTEXT_WINDOW,
                          maxTokens: DEFAULT_MAX_TOKENS,
                        },
                        {
                          id: 'glm-4.7-free',
                          name: 'GLM-4.7 (Free)',
                          reasoning: true,
                          input: ['text'],
                          cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
                          contextWindow: DEFAULT_CONTEXT_WINDOW,
                          maxTokens: DEFAULT_MAX_TOKENS,
                        },
                      ],
                    },
                  },
                },
                agents: {
                  defaults: {
                    models: {
                      'kilocode/glm-4.7-free': {},
                      'kilocode/minimax-m2.1-free': {},
                    },
                  },
                },
              },
              defaultModel: 'kilocode/minimax-m2.1-free',
              notes: [
                'Kilo Code free tier models with automatic context injection',
                'Codebase context and OpenClaw protocol context are automatically added to system prompt',
                'No authentication required',
                'Proxy server runs on port 18789',
              ],
            };
          },
        },
      ],
    });
  },
};

export default kilocodeAuthPlugin;
