import { spawnSync } from 'child_process';
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { stripJsoncComments } from '../utils/jsonc.js';

export interface DebugPaths {
  config: string;
  data: string;
  cache: string;
  state: string;
  logs: string;
}

export interface PermissionRules {
  bash: Record<string, 'allow' | 'deny'>;
  read: Record<string, 'allow' | 'deny'>;
  external_directory: Record<string, 'allow' | 'deny'>;
}

export interface InlineMCPServerConfig {
  type?: 'local' | 'remote' | 'sse' | 'ws';
  command: string[] | string;
  environment?: Record<string, string>;
  env?: Record<string, string>;
  cwd?: string;
  enabled?: boolean;
  args?: string[];
  transport?: 'stdio' | 'sse' | 'ws';
  url?: string;
  oauth?: {
    enabled: boolean;
    authorizeUrl?: string;
    tokenUrl?: string;
    scopes?: string[];
  };
}

export interface DebugConfig {
  $schema?: string;
  provider?: string;
  model?: string;
  apiBaseUrl?: string;
  permission?: PermissionRules;
  mcp?: Record<string, InlineMCPServerConfig>;
  mcpServers?: Record<string, unknown>;
  agents?: Record<string, unknown>;
  custom?: Record<string, unknown>;
}

export class DebugService {
  private configDir: string;
  private dataDir: string;

  constructor() {
    this.configDir = path.join(os.homedir(), '.config', 'tnf');
    this.dataDir = path.join(os.homedir(), '.local', 'share', 'tnf');
  }

  getPaths(): DebugPaths {
    return {
      config: this.configDir,
      data: this.dataDir,
      cache: path.join(os.homedir(), '.cache', 'tnf'),
      state: path.join(os.homedir(), '.local', 'state', 'tnf'),
      logs: path.join(this.dataDir, 'logs'),
    };
  }

  getConfig(): DebugConfig {
    const config: DebugConfig = {};

    const jsoncPath = path.join(this.configDir, 'tnf.jsonc');
    const jsonPath = path.join(this.configDir, 'config.json');
    const configPath = fs.existsSync(jsoncPath) ? jsoncPath : jsonPath;

    if (fs.existsSync(configPath)) {
      try {
        let raw = fs.readFileSync(configPath, 'utf8');
        if (configPath.endsWith('.jsonc')) {
          raw = stripJsoncComments(raw);
        }
        const data = JSON.parse(raw);
        config.$schema = data.$schema;
        config.provider = data.provider;
        config.model = data.model;
        config.apiBaseUrl = data.apiBaseUrl;
        config.permission = data.permission;
        config.mcp = data.mcp;
        config.mcpServers = data.mcpServers;
        config.agents = data.agents;
        config.custom = data.custom;
      } catch {}
    }

    const envConfig: Record<string, string | undefined> = {
      provider: process.env.TNF_LLM_PROVIDER,
      model: process.env.TNF_LLM_MODEL || process.env.OPENAI_MODEL,
      apiBaseUrl: process.env.TNF_LLM_BASE_URL || process.env.OPENAI_API_BASE,
    };

    if (!config.provider && envConfig.provider) config.provider = envConfig.provider;
    if (!config.model && envConfig.model) config.model = envConfig.model;
    if (!config.apiBaseUrl && envConfig.apiBaseUrl) config.apiBaseUrl = envConfig.apiBaseUrl;

    return config;
  }

  getConfigPath(key: string): unknown {
    const config = this.getConfig();
    const parts = key.split('.');
    let value: unknown = config;
    for (const part of parts) {
      if (typeof value === 'object' && value !== null && part in value) {
        value = (value as Record<string, unknown>)[part];
      } else {
        return undefined;
      }
    }
    return value;
  }

