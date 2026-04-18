/**
 * The New Fuse VSCode Extension - Collective Orchestrator Service
 * Version 9.1.0
 *
 * Multi-agent collective orchestration and task distribution
 */

import * as vscode from 'vscode';
import { log } from '../../utils/logger.js';

interface CollectiveAgent {
  id: string;
  name: string;
  role: string;
  status: 'idle' | 'busy' | 'error';
  currentTask?: string;
}

interface DistributedTask {
  id: string;
  name: string;
  description: string;
  status: 'pending' | 'in_progress' | 'completed' | 'failed';
  assignedTo?: string;
  createdAt: string;
  completedAt?: string;
}

interface CollectiveState {
  mode: 'parallel' | 'sequential' | 'hybrid';
  agents: CollectiveAgent[];
  activeTasks: DistributedTask[];
}

export class CollectiveOrchestratorService {
  private static instance: CollectiveOrchestratorService | null = null;
  private context: vscode.ExtensionContext;
  private agents: Map<string, CollectiveAgent> = new Map();
  private tasks: Map<string, DistributedTask> = new Map();
  private state: CollectiveState = {
    mode: 'parallel',
    agents: [],
    activeTasks: [],
  };
  private statusBarItem: vscode.StatusBarItem | undefined;

  private constructor(context: vscode.ExtensionContext) {
    this.context = context;
  }

  static getInstance(context?: vscode.ExtensionContext): CollectiveOrchestratorService {
    if (!CollectiveOrchestratorService.instance && context) {
      CollectiveOrchestratorService.instance = new CollectiveOrchestratorService(context);
    }
    return CollectiveOrchestratorService.instance!;
  }

  static getCollectiveOrchestratorService(): CollectiveOrchestratorService {
    return CollectiveOrchestratorService.getInstance()!;
  }

  async initialize(): Promise<void> {
    log.info('Initializing Collective Orchestrator Service');

    this.statusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, 94);
    this.statusBarItem.text = '$(organization) CO';
    this.statusBarItem.tooltip = 'Collective Orchestrator: Ready';
    this.statusBarItem.command = 'theNewFuse.collectiveOrchestrator';
    this.statusBarItem.show();
    this.context.subscriptions.push(this.statusBarItem);

    // Add demo agents
    this.agents.set('agent-1', {
      id: 'agent-1',
      name: 'Composer',
      role: 'orchestrator',
      status: 'idle',
    });
    this.agents.set('agent-2', {
      id: 'agent-2',
      name: 'Roo Coder',
      role: 'developer',
      status: 'idle',
    });

