/**
 * The New Fuse VSCode Extension - Agent Registry Service
 * Version 9.1.0
 *
 * Agent registration, discovery, and directory management
 */

import * as vscode from 'vscode';
import { log } from '../../utils/logger';

interface RegisteredAgent {
  id: string;
  displayName: string;
  name: string;
  version: string;
  author: string;
  description: string;
  capabilities: string[];
  category: string;
  tags: string[];
  status: 'registered' | 'verified' | 'pending';
  lastActive?: string;
  metrics?: {
    tasksCompleted: number;
    avgResponseTime: number;
  };
}

interface AgentRegistration {
  registrationId: string;
  agentId: string;
  authToken: string;
  verificationStatus: 'pending' | 'testing' | 'verified' | 'failed';
}

export class AgentRegistryService {
  private static instance: AgentRegistryService | null = null;
  private context: vscode.ExtensionContext;
  private agents: Map<string, RegisteredAgent> = new Map();
  private registrations: Map<string, AgentRegistration> = new Map();

  private constructor(context: vscode.ExtensionContext) {
    this.context = context;
  }

  static getInstance(context?: vscode.ExtensionContext): AgentRegistryService {
    if (!AgentRegistryService.instance && context) {
      AgentRegistryService.instance = new AgentRegistryService(context);
    }
    return AgentRegistryService.instance!;
  }

  static getAgentRegistryService(): AgentRegistryService {
    return AgentRegistryService.getInstance()!;
  }

  /**
   * Initialize the Agent Registry service
   */
  async initialize(): Promise<void> {
    log.info('Initializing Agent Registry Service');
    await this.loadAgents();
    log.info('Agent Registry Service initialized');
  }

  /**
   * Register a new agent
   */
  async registerAgent(agentInfo: {
    name: string;
    version: string;
    author: string;
    description: string;
    capabilities: string[];
    category: string;
    tags?: string[];
  }): Promise<AgentRegistration> {
    const agentId = `agent-${Date.now()}`;
    const registrationId = `reg-${Date.now()}`;

    const registration: AgentRegistration = {
      registrationId,
      agentId,
      authToken: `tnf_agent_${this.generateToken()}`,
      verificationStatus: 'pending',
    };

    const agent: RegisteredAgent = {
      id: agentId,
      displayName: agentInfo.name,
      name: agentInfo.name.toLowerCase().replace(/\s+/g, '-'),
      version: agentInfo.version,
      author: agentInfo.author,
      description: agentInfo.description,
      capabilities: agentInfo.capabilities,
      category: agentInfo.category,
      tags: agentInfo.tags || [],
      status: 'pending',
    };

    this.agents.set(agentId, agent);
    this.registrations.set(registrationId, registration);

    await this.saveAgents();
    await this.saveRegistrations();

    log.info(`Registered agent: ${agent.displayName}`);
    return registration;
  }

  /**
   * Get agent from directory
   */
  async getAgent(agentId: string): Promise<RegisteredAgent | undefined> {
    return this.agents.get(agentId);
  }

  /**
   * Get all registered agents
   */
  getAllAgents(): RegisteredAgent[] {
    return Array.from(this.agents.values());
  }

  /**
   * Search agents in directory
   */
  async searchAgents(query: {
    term?: string;
    category?: string;
    capability?: string;
    verifiedOnly?: boolean;
    limit?: number;
  }): Promise<RegisteredAgent[]> {
    let results = Array.from(this.agents.values());

    if (query.term) {
      const term = query.term.toLowerCase();
      results = results.filter(
        (a) =>
          a.displayName.toLowerCase().includes(term) ||
          a.description.toLowerCase().includes(term) ||
          a.tags.some((t) => t.toLowerCase().includes(term))
      );
    }

    if (query.category) {
      results = results.filter((a) => a.category === query.category);
    }

    if (query.capability) {
      results = results.filter((a) => a.capabilities.includes(query.capability!));
    }

    if (query.verifiedOnly) {
      results = results.filter((a) => a.status === 'verified');
    }

    if (query.limit) {
      results = results.slice(0, query.limit);
    }

    return results;
  }