  getProjectConfig(projectRoot?: string): DebugConfig {
    const root = projectRoot || process.cwd();
    const config: DebugConfig = {};

    const jsoncPath = path.join(root, 'tnf.jsonc');
    const jsonPath = path.join(root, 'tnf.json');
    const configPath = fs.existsSync(jsoncPath)
      ? jsoncPath
      : fs.existsSync(jsonPath)
        ? jsonPath
        : null;

    if (configPath && fs.existsSync(configPath)) {
      try {
        let raw = fs.readFileSync(configPath, 'utf8');
        if (configPath.endsWith('.jsonc')) {
          raw = stripJsoncComments(raw);
        }
        const data = JSON.parse(raw);
        config.$schema = data.$schema;
        config.provider = data.provider;
        config.model = data.model;
        config.apiBaseUrl = data.apiBaseUrl;
        config.permission = data.permission;
        config.mcp = data.mcp;
        config.mcpServers = data.mcpServers;
        config.agents = data.agents;
        config.custom = data.custom;
      } catch {}
    }

    return config;
  }

  getProjectCommands(projectRoot?: string): Array<{ name: string; filePath: string }> {
    const root = projectRoot || process.cwd();
    const commandDir = path.join(root, '.tnf', 'command');
    const commands: Array<{ name: string; filePath: string }> = [];

    if (fs.existsSync(commandDir)) {
      try {
        const entries = fs.readdirSync(commandDir);
        for (const entry of entries) {
          if (entry.endsWith('.md')) {
            commands.push({
              name: entry.replace(/\.md$/, ''),
              filePath: path.join(commandDir, entry),
            });
          }
        }
      } catch {}
    }

    return commands;
  }

  getProjectAgents(projectRoot?: string): Array<{ name: string; filePath: string }> {
    const root = projectRoot || process.cwd();
    const agentDir = path.join(root, '.tnf', 'agent');
    const agents: Array<{ name: string; filePath: string }> = [];

    if (fs.existsSync(agentDir)) {
      try {
        const entries = fs.readdirSync(agentDir);
        for (const entry of entries) {
          if (entry.endsWith('.md')) {
            agents.push({ name: entry.replace(/\.md$/, ''), filePath: path.join(agentDir, entry) });
          }
        }
      } catch {}
    }

    return agents;
  }

  listProjects(): Array<{ name: string; path: string; lastAccessed: string }> {
    const projectsPath = path.join(this.dataDir, 'projects.json');
    if (!fs.existsSync(projectsPath)) return [];

    try {
      const projects = JSON.parse(fs.readFileSync(projectsPath, 'utf8'));
      return Array.isArray(projects) ? projects : [];
    } catch {
      return [];
    }
  }

  // Phase-1.2 (tnf pi parity): extend discovery to match `.pi`'s Agent Skills
  // standard topology exactly. Mirrors .pi docs/skills.md "Locations" section:
  //   - ~/.pi/agent/skills/, ~/.agents/skills/  → discover recursively for SKILL.md
  //     and individual root .md files (per .pi: root .md in those two allowed)
  //   - ~/.claude/skills/                       → existing tnf behavior preserved
  //   - ~/.config/tnf/skills                    → TNF-native fallback preserved
  // Order is stable; first match by `(source, name)` wins, later sources skipped.
  listSkills(): Array<{ name: string; source: string; path: string }> {
    const seen = new Set<string>();
    const result: Array<{ name: string; source: string; path: string }> = [];
    const home = os.homedir();

    const sources: Array<{ source: string; dir: string }> = [
      { source: 'tnf', dir: path.join(this.configDir, 'skills') },
      { source: 'pi', dir: path.join(home, '.pi', 'agent', 'skills') },
      { source: 'agents', dir: path.join(home, '.agents', 'skills') },
      { source: 'claude', dir: path.join(home, '.claude', 'skills') },
    ];

    for (const { source, dir } of sources) {
      if (!fs.existsSync(dir)) continue;
      this.walkDirWithSource(source, dir, (filePath, root) => {
        const base = path.basename(filePath);
        const atRoot = path.dirname(filePath) === dir;
        // .pi agents/.claude: root .md is a skill; nested SKILL.md is a skill;
        // anything else is ignored (per .pi docs/skills.md recursive SKILL.md rule)
        const accepted = (atRoot && base.endsWith('.md')) || base === 'SKILL.md';
        if (!accepted) return;
        const name =
          base === 'SKILL.md' ? path.basename(path.dirname(filePath)) : base.replace(/\.md$/, '');
        const key = `${source}::${name}`;
        if (seen.has(key)) return;
        seen.add(key);
        result.push({ name, source, path: filePath });
      });
    }

    return result;
  }

