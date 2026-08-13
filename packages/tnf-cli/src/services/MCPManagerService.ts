import { spawn, spawnSync } from 'child_process';
import { createHash } from 'crypto';
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';

export interface MCPServerConfig {
  name: string;
  type?: 'local' | 'remote' | 'sse' | 'ws';
  command: string;
  args?: string[];
  env?: Record<string, string>;
  environment?: Record<string, string>;
  cwd?: string;
  transport?: 'stdio' | 'sse' | 'ws';
  url?: string;
  enabled?: boolean;
  oauth?: {
    enabled: boolean;
    authorizeUrl?: string;
    tokenUrl?: string;
    scopes?: string[];
  };
}

export interface MCPServerStatus {
  name: string;
  type?: 'local' | 'remote' | 'sse' | 'ws';
  enabled: boolean;
  configured: boolean;
  running: boolean;
  pid?: number;
  port?: number;
  oauth?: {
    enabled: boolean;
    authenticated: boolean;
    expiry?: string;
  };
}

export interface MCPToolStatus {
  name: string;
  type?: 'local' | 'remote' | 'sse' | 'ws';
  enabled: boolean;
  configured: boolean;
  running: boolean;
}

export interface OAuthCredential {
  accessToken: string;
  refreshToken?: string;
  expiresAt?: number;
  scopes?: string[];
}

export class MCPManagerService {
  private configDir: string;
  private servers: Map<string, MCPServerConfig> = new Map();
  private processes: Map<string, { pid: number; process: ReturnType<typeof spawn> }> = new Map();
  private credentials: Map<string, OAuthCredential> = new Map();

  constructor(configDir?: string) {
    this.configDir = configDir || path.join(os.homedir(), '.config', 'tnf', 'mcp');
    this.loadConfig();
    this.loadCredentials();
  }

  static getRepoConfigPath(repoRoot: string): string {
    return path.join(repoRoot, 'data', 'mcp_config.json');
  }

  static getRepoConfigCandidates(repoRoot: string): string[] {
    return [
      MCPManagerService.getRepoConfigPath(repoRoot),
      path.join(repoRoot, 'tools', 'config-files', 'mcp_config.json'),
      path.join(repoRoot, 'tools', 'config-files', 'enhanced_mcp_config.json'),
    ];
  }

  static resolveRepoConfigPath(repoRoot: string): string {
    const configPath = MCPManagerService.getRepoConfigCandidates(repoRoot).find((candidate) =>
      fs.existsSync(candidate)
    );
    if (!configPath) {
      throw new Error(
        `Repo MCP config is missing. Run 'tnf onboard --repair' to create data/mcp_config.json.`
      );
    }
    return configPath;
  }

  static loadRepoServers(repoRoot: string): MCPServerConfig[] {
    const configPath = MCPManagerService.resolveRepoConfigPath(repoRoot);
    const raw = JSON.parse(fs.readFileSync(configPath, 'utf8'));
    const serversObj = raw.mcpServers || raw.servers || {};
    return Object.entries(serversObj).map(([name, serverConfig]) =>
      MCPManagerService.normalizeServerConfig(name, serverConfig)
    );
  }

  static normalizeServerConfig(name: string, serverConfig: any): MCPServerConfig {
    const commandValue = Array.isArray(serverConfig.command)
      ? serverConfig.command[0]
      : serverConfig.command;
    return {
      name,
      type: serverConfig.type || undefined,
      command: commandValue,
      args: Array.isArray(serverConfig.command) ? serverConfig.command.slice(1) : serverConfig.args,
      env: serverConfig.environment || serverConfig.env,
      environment: serverConfig.environment,
      cwd: serverConfig.cwd,
      transport: serverConfig.transport,
      url: serverConfig.url,
      enabled: serverConfig.enabled !== false && serverConfig.disabled !== true,
      oauth: serverConfig.oauth,
    };
  }

  private loadConfig(): void {
    const configPath = path.join(this.configDir, 'mcp.json');
    if (fs.existsSync(configPath)) {
      try {
        const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
        const serversObj = config.servers || config.mcpServers || {};
        for (const [name, serverConfig] of Object.entries(serversObj) as [string, any][]) {
          this.servers.set(name, MCPManagerService.normalizeServerConfig(name, serverConfig));
        }
      } catch {
        // Config doesn't exist or is invalid
      }
    }
  }