  /**
   * Show agent directory
   */
  async showDirectory(): Promise<void> {
    const agents = this.getAllAgents();

    const panel = vscode.window.createWebviewPanel(
      'agentDirectory',
      'Agent Directory',
      vscode.ViewColumn.One,
      { enableScripts: true }
    );

    panel.webview.html = this.generateDirectoryHtml(agents);
  }

  /**
   * Show agent registration wizard
   */
  async showRegistrationWizard(): Promise<void> {
    // Step 1: Agent details
    const name = await vscode.window.showInputBox({
      prompt: 'Enter agent name',
      placeHolder: 'My Custom Agent',
    });

    if (!name) return;

    const version =
      (await vscode.window.showInputBox({
        prompt: 'Enter version',
        placeHolder: '1.0.0',
        value: '1.0.0',
      })) || '1.0.0';

    const author = await vscode.window.showInputBox({
      prompt: 'Enter author name',
      placeHolder: 'Your Name',
    });

    if (!author) return;

    const description = await vscode.window.showInputBox({
      prompt: 'Enter agent description',
      placeHolder: 'What does this agent do?',
    });

    if (!description) return;

    const category = await vscode.window.showQuickPick(
      ['Development', 'Testing', 'DevOps', 'Documentation', 'Analysis', 'Other'],
      {
        prompt: 'Select agent category',
      }
    );

    if (!category) return;

    // Register the agent
    const registration = await this.registerAgent({
      name,
      version,
      author,
      description,
      capabilities: [],
      category,
    });

    vscode.window.showInformationMessage(
      `Agent "${name}" registered successfully! Registration ID: ${registration.registrationId}`
    );
  }

  private generateDirectoryHtml(agents: RegisteredAgent[]): string {
    const agentsHtml = agents
      .map(
        (agent) => `
      <div class="agent-card">
        <div class="agent-header">
          <span class="agent-name">${agent.displayName}</span>
          <span class="agent-status ${agent.status}">${agent.status}</span>
        </div>
        <p class="agent-description">${agent.description}</p>
        <div class="agent-meta">
          <span>v${agent.version}</span>
          <span>by ${agent.author}</span>
          <span>${agent.category}</span>
        </div>
        <div class="agent-capabilities">
          ${agent.capabilities.map((c) => `<span class="capability">${c}</span>`).join('')}
        </div>
      </div>
    `
      )
      .join('');

    return `<!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: var(--vscode-font-family); padding: 20px; }
          h1 { color: var(--vscode-foreground); }
          .agent-card {
            background: var(--vscode-editor-background);
            border: 1px solid var(--vscode-editor-lineHighlightBorder);
            border-radius: 8px;
            padding: 16px;
            margin-bottom: 12px;
          }
          .agent-header { display: flex; justify-content: space-between; align-items: center; }
          .agent-name { font-weight: bold; font-size: 16px; }
          .agent-status.registered { color: #2196f3; }
          .agent-status.verified { color: #4caf50; }
          .agent-status.pending { color: #ff9800; }
          .agent-description { color: var(--vscode-descriptionForeground); margin: 8px 0; }
          .agent-meta { font-size: 12px; color: var(--vscode-disabledForeground); display: flex; gap: 16px; }
          .agent-capabilities { margin-top: 12px; display: flex; gap: 6px; flex-wrap: wrap; }
          .capability {
            background: var(--vscode-badge-background);
            color: var(--vscode-badge-foreground);
            padding: 2px 8px;
            border-radius: 4px;
            font-size: 11px;
          }
        </style>
      </head>
      <body>
        <h1>Agent Directory (${agents.length} agents)</h1>
        ${agentsHtml}
      </body>
      </html>`;
  }

  private async loadAgents(): Promise<void> {
    const cached = this.context.workspaceState.get<RegisteredAgent[]>('registry.agents');
    if (cached) {
      for (const agent of cached) {
        this.agents.set(agent.id, agent);
      }
    }
  }

  private async saveAgents(): Promise<void> {
    await this.context.workspaceState.update('registry.agents', Array.from(this.agents.values()));
  }

  private async saveRegistrations(): Promise<void> {
    await this.context.workspaceState.update(
      'registry.registrations',
      Array.from(this.registrations.values())
    );
  }

  private generateToken(): string {
    return Math.random().toString(36).substring(2, 15);
  }
}

export function getAgentRegistryService(): AgentRegistryService {
  return AgentRegistryService.getAgentRegistryService();
}