  private walkDirWithSource(
    source: string,
    dir: string,
    callback: (filePath: string, root: string) => void
  ): void {
    try {
      const entries = fs.readdirSync(dir, { withFileTypes: true });
      for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);
        let isDir = entry.isDirectory();
        // `.pi` discovery roots often contain symlinks (e.g. ~/.pi/agent/skills
        // points at ~/.hermes/skills/tnf/<name>). Follow the link to a real path
        // and reclassify by what the link actually contains.
        if (!isDir && entry.isSymbolicLink()) {
          try {
            const real = fs.realpathSync(fullPath);
            const stat = fs.statSync(real);
            if (stat.isDirectory()) isDir = true;
            else {
              callback(real, dir);
              continue;
            }
          } catch {
            continue;
          }
        }
        if (isDir) {
          this.walkDirWithSource(source, fullPath, callback);
        } else if (entry.isFile()) {
          callback(fullPath, dir);
        }
      }
    } catch {}
  }

  private walkDir(dir: string, callback: (filePath: string) => void): void {
    try {
      const entries = fs.readdirSync(dir, { withFileTypes: true });
      for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);
        if (entry.isDirectory()) {
          this.walkDir(fullPath, callback);
        } else if (entry.isFile()) {
          callback(fullPath);
        }
      }
    } catch {}
  }

  debugLSP(): { available: boolean; version?: string; path?: string; error?: string } {
    try {
      const result = spawnSync('which', ['typescript-language-server'], { encoding: 'utf8' });
      if (result.status === 0) {
        const serverPath = result.stdout.trim();
        const versionResult = spawnSync('typescript-language-server', ['--version'], {
          encoding: 'utf8',
        });
        return {
          available: true,
          path: serverPath,
          version: versionResult.stdout.trim() || undefined,
        };
      }
    } catch (e) {
      return { available: false, error: (e as Error).message };
    }
    return { available: false };
  }

  debugRg(): { available: boolean; version?: string; path?: string; error?: string } {
    try {
      const result = spawnSync('which', ['rg'], { encoding: 'utf8' });
      if (result.status === 0) {
        const rgPath = result.stdout.trim();
        const versionResult = spawnSync('rg', ['--version'], { encoding: 'utf8' });
        return {
          available: true,
          path: rgPath,
          version: versionResult.stdout.split('\n')[0] || undefined,
        };
      }
    } catch (e) {
      return { available: false, error: (e as Error).message };
    }
    return { available: false };
  }

  debugFile(filePath: string): {
    exists: boolean;
    size?: number;
    modified?: string;
    permissions?: string;
    error?: string;
  } {
    try {
      if (!fs.existsSync(filePath)) {
        return { exists: false };
      }
      const stats = fs.statSync(filePath);
      const mode = stats.mode.toString(8).slice(-3);
      return {
        exists: true,
        size: stats.size,
        modified: stats.mtime.toISOString(),
        permissions: mode,
      };
    } catch (e) {
      return { exists: false, error: (e as Error).message };
    }
  }

  createSnapshot(outputPath?: string): { path: string; data: Record<string, unknown> } {
    const globalConfig = this.getConfig();
    const projectConfig = this.getProjectConfig();
    const snapshot: Record<string, unknown> = {
      timestamp: new Date().toISOString(),
      paths: this.getPaths(),
      config: globalConfig,
      projectConfig: Object.keys(projectConfig).length > 0 ? projectConfig : undefined,
      projectCommands: this.getProjectCommands(),
      projectAgents: this.getProjectAgents(),
      lsp: this.debugLSP(),
      rg: this.debugRg(),
      projects: this.listProjects(),
      skills: this.listSkills(),
    };

    const snapshotPath =
      outputPath || path.join(this.dataDir, 'snapshots', `snapshot-${Date.now()}.json`);
    const snapshotDir = path.dirname(snapshotPath);
    if (!fs.existsSync(snapshotDir)) {
      fs.mkdirSync(snapshotDir, { recursive: true });
    }
    fs.writeFileSync(snapshotPath, JSON.stringify(snapshot, null, 2));

    return { path: snapshotPath, data: snapshot };
  }
}
