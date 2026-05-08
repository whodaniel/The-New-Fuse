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
}

export class ToolsService {
  private readonly configPath: string;
  private readonly hermesConfigPath: string;

  constructor() {
    const tnfDir = path.join(os.homedir(), '.tnf');
    this.configPath = path.join(tnfDir, 'toolsets.json');
    this.hermesConfigPath = path.join(os.homedir(), '.hermes', 'config.yaml');
  }

  async getToolsets(): Promise<ToolsetConfig[]> {
    if (!fs.existsSync(this.configPath)) {
      return this.getDefaultToolsets();
    }

    try {
      const data = fs.readFileSync(this.configPath, 'utf8');
      return JSON.parse(data);
    } catch {
      return this.getDefaultToolsets();
    }
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

  async syncWithHermes(): Promise<void> {
    // Read Hermes config and sync toolset state
    if (!fs.existsSync(this.hermesConfigPath)) {
      return;
    }

    // This is a placeholder for actual Hermes config parsing
    // In production, this would parse config.yaml and sync states
    console.log('Syncing with Hermes configuration...');
  }

  private getDefaultToolsets(): ToolsetConfig[] {
    return [
      { name: 'web', description: 'Web search and scraping', enabled: true, platforms: ['cli', 'telegram', 'discord'], category: 'core' },
      { name: 'terminal', description: 'Terminal command execution', enabled: true, platforms: ['cli'], category: 'core' },
      { name: 'file', description: 'File read/write operations', enabled: true, platforms: ['cli', 'telegram', 'discord'], category: 'core' },
      { name: 'browser', description: 'Browser automation via webpilot', enabled: true, platforms: ['cli'], category: 'core' },
      { name: 'mcp', description: 'MCP server tools', enabled: true, platforms: ['cli'], category: 'core' },
      { name: 'memory', description: 'Memory and fact store', enabled: true, platforms: ['cli', 'telegram', 'discord'], category: 'core' },
      { name: 'canvas', description: 'Canvas / image operations', enabled: false, platforms: ['cli'], category: 'media' },
      { name: 'discord', description: 'Discord bot integration', enabled: false, platforms: ['cli'], category: 'platform' },
      { name: 'feishu', description: 'Feishu (Lark) integration', enabled: false, platforms: ['cli'], category: 'platform' },
      { name: 'github', description: 'GitHub operations', enabled: false, platforms: ['cli'], category: 'dev' },
      { name: 'homeassistant', description: 'Home Assistant controls', enabled: false, platforms: ['cli'], category: 'iot' },
      { name: 'image_gen', description: 'Image generation', enabled: false, platforms: ['cli'], category: 'media' },
      { name: 'jenkins', description: 'Jenkins CI/CD', enabled: false, platforms: ['cli'], category: 'devops' },
      { name: 'jira', description: 'Jira project management', enabled: false, platforms: ['cli'], category: 'productivity' },
      { name: 'kanban', description: 'Kanban board operations', enabled: false, platforms: ['cli'], category: 'productivity' },
      { name: 'kubernetes', description: 'Kubernetes management', enabled: false, platforms: ['cli'], category: 'devops' },
      { name: 'notion', description: 'Notion integration', enabled: false, platforms: ['cli'], category: 'productivity' },
      { name: 'obsidian', description: 'Obsidian vault sync', enabled: false, platforms: ['cli'], category: 'productivity' },
      { name: 'scheduled_tasks', description: 'Scheduled task management', enabled: false, platforms: ['cli'], category: 'automation' },
      { name: 'send_message', description: 'Cross-platform message sending', enabled: false, platforms: ['cli', 'telegram', 'discord'], category: 'platform' },
      { name: 'slack', description: 'Slack integration', enabled: false, platforms: ['cli'], category: 'platform' },
      { name: 'telegram', description: 'Telegram bot', enabled: false, platforms: ['cli'], category: 'platform' },
      { name: 'tts', description: 'Text-to-speech', enabled: false, platforms: ['cli'], category: 'media' },
      { name: 'weather', description: 'Weather data', enabled: false, platforms: ['cli'], category: 'data' },
      { name: 'whatsapp', description: 'WhatsApp integration', enabled: false, platforms: ['cli'], category: 'platform' },
      { name: 'youtube', description: 'YouTube download/tools', enabled: false, platforms: ['cli'], category: 'media' },
    ];
  }
}