  private loadCredentials(): void {
    const credPath = path.join(this.configDir, 'credentials.json');
    if (fs.existsSync(credPath)) {
      try {
        const creds = JSON.parse(fs.readFileSync(credPath, 'utf8'));
        for (const [name, cred] of Object.entries(creds) as [string, OAuthCredential][]) {
          this.credentials.set(name, cred);
        }
      } catch {
        // Credentials don't exist or are invalid
      }
    }
  }

  private saveCredentials(): void {
    if (!fs.existsSync(this.configDir)) {
      fs.mkdirSync(this.configDir, { recursive: true });
    }
    const credPath = path.join(this.configDir, 'credentials.json');
    const credsObj: Record<string, OAuthCredential> = {};
    for (const [name, cred] of this.credentials) {
      credsObj[name] = cred;
    }
    fs.writeFileSync(credPath, JSON.stringify(credsObj, null, 2));
  }

  addServer(name: string, config: Omit<MCPServerConfig, 'name'>): void {
    const fullConfig: MCPServerConfig = { ...config, name };
    this.servers.set(name, fullConfig);
    this.saveConfig();
  }

  private saveConfig(): void {
    if (!fs.existsSync(this.configDir)) {
      fs.mkdirSync(this.configDir, { recursive: true });
    }
    const configPath = path.join(this.configDir, 'mcp.json');
    const serversObj: Record<string, any> = {};
    for (const [name, config] of this.servers) {
      const entry: Record<string, any> = {
        name: config.name,
        command: config.command,
      };
      if (config.type) entry.type = config.type;
      if (config.args && config.args.length > 0) entry.args = config.args;
      if (config.env) entry.env = config.env;
      if (config.environment) entry.environment = config.environment;
      if (config.cwd) entry.cwd = config.cwd;
      if (config.transport) entry.transport = config.transport;
      if (config.url) entry.url = config.url;
      if (config.enabled !== undefined) entry.enabled = config.enabled;
      if (config.oauth) entry.oauth = config.oauth;
      serversObj[name] = entry;
    }
    const data = JSON.stringify({ servers: serversObj }, null, 2);
    fs.writeFileSync(configPath, data);
  }

  syncFromRepo(repoRoot: string): { imported: number; configPath: string } {
    const repoServers = MCPManagerService.loadRepoServers(repoRoot);
    for (const server of repoServers) {
      this.servers.set(server.name, server);
    }
    this.saveConfig();
    return {
      imported: repoServers.length,
      configPath: MCPManagerService.resolveRepoConfigPath(repoRoot),
    };
  }

  removeServer(name: string): boolean {
    const existed = this.servers.delete(name);
    if (existed) {
      this.saveConfig();
      this.credentials.delete(name);
      this.saveCredentials();
    }
    return existed;
  }

  enableServer(name: string): boolean {
    const config = this.servers.get(name);
    if (!config) return false;
    config.enabled = true;
    this.saveConfig();
    return true;
  }

  disableServer(name: string): boolean {
    const config = this.servers.get(name);
    if (!config) return false;
    config.enabled = false;
    this.saveConfig();
    return true;
  }

  async listTools(enabledOnly = false): Promise<MCPToolStatus[]> {
    const tools = this.listServers().map((server) => ({
      name: server.name,
      type: server.type,
      enabled: server.enabled,
      configured: server.configured,
      running: server.running,
    }));
    return enabledOnly ? tools.filter((tool) => tool.enabled) : tools;
  }

  async enableTool(name: string): Promise<{ success: boolean; message: string }> {
    if (!this.servers.has(name)) {
      return { success: false, message: `MCP tool '${name}' not found` };
    }
    this.enableServer(name);
    return { success: true, message: `MCP tool '${name}' enabled` };
  }

  async disableTool(name: string): Promise<{ success: boolean; message: string }> {
    if (!this.servers.has(name)) {
      return { success: false, message: `MCP tool '${name}' not found` };
    }
    this.disableServer(name);
    return { success: true, message: `MCP tool '${name}' disabled` };
  }

  listServers(): MCPServerStatus[] {
    const statuses: MCPServerStatus[] = [];
    for (const [name, config] of this.servers) {
      const running = this.processes.has(name);
      const proc = this.processes.get(name);
      const cred = this.credentials.get(name);
      statuses.push({
        name,
        type: config.type,
        enabled: config.enabled !== false,
        configured: true,
        running,
        pid: proc?.pid,
        oauth: config.oauth
          ? {
              enabled: config.oauth.enabled,
              authenticated: !!cred && (!cred.expiresAt || cred.expiresAt > Date.now()),
              expiry: cred?.expiresAt ? new Date(cred.expiresAt).toISOString() : undefined,
            }
          : undefined,
      });
    }
    return statuses;
  }

