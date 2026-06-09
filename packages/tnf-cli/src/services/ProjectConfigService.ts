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

export type ProjectScaffoldKind = 'command' | 'agent' | 'skill' | 'workflow' | 'mcp-server';

export interface ProjectScaffoldResult {
  kind: ProjectScaffoldKind;
  name: string;
  filePath: string;
  created: boolean;
  overwritten: boolean;
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
    this.commands = [];
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
    this.agents = [];
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

  createScaffold(kind: ProjectScaffoldKind, rawName: string, options: { force?: boolean } = {}): ProjectScaffoldResult {
    const name = normalizeScaffoldName(rawName);
    const target = this.resolveScaffoldTarget(kind, name);
    fs.mkdirSync(path.dirname(target), { recursive: true });

    const exists = fs.existsSync(target);
    if (exists && !options.force) {
      throw new Error(`${kind} scaffold already exists at ${target}. Pass --force to overwrite.`);
    }

    fs.writeFileSync(target, renderScaffoldTemplate(kind, name), 'utf8');
    this.loadCommandDefs();
    this.loadAgentDefs();

    return {
      kind,
      name,
      filePath: target,
      created: !exists,
      overwritten: exists,
    };
  }

  private resolveScaffoldTarget(kind: ProjectScaffoldKind, name: string): string {
    switch (kind) {
      case 'command':
        return path.join(this.projectRoot, '.tnf', 'command', `${name}.md`);
      case 'agent':
        return path.join(this.projectRoot, '.tnf', 'agent', `${name}.md`);
      case 'skill':
        return path.join(this.projectRoot, '.agent', 'skills', name, 'SKILL.md');
      case 'workflow':
        return path.join(this.projectRoot, '.tnf', 'workflow', `${name}.json`);
      case 'mcp-server':
        return path.join(this.projectRoot, '.tnf', 'mcp-server', `${name}.ts`);
      default: {
        const exhaustive: never = kind;
        throw new Error(`Unsupported scaffold kind: ${exhaustive}`);
      }
    }
  }

  createDefaultConfig(): string {
    const configPath = path.join(this.projectRoot, 'tnf.jsonc');
    const defaultConfig: ProjectConfig = {
      $schema: 'https://tnf.ai/config.schema.json',
      model: '',
      permission: {
        bash: { 'ls *': 'allow', 'cat *': 'allow', 'echo *': 'allow', 'pwd': 'allow', 'which *': 'allow' },
        read: { '.tnf/**': 'allow', 'tnf.jsonc': 'allow', 'tnf.json': 'allow' },
        external_directory: {},
      },
      mcp: {},
      custom: {},
    };
    fs.writeFileSync(configPath, JSON.stringify(defaultConfig, null, 2));

    const commandDir = path.join(this.projectRoot, '.tnf', 'command');
    const agentDir = path.join(this.projectRoot, '.tnf', 'agent');
    const workflowDir = path.join(this.projectRoot, '.tnf', 'workflow');
    const mcpServerDir = path.join(this.projectRoot, '.tnf', 'mcp-server');
    if (!fs.existsSync(commandDir)) fs.mkdirSync(commandDir, { recursive: true });
    if (!fs.existsSync(agentDir)) fs.mkdirSync(agentDir, { recursive: true });
    if (!fs.existsSync(workflowDir)) fs.mkdirSync(workflowDir, { recursive: true });
    if (!fs.existsSync(mcpServerDir)) fs.mkdirSync(mcpServerDir, { recursive: true });

    this.config = defaultConfig;
    this.commands = [];
    this.agents = [];
    return configPath;
  }
}

function normalizeScaffoldName(rawName: string): string {
  const name = rawName
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9._-]+/g, '-')
    .replace(/^-+|-+$/g, '');

  if (!name) {
    throw new Error('Scaffold name must contain at least one letter or number.');
  }

  if (name === '.' || name === '..' || name.includes('..') || name.includes('/')) {
    throw new Error(`Invalid scaffold name: ${rawName}`);
  }

  return name;
}

function titleFromName(name: string): string {
  return name
    .split(/[-_.]+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}

function renderScaffoldTemplate(kind: ProjectScaffoldKind, name: string): string {
  const title = titleFromName(name);

  switch (kind) {
    case 'command':
      return [
        `# ${title}`,
        '',
        'Describe when this project slash command should run.',
        '',
        '## Instructions',
        '',
        '- Inspect current state before acting.',
        '- Keep changes scoped to the requested outcome.',
        '- Verify the result with the narrowest useful checks.',
        '',
      ].join('\n');
    case 'agent':
      return [
        `# ${title}`,
        '',
        '## Role',
        '',
        'Describe this project agent role and its decision boundary.',
        '',
        '## Operating Loop',
        '',
        '1. Inspect inputs and local state.',
        '2. Act only within the assigned responsibility.',
        '3. Verify outputs before handing off.',
        '',
        '## Capabilities',
        '',
        '- Add concrete capabilities here.',
        '',
      ].join('\n');
    case 'skill':
      return [
        '---',
        `name: ${name}`,
        `description: Use when work requires the ${title} capability.`,
        '---',
        '',
        `# ${title}`,
        '',
        '## When To Use',
        '',
        'Use this skill when the task clearly needs this project capability.',
        '',
        '## Workflow',
        '',
        '1. Inspect the relevant local state.',
        '2. Apply the smallest effective change.',
        '3. Verify the result and record any remaining risk.',
        '',
      ].join('\n');
    case 'workflow':
      return `${JSON.stringify(
        {
          name: title,
          active: false,
          nodes: [],
          connections: {},
          settings: {},
          tags: ['tnf-scaffold'],
          versionId: 'tnf-scaffold-v1',
        },
        null,
        2
      )}\n`;
    case 'mcp-server':
      return [
        "import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';",
        "import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';",
        '',
        `const server = new McpServer({ name: '${name}', version: '0.1.0' });`,
        '',
        "server.tool('status', 'Return server health status.', async () => ({",
        '  content: [',
        "    { type: 'text', text: JSON.stringify({ status: 'ok', server: '" + name + "' }) },",
        '  ],',
        '}));',
        '',
        'async function main(): Promise<void> {',
        '  const transport = new StdioServerTransport();',
        '  await server.connect(transport);',
        '}',
        '',
        'main().catch((error) => {',
        "  console.error('MCP server failed:', error);",
        '  process.exit(1);',
        '});',
        '',
      ].join('\n');
    default: {
      const exhaustive: never = kind;
      throw new Error(`Unsupported scaffold kind: ${exhaustive}`);
    }
  }
}
