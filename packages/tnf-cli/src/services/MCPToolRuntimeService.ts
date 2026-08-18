import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { SSEClientTransport } from '@modelcontextprotocol/sdk/client/sse.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';
import { StreamableHTTPClientTransport } from '@modelcontextprotocol/sdk/client/streamableHttp.js';
import { WebSocketClientTransport } from '@modelcontextprotocol/sdk/client/websocket.js';
import type { Transport } from '@modelcontextprotocol/sdk/shared/transport.js';

import {
  MCPManagerService,
  type MCPServerConfig,
  type OAuthCredential,
} from './MCPManagerService.js';

export interface MCPRuntimeTool {
  name: string;
  description?: string;
  inputSchema?: Record<string, unknown>;
}

export interface MCPServerToolList {
  server: string;
  ok: boolean;
  tools: MCPRuntimeTool[];
  error?: string;
}

export interface MCPCallResult {
  server: string;
  tool: string;
  ok: boolean;
  result?: unknown;
  error?: string;
}

export class MCPToolRuntimeService {
  constructor(
    private readonly repoRoot = process.cwd(),
    private readonly manager = new MCPManagerService()
  ) {}

  async listTools(serverName?: string, timeoutMs = 15_000): Promise<MCPServerToolList[]> {
    const configs = serverName
      ? [this.manager.getServerConfig(serverName)].filter(Boolean)
      : this.manager.getServerConfigs(true);

    if (serverName && configs.length === 0) {
      return [
        { server: serverName, ok: false, tools: [], error: `MCP server '${serverName}' not found` },
      ];
    }

    const results: MCPServerToolList[] = [];
    for (const config of configs as MCPServerConfig[]) {
      try {
        const data = await this.withClient(config, timeoutMs, (client) =>
          client.listTools({}, { timeout: timeoutMs })
        );
        results.push({ server: config.name, ok: true, tools: normalizeToolsList(data) });
      } catch (err: any) {
        results.push({
          server: config.name,
          ok: false,
          tools: [],
          error: formatMcpRuntimeError(config, err),
        });
      }
    }
    return results;
  }

  async callTool(
    serverName: string,
    tool: string,
    args: Record<string, unknown> = {},
    timeoutMs = 30_000
  ): Promise<MCPCallResult> {
    const config = this.manager.getServerConfig(serverName);
    if (!config) {
      return { server: serverName, tool, ok: false, error: `MCP server '${serverName}' not found` };
    }
    if (!tool) {
      return { server: serverName, tool, ok: false, error: 'MCP tool name is required' };
    }

    try {
      const result = await this.withClient(config, timeoutMs, (client) =>
        client.callTool({ name: tool, arguments: args ?? {} }, undefined, { timeout: timeoutMs })
      );
      return { server: serverName, tool, ok: true, result };
    } catch (err: any) {
      return {
        server: serverName,
        tool,
        ok: false,
        error: formatMcpRuntimeError(config, err),
      };
    }
  }

  private async withClient<T>(
    config: MCPServerConfig,
    timeoutMs: number,
    fn: (client: Client) => Promise<T>
  ): Promise<T> {
    if (config.enabled === false) {
      throw new Error(`MCP server '${config.name}' is disabled`);
    }

    const client = new Client(
      { name: 'tnf-cli-mcp-runtime', version: '1.0.0' },
      { capabilities: {} }
    );
    const transport = createTransport(
      config,
      this.repoRoot,
      this.manager.getCredentials(config.name)
    );
    try {
      await client.connect(transport, { timeout: timeoutMs });
      return await fn(client);
    } finally {
      await client.close().catch(() => {});
    }
  }
}