  async startServer(name: string): Promise<{ pid: number }> {
    const config = this.servers.get(name);
    if (!config) {
      throw new Error(`MCP server '${name}' not found`);
    }

    if (config.enabled === false) {
      throw new Error(
        `MCP server '${name}' is disabled. Enable it in config or set enabled: true.`
      );
    }

    if (config.oauth?.enabled) {
      const cred = this.credentials.get(name);
      if (!cred || (cred.expiresAt && cred.expiresAt <= Date.now())) {
        throw new Error(
          `MCP server '${name}' requires authentication. Run 'tnf mcp auth ${name}' first.`
        );
      }
    }

    const mergedEnv = { ...process.env, ...config.env };
    const proc = spawn(config.command, config.args || [], {
      cwd: config.cwd,
      env: mergedEnv,
      stdio: ['pipe', 'pipe', 'pipe'],
      detached: true,
    });

    proc.unref();

    return new Promise((resolve, reject) => {
      proc.on('spawn', () => {
        this.processes.set(name, { pid: proc.pid!, process: proc });
        resolve({ pid: proc.pid! });
      });
      proc.on('error', (err) => {
        reject(err);
      });
    });
  }

  stopServer(name: string): boolean {
    const proc = this.processes.get(name);
    if (!proc) return false;

    try {
      process.kill(proc.pid, 'SIGTERM');
    } catch {
      // Process might already be dead
    }
    this.processes.delete(name);
    return true;
  }

  async authenticate(name: string): Promise<{ url: string; code?: string }> {
    const config = this.servers.get(name);
    if (!config) {
      throw new Error(`MCP server '${name}' not found`);
    }

    if (!config.oauth?.enabled) {
      throw new Error(`MCP server '${name}' does not support OAuth`);
    }

    const state = createHash('sha256').update(`${name}:${Date.now()}`).digest('hex').slice(0, 16);

    if (config.oauth.authorizeUrl) {
      const authorizeUrl = new URL(config.oauth.authorizeUrl);
      authorizeUrl.searchParams.set('state', state);
      authorizeUrl.searchParams.set('redirect_uri', 'http://127.0.0.1:8765/callback');
      if (config.oauth.scopes) {
        authorizeUrl.searchParams.set('scope', config.oauth.scopes.join(' '));
      }

      return { url: authorizeUrl.toString(), code: state };
    }

    throw new Error('OAuth configuration incomplete');
  }

  setCredentials(name: string, cred: OAuthCredential): void {
    this.credentials.set(name, cred);
    this.saveCredentials();
  }

  getCredentials(name: string): OAuthCredential | undefined {
    return this.credentials.get(name);
  }

  logout(name: string): boolean {
    const existed = this.credentials.delete(name);
    if (existed) {
      this.saveCredentials();
    }
    return existed;
  }

  async debugConnection(name: string): Promise<{
    server: MCPServerConfig | undefined;
    status: MCPServerStatus | undefined;
    credential: OAuthCredential | undefined;
    diagnostics: string[];
  }> {
    const config = this.servers.get(name);
    const status = this.listServers().find((s) => s.name === name);
    const credential = this.credentials.get(name);
    const diagnostics: string[] = [];

    if (!config) {
      diagnostics.push('Server not configured');
    } else {
      if (config.command) {
        try {
          const result = spawnSync('which', [config.command], { encoding: 'utf8' });
          if (result.status === 0) {
            diagnostics.push(`Command found at: ${result.stdout.trim()}`);
          } else {
            diagnostics.push(`Command not found: ${config.command}`);
          }
        } catch (e) {
          diagnostics.push(`Error checking command: ${(e as Error).message}`);
        }
      }

      if (config.cwd) {
        if (fs.existsSync(config.cwd)) {
          diagnostics.push(`Working directory exists: ${config.cwd}`);
        } else {
          diagnostics.push(`Working directory not found: ${config.cwd}`);
        }
      }

      if (config.oauth?.enabled) {
        if (credential) {
          if (credential.expiresAt && credential.expiresAt <= Date.now()) {
            diagnostics.push('OAuth token expired');
          } else {
            diagnostics.push('OAuth credentials present');
          }
        } else {
          diagnostics.push('OAuth credentials not found');
        }
      }
    }

    if (status?.running) {
      diagnostics.push(`Server running with PID: ${status.pid}`);
    } else {
      diagnostics.push('Server not running');
    }

    return {
      server: config,
      status,
      credential,
      diagnostics,
    };
  }
}
