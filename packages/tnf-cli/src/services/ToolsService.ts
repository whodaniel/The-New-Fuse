import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';

export interface ToolsetConfig {
  name: string;
  description: string;
  enabled: boolean;
  platforms: string[];
  category: string;
  mcpServer?: string;
  source?: 'builtin' | 'mcp-config' | 'user';
}

export class ToolsService {
  private readonly configPath: string;
  private readonly projectRoot: string;

  constructor() {
    const tnfDir = path.join(os.homedir(), '.tnf');
    fs.mkdirSync(tnfDir, { recursive: true });
    this.configPath = path.join(tnfDir, 'toolsets.json');
    // Resolve project root: walk up from this file to find package.json with "name" containing "tnf"
    this.projectRoot = this.resolveProjectRoot();
  }

  private resolveProjectRoot(): string {
    // Try common locations
    const candidates = [
      process.cwd(),
      path.join(process.cwd(), '..', '..'),
      path.join(os.homedir(), 'Desktop', 'A1-Inter-LLM-Com', 'The-New-Fuse'),
    ];
    for (const candidate of candidates) {
      if (
        fs.existsSync(path.join(candidate, 'tnf')) ||
        fs.existsSync(path.join(candidate, 'packages', 'tnf-cli'))
      ) {
        return candidate;
      }
    }
    return process.cwd();
  }

  async getToolsets(): Promise<ToolsetConfig[]> {
    // Merge persisted user config with live-discovered MCP tools
    const userToolsets = this.loadUserToolsets();
    const mcpToolsets = this.discoverMCPTools();

    // Merge: user config wins for existing entries, MCP adds new ones
    const merged = [...userToolsets];
    for (const mcp of mcpToolsets) {
      if (!merged.find((t) => t.name === mcp.name)) {
        merged.push(mcp);
      }
    }
    return merged;
  }

  private loadUserToolsets(): ToolsetConfig[] {
    if (!fs.existsSync(this.configPath)) {
      return this.getBuiltinToolsets();
    }
    try {
      const data = fs.readFileSync(this.configPath, 'utf8');
      return JSON.parse(data);
    } catch {
      return this.getBuiltinToolsets();
    }
  }

  /**
   * Discover real MCP servers from project configuration files.
   * Reads data/mcp_config.json and tools/config-files/mcp_config.json.
   */
  discoverMCPTools(): ToolsetConfig[] {
    const discovered: ToolsetConfig[] = [];
    const mcpConfigPaths = [
      path.join(this.projectRoot, 'data', 'mcp_config.json'),
      path.join(this.projectRoot, 'tools', 'config-files', 'mcp_config.json'),
      path.join(this.projectRoot, 'tools', 'config-files', 'enhanced_mcp_config.json'),
    ];

    for (const configPath of mcpConfigPaths) {
      if (!fs.existsSync(configPath)) continue;
      try {
        const raw = JSON.parse(fs.readFileSync(configPath, 'utf8'));
        const servers = raw.mcpServers || raw.servers || raw;
        if (typeof servers !== 'object') continue;

        for (const [serverName, serverConfig] of Object.entries(servers)) {
          const config = serverConfig as Record<string, any>;
          if (discovered.find((d) => d.name === `mcp:${serverName}`)) continue;

          discovered.push({
            name: `mcp:${serverName}`,
            description: config.description || `MCP server: ${serverName}`,
            enabled: true,
            platforms: ['cli'],
            category: 'mcp',
            mcpServer: serverName,
            source: 'mcp-config',
          });
        }
      } catch {
        // Skip unparseable configs
      }
    }

    return discovered;
  }

  async saveToolsets(toolsets: ToolsetConfig[]): Promise<void> {
    fs.writeFileSync(this.configPath, JSON.stringify(toolsets, null, 2));
  }

  async enableToolset(name: string): Promise<ToolsetConfig> {
    const toolsets = await this.getToolsets();
    const toolset = toolsets.find((t) => t.name === name);

    if (!toolset) {
      throw new Error(`Toolset not found: ${name}`);
    }

    toolset.enabled = true;
    await this.saveToolsets(toolsets);
    return toolset;
  }

  async disableToolset(name: string): Promise<ToolsetConfig> {
    const toolsets = await this.getToolsets();
    const toolset = toolsets.find((t) => t.name === name);

    if (!toolset) {
      throw new Error(`Toolset not found: ${name}`);
    }

    toolset.enabled = false;
    await this.saveToolsets(toolsets);
    return toolset;
  }

  async getEnabledToolsets(platform?: string): Promise<ToolsetConfig[]> {
    const toolsets = await this.getToolsets();
    if (platform) {
      return toolsets.filter((t) => t.enabled && t.platforms.includes(platform));
    }
    return toolsets.filter((t) => t.enabled);
  }

  private getBuiltinToolsets(): ToolsetConfig[] {
    return [
      {
        name: 'web',
        description: 'Web search and scraping',
        enabled: true,
        platforms: ['cli', 'telegram', 'discord'],
        category: 'core',
        source: 'builtin',
      },
      {
        name: 'terminal',
        description: 'Terminal command execution',
        enabled: true,
        platforms: ['cli'],
        category: 'core',
        source: 'builtin',
      },
      {
        name: 'file',
        description: 'File read/write operations',
        enabled: true,
        platforms: ['cli', 'telegram', 'discord'],
        category: 'core',
        source: 'builtin',
      },
      {
        name: 'browser',
        description: 'Browser automation via webpilot',
        enabled: true,
        platforms: ['cli'],
        category: 'core',
        source: 'builtin',
      },
      {
        name: 'mcp',
        description: 'MCP server tools (aggregate)',
        enabled: true,
        platforms: ['cli'],
        category: 'core',
        source: 'builtin',
      },
      {
        name: 'memory',
        description: 'Memory and fact store',
        enabled: true,
        platforms: ['cli', 'telegram', 'discord'],
        category: 'core',
        source: 'builtin',
      },
      {
        name: 'relay',
        description: 'TNF Relay messaging',
        enabled: true,
        platforms: ['cli'],
        category: 'core',
        source: 'builtin',
      },
      {
        name: 'kanban',
        description: 'Kanban board operations',
        enabled: true,
        platforms: ['cli'],
        category: 'productivity',
        source: 'builtin',
      },
      {
        name: 'github',
        description: 'GitHub operations via gh CLI',
        enabled: true,
        platforms: ['cli'],
        category: 'dev',
        source: 'builtin',
      },
      {
        name: 'canvas',
        description: 'Canvas / image operations',
        enabled: false,
        platforms: ['cli'],
        category: 'media',
        source: 'builtin',
      },
      {
        name: 'discord',
        description: 'Discord bot integration',
        enabled: false,
        platforms: ['cli'],
        category: 'platform',
        source: 'builtin',
      },
      {
        name: 'slack',
        description: 'Slack integration',
        enabled: false,
        platforms: ['cli'],
        category: 'platform',
        source: 'builtin',
      },
      {
        name: 'telegram',
        description: 'Telegram bot',
        enabled: false,
        platforms: ['cli'],
        category: 'platform',
        source: 'builtin',
      },
      {
        name: 'tts',
        description: 'Text-to-speech',
        enabled: false,
        platforms: ['cli'],
        category: 'media',
        source: 'builtin',
      },
      {
        name: 'youtube',
        description: 'YouTube download/tools',
        enabled: false,
        platforms: ['cli'],
        category: 'media',
        source: 'builtin',
      },
    ];
  }
}