    await this.loadState();
    log.info('Collective Orchestrator Service initialized');
  }

  async showOrchestrator(): Promise<void> {
    const panel = vscode.window.createWebviewPanel(
      'collectiveOrchestrator',
      'Collective Orchestrator',
      vscode.ViewColumn.One,
      { enableScripts: true }
    );

    panel.webview.html = this.generateOrchestratorHtml();
  }

  async distributeTask(taskInfo: {
    name: string;
    description: string;
    assignedTo?: string;
  }): Promise<DistributedTask> {
    const task: DistributedTask = {
      id: `task-${Date.now()}`,
      name: taskInfo.name,
      description: taskInfo.description,
      status: 'pending',
      assignedTo: taskInfo.assignedTo,
      createdAt: new Date().toISOString(),
    };

    this.tasks.set(task.id, task);
    await this.saveState();

    log.info(`Task distributed: ${task.name}`);
    return task;
  }

  async assignTask(taskId: string, agentId: string): Promise<boolean> {
    const task = this.tasks.get(taskId);
    const agent = this.agents.get(agentId);

    if (!task || !agent) {
      return false;
    }

    task.assignedTo = agentId;
    task.status = 'in_progress';
    agent.status = 'busy';
    agent.currentTask = task.name;

    await this.saveState();
    log.info(`Task ${task.name} assigned to ${agent.name}`);
    return true;
  }

  async completeTask(taskId: string): Promise<void> {
    const task = this.tasks.get(taskId);
    if (!task) return;

    task.status = 'completed';
    task.completedAt = new Date().toISOString();

    // Free up the agent
    if (task.assignedTo) {
      const agent = this.agents.get(task.assignedTo);
      if (agent) {
        agent.status = 'idle';
        agent.currentTask = undefined;
      }
    }

    await this.saveState();
    log.info(`Task completed: ${task.name}`);
  }

  async showFederationNetwork(): Promise<void> {
    const panel = vscode.window.createWebviewPanel(
      'federationNetwork',
      'Federation Network',
      vscode.ViewColumn.One,
      { enableScripts: true }
    );

    panel.webview.html = this.generateFederationHtml();
  }

  private generateOrchestratorHtml(): string {
    const agentsHtml = Array.from(this.agents.values())
      .map(
        (a) => `
        <div class="agent-card ${a.status}">
          <div class="agent-header">
            <span class="agent-name">${a.name}</span>
            <span class="agent-role">${a.role}</span>
          </div>
          <div class="agent-status ${a.status}">${a.status}</div>
          ${a.currentTask ? `<div class="agent-task">Task: ${a.currentTask}</div>` : ''}
        </div>
      `
      )
      .join('');

    const tasksHtml =
      Array.from(this.tasks.values())
        .map(
          (t) => `
        <div class="task-card ${t.status}">
          <div class="task-header">
            <span class="task-name">${t.name}</span>
            <span class="task-status ${t.status}">${t.status}</span>
          </div>
          <div class="task-desc">${t.description}</div>
          ${t.assignedTo ? `<div class="task-assignee">Assigned to: ${t.assignedTo}</div>` : ''}
        </div>
      `
        )
        .join('') || '<p>No tasks yet.</p>';

    return `<!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: var(--vscode-font-family); padding: 20px; }
          h1 { color: var(--vscode-foreground); }
          h2 { color: var(--vscode-foreground); margin-top: 24px; }
          .agent-card {
            background: var(--vscode-editor-background);
            border: 1px solid var(--vscode-editor-lineHighlightBorder);
            border-radius: 8px;
            padding: 16px;
            margin-bottom: 12px;
          }
          .agent-header { display: flex; justify-content: space-between; }
          .agent-name { font-weight: bold; }
          .agent-role { color: var(--vscode-descriptionForeground); }
          .agent-status.idle { color: #4caf50; }
          .agent-status.busy { color: #ff9800; }
          .agent-status.error { color: #f44336; }
          .agent-task { margin-top: 8px; font-size: 12px; color: var(--vscode-disabledForeground); }
          .task-card {
            background: var(--vscode-editor-background);
            border: 1px solid var(--vscode-editor-lineHighlightBorder);
            border-radius: 8px;
            padding: 16px;
            margin-bottom: 12px;
          }
          .task-header { display: flex; justify-content: space-between; }
          .task-name { font-weight: bold; }
          .task-status.pending { color: #ff9800; }
          .task-status.in_progress { color: #2196f3; }
          .task-status.completed { color: #4caf50; }
          .task-status.failed { color: #f44336; }
          .task-desc { color: var(--vscode-descriptionForeground); margin-top: 8px; }
          .mode-selector { margin-bottom: 20px; }
        </style>
      </head>
      <body>
        <h1>Collective Orchestrator</h1>
        <div class="mode-selector">
          <label>Mode: </label>
          <select id="modeSelect" onchange="setMode(this.value)">
            <option value="parallel" ${this.state.mode === 'parallel' ? 'selected' : ''}>Parallel</option>
            <option value="sequential" ${this.state.mode === 'sequential' ? 'selected' : ''}>Sequential</option>
            <option value="hybrid" ${this.state.mode === 'hybrid' ? 'selected' : ''}>Hybrid</option>
          </select>
        </div>

        <h2>Agents (${this.agents.size})</h2>
        ${agentsHtml}

        <h2>Tasks (${this.tasks.size})</h2>
        ${tasksHtml}
      </body>
      </html>`;
  }

  private generateFederationHtml(): string {
    return `<!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: var(--vscode-font-family); padding: 20px; }
          h1 { color: var(--vscode-foreground); }
          .feature {
            background: var(--vscode-editor-background);
            border: 1px solid var(--vscode-editor-lineHighlightBorder);
            border-radius: 8px;
            padding: 16px;
            margin-bottom: 12px;
          }
          .feature-title { font-weight: bold; }
          .feature-desc { color: var(--vscode-descriptionForeground); margin-top: 8px; }
        </style>
      </head>
      <body>
        <h1>Federation Network</h1>
        <p>Multi-agent federation and collective intelligence.</p>

        <div class="feature">
          <div class="feature-title">Peer Discovery</div>
          <div class="feature-desc">Automatically discover and connect to other agents in the network</div>
        </div>

        <div class="feature">
          <div class="feature-title">Task Distribution</div>
          <div class="feature-desc">Intelligently distribute tasks based on agent capabilities and load</div>
        </div>

        <div class="feature">
          <div class="feature-title">Collective Memory</div>
          <div class="feature-desc">Share knowledge and context across the collective</div>
        </div>

        <div class="feature">
          <div class="feature-title">Emergent Behavior</div>
          <div class="feature-desc">Enable complex problem-solving through agent collaboration</div>
        </div>
      </body>
      </html>`;
  }

  private async loadState(): Promise<void> {
    const cached = this.context.workspaceState.get<CollectiveState>('collective.state');
    if (cached) {
      this.state = cached;
    }
  }

  private async saveState(): Promise<void> {
    this.state.agents = Array.from(this.agents.values());
    this.state.activeTasks = Array.from(this.tasks.values());
    await this.context.workspaceState.update('collective.state', this.state);
  }

  dispose(): void {
    this.statusBarItem?.dispose();
  }
}

export function getCollectiveOrchestratorService(): CollectiveOrchestratorService {
  return CollectiveOrchestratorService.getCollectiveOrchestratorService();
}