function createTransport(
  config: MCPServerConfig,
  repoRoot: string,
  credential: OAuthCredential | undefined
): Transport {
  const url = String((config as any).url || '');
  const transport = String(config.transport || config.type || '').toLowerCase();
  const headers = buildHeaders(config, credential);

  if (url.startsWith('ws://') || url.startsWith('wss://') || transport === 'ws') {
    if (!url) throw new Error(`MCP server '${config.name}' has no WebSocket URL`);
    return new WebSocketClientTransport(new URL(url));
  }

  if (
    url.startsWith('http://') ||
    url.startsWith('https://') ||
    transport === 'remote' ||
    transport === 'streamable-http' ||
    transport === 'sse'
  ) {
    if (!url) throw new Error(`MCP server '${config.name}' has no HTTP/SSE URL`);
    if (transport === 'sse' || config.type === 'sse') {
      return new SSEClientTransport(new URL(url), {
        eventSourceInit: { headers } as any,
        requestInit: { headers },
      });
    }
    return new StreamableHTTPClientTransport(new URL(url), {
      requestInit: { headers },
    });
  }

  if (!config.command) throw new Error(`MCP server '${config.name}' has no command or URL`);
  return new StdioClientTransport({
    command: config.command,
    args: config.args || [],
    cwd: config.cwd || repoRoot,
    env: compactEnv({ ...process.env, ...config.env, ...config.environment }),
    stderr: 'pipe',
  });
}

function buildHeaders(
  config: MCPServerConfig,
  credential: OAuthCredential | undefined
): Record<string, string> {
  const headers = normalizeHeaderConfig((config as any).headers);
  const token = resolveBearerToken(config, credential);
  if (token && !headers.Authorization && !headers.authorization) {
    headers.Authorization = `Bearer ${token}`;
  }
  return headers;
}

function normalizeToolsList(value: unknown): MCPRuntimeTool[] {
  const tools = value && typeof value === 'object' ? (value as any).tools : undefined;
  if (!Array.isArray(tools)) return [];
  return tools
    .filter((tool) => tool && typeof tool === 'object' && typeof tool.name === 'string')
    .map((tool) => ({
      name: tool.name,
      description: typeof tool.description === 'string' ? tool.description : undefined,
      inputSchema:
        tool.inputSchema && typeof tool.inputSchema === 'object' ? tool.inputSchema : undefined,
    }));
}

function normalizeHeaderConfig(raw: unknown): Record<string, string> {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return {};
  const headers: Record<string, string> = {};
  for (const [key, value] of Object.entries(raw as Record<string, unknown>)) {
    if (key && value !== undefined && value !== null) headers[key] = String(value);
  }
  return headers;
}

function resolveBearerToken(
  config: MCPServerConfig,
  credential: OAuthCredential | undefined
): string | undefined {
  if (credential?.accessToken) return credential.accessToken;
  const anyConfig = config as any;
  if (typeof anyConfig.bearerToken === 'string' && anyConfig.bearerToken) return anyConfig.bearerToken;
  const envName =
    anyConfig.bearerTokenEnv ||
    anyConfig.tokenEnv ||
    anyConfig.accessTokenEnv ||
    config.env?.MCP_BEARER_TOKEN_ENV ||
    config.environment?.MCP_BEARER_TOKEN_ENV;
  if (typeof envName === 'string' && envName && process.env[envName]) return process.env[envName];
  return (
    config.env?.MCP_BEARER_TOKEN ||
    config.environment?.MCP_BEARER_TOKEN ||
    config.env?.AUTH_TOKEN ||
    config.environment?.AUTH_TOKEN
  );
}

function compactEnv(env: NodeJS.ProcessEnv): Record<string, string> {
  const compacted: Record<string, string> = {};
  for (const [key, value] of Object.entries(env)) {
    if (typeof value === 'string') compacted[key] = value;
  }
  return compacted;
}

function formatMcpRuntimeError(config: MCPServerConfig, err: unknown): string {
  const message = err instanceof Error ? err.message : String(err);
  if (/unauthori[sz]ed|forbidden|401|403/i.test(message)) {
    return `${message}; configure auth for '${config.name}' with tnf mcp auth, --bearer-token-env, or --header`;
  }
  return message;
}
