import * as fs from 'fs';
import * as path from 'path';
import { stripJsoncComments } from '../utils/jsonc.js';

export interface ProjectCommandDef {
  name: string;
  filePath: string;
  content: string;
}

export interface ProjectAgentDef {
  name: string;
  filePath: string;
  content: string;
}

export interface ProjectConfig {
  $schema?: string;
  model?: string;
  provider?: string;
  permission?: {
    bash: Record<string, 'allow' | 'deny'>;
    read: Record<string, 'allow' | 'deny'>;
    external_directory: Record<string, 'allow' | 'deny'>;
  };
  mcp?: Record<string, {
    type?: 'local' | 'remote' | 'sse' | 'ws';
    command: string[] | string;
    environment?: Record<string, string>;
    env?: Record<string, string>;
    enabled?: boolean;
    args?: string[];
    cwd?: string;
  }>;
  custom?: Record<string, unknown>;
}

export class ProjectConfigService {
  private projectRoot: string;
  private config: ProjectConfig | null = null;
  private commands: ProjectCommandDef[] = [];
  private agents: ProjectAgentDef[] = [];

  constructor(projectRoot: string) {
    this.projectRoot = projectRoot;
    this.loadConfig();
    this.loadCommandDefs();
    this.loadAgentDefs();
  }

  private loadConfig(): void {
    const jsoncPath = path.join(this.projectRoot, 'tnf.jsonc');
    const jsonPath = path.join(this.projectRoot, 'tnf.json');

    const configPath = fs.existsSync(jsoncPath) ? jsoncPath : (fs.existsSync(jsonPath) ? jsonPath : null);
    if (!configPath) return;

    try {
      let raw = fs.readFileSync(configPath, 'utf8');
      if (configPath.endsWith('.jsonc')) {
        raw = stripJsoncComments(raw);
      }
      this.config = JSON.parse(raw);
    } catch {
      this.config = null;
    }
  }

  private loadCommandDefs(): void {
    const commandDir = path.join(this.projectRoot, '.tnf', 'command');
    if (!fs.existsSync(commandDir)) return;

    try {
      const entries = fs.readdirSync(commandDir);
      for (const entry of entries) {
        if (entry.endsWith('.md')) {
          const filePath = path.join(commandDir, entry);
          const content = fs.readFileSync(filePath, 'utf8');
          this.commands.push({
            name: entry.replace(/\.md$/, ''),
            filePath,
            content,
          });
        }
      }
    } catch {}
  }

  private loadAgentDefs(): void {
    const agentDir = path.join(this.projectRoot, '.tnf', 'agent');
    if (!fs.existsSync(agentDir)) return;

    try {
      const entries = fs.readdirSync(agentDir);
      for (const entry of entries) {
        if (entry.endsWith('.md')) {
          const filePath = path.join(agentDir, entry);
          const content = fs.readFileSync(filePath, 'utf8');
          this.agents.push({
            name: entry.replace(/\.md$/, ''),
            filePath,
            content,
          });
        }
      }
    } catch {}
  }

  getConfig(): ProjectConfig | null {
    return this.config;
  }

  getCommands(): ProjectCommandDef[] {
    return this.commands;
  }

  getAgents(): ProjectAgentDef[] {
    return this.agents;
  }

  getConfigPath(): string | null {
    const jsoncPath = path.join(this.projectRoot, 'tnf.jsonc');
    const jsonPath = path.join(this.projectRoot, 'tnf.json');
    if (fs.existsSync(jsoncPath)) return jsoncPath;
    if (fs.existsSync(jsonPath)) return jsonPath;
    return null;
  }

  createDefaultConfig(): string {
    const configPath = path.join(this.projectRoot, 'tnf.jsonc');
    const defaultConfig: ProjectConfig = {
      $schema: 'https://tnf.ai/config.schema.json',
      model: '',
      permission: {
        bash: {},
        read: { '*': 'allow' },
        external_directory: {},
      },
      mcp: {},
      custom: {},
    };
    fs.writeFileSync(configPath, JSON.stringify(defaultConfig, null, 2));

    const commandDir = path.join(this.projectRoot, '.tnf', 'command');
    const agentDir = path.join(this.projectRoot, '.tnf', 'agent');
    if (!fs.existsSync(commandDir)) fs.mkdirSync(commandDir, { recursive: true });
    if (!fs.existsSync(agentDir)) fs.mkdirSync(agentDir, { recursive: true });

    this.config = defaultConfig;
    this.commands = [];
    this.agents = [];
    return configPath;
  }
}
