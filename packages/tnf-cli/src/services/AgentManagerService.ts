import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import { randomUUID } from 'crypto';

export interface AgentInfo {
  id: string;
  name: string;
  role: 'orchestrator' | 'broker' | 'worker' | 'participant';
  platform: 'antigravity' | 'gemini' | 'claude' | 'jules' | 'vscode' | 'browser' | 'custom';
  capabilities: string[];
  isOnline: boolean;
  lastSeen: string;
  createdAt: string;
  metadata?: Record<string, unknown>;
}

export interface AgentTemplate {
  name: string;
  role: AgentInfo['role'];
  platform: AgentInfo['platform'];
  systemPrompt?: string;
  capabilities?: string[];
}

export class AgentManagerService {
  private configDir: string;
  private agents: Map<string, AgentInfo> = new Map();

  constructor(configDir?: string) {
    this.configDir = configDir || path.join(os.homedir(), '.config', 'tnf', 'agents');
    this.loadAgents();
  }

  private loadAgents(): void {
    const agentsPath = path.join(this.configDir, 'agents.json');
    if (fs.existsSync(agentsPath)) {
      try {
        const agentsData = JSON.parse(fs.readFileSync(agentsPath, 'utf8'));
        if (Array.isArray(agentsData)) {
          for (const agent of agentsData) {
            this.agents.set(agent.id, agent);
          }
        }
      } catch {
        // Agents file doesn't exist or is invalid
      }
    }
  }

  private saveAgents(): void {
    if (!fs.existsSync(this.configDir)) {
      fs.mkdirSync(this.configDir, { recursive: true });
    }
    const agentsPath = path.join(this.configDir, 'agents.json');
    const agentsArray = Array.from(this.agents.values());
    fs.writeFileSync(agentsPath, JSON.stringify(agentsArray, null, 2));
  }

  create(name: string, role: AgentInfo['role'], platform: AgentInfo['platform'], options?: { capabilities?: string[]; metadata?: Record<string, unknown> }): AgentInfo {
    const id = randomUUID();
    const now = new Date().toISOString();
    const agent: AgentInfo = {
      id,
      name,
      role,
      platform,
      capabilities: options?.capabilities || this.getDefaultCapabilities(role, platform),
      isOnline: false,
      lastSeen: now,
      createdAt: now,
      metadata: options?.metadata,
    };
    this.agents.set(id, agent);
    this.saveAgents();
    return agent;
  }

  private getDefaultCapabilities(role: AgentInfo['role'], platform: AgentInfo['platform']): string[] {
    const roleCapabilities: Record<AgentInfo['role'], string[]> = {
      orchestrator: ['coordinate', 'delegate', 'plan', 'review'],
      broker: ['route', 'transform', 'mediate'],
      worker: ['execute', 'report', 'collaborate'],
      participant: ['message', 'observe', 'respond'],
    };

    const platformCapabilities: Record<AgentInfo['platform'], string[]> = {
      antigravity: ['file:read', 'file:write', 'bash', 'web'],
      gemini: ['search', 'analyze', 'generate', 'multimodal'],
      claude: ['reason', 'code', 'analyze', 'instruct'],
      jules: ['github', 'pr', 'issue', 'workflow'],
      vscode: ['file:read', 'file:write', 'terminal', 'debug'],
      browser: ['web', 'render', 'interact'],
      custom: [],
    };

    return [...(roleCapabilities[role] || []), ...(platformCapabilities[platform] || [])];
  }

  list(): AgentInfo[] {
    return Array.from(this.agents.values());
  }

  get(id: string): AgentInfo | undefined {
    return this.agents.get(id);
  }

  getByName(name: string): AgentInfo | undefined {
    for (const agent of this.agents.values()) {
      if (agent.name === name) return agent;
    }
    return undefined;
  }

  update(id: string, updates: Partial<Omit<AgentInfo, 'id' | 'createdAt'>>): AgentInfo | undefined {
    const agent = this.agents.get(id);
    if (!agent) return undefined;
    const updated = { ...agent, ...updates };
    this.agents.set(id, updated);
    this.saveAgents();
    return updated;
  }

  delete(id: string): boolean {
    const existed = this.agents.delete(id);
    if (existed) {
      this.saveAgents();
    }
    return existed;
  }

  markOnline(id: string): AgentInfo | undefined {
    return this.update(id, { isOnline: true, lastSeen: new Date().toISOString() });
  }

  markOffline(id: string): AgentInfo | undefined {
    return this.update(id, { isOnline: false, lastSeen: new Date().toISOString() });
  }

  importTemplate(template: AgentTemplate): AgentInfo {
    return this.create(template.name, template.role, template.platform, {
      capabilities: template.capabilities,
      metadata: template.systemPrompt ? { systemPrompt: template.systemPrompt } : undefined,
    });
  }

  exportTemplate(id: string): AgentTemplate | undefined {
    const agent = this.agents.get(id);
    if (!agent) return undefined;
    return {
      name: agent.name,
      role: agent.role,
      platform: agent.platform,
      capabilities: agent.capabilities,
      systemPrompt: agent.metadata?.systemPrompt as string | undefined,
    };
  }
}
