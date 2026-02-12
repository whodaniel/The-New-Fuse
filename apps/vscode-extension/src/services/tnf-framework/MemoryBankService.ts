/**
 * The New Fuse VSCode Extension - Memory Bank Service
 * Version 9.1.0
 *
 * Memory Bank integration for project context management
 */

import * as vscode from 'vscode';
import { log } from '../../utils/logger';

interface MemoryContext {
  id: string;
  type: 'activeContext' | 'projectBrief' | 'systemPatterns' | 'techContext';
  content: string;
  lastUpdated: string;
}

interface MemoryFile {
  path: string;
  name: string;
  type: 'file' | 'directory';
}

export class MemoryBankService {
  private static instance: MemoryBankService | null = null;
  private context: vscode.ExtensionContext;
  private memories: Map<string, MemoryContext> = new Map();
  private statusBarItem: vscode.StatusBarItem | undefined;

  private constructor(context: vscode.ExtensionContext) {
    this.context = context;
  }

  static getInstance(context?: vscode.ExtensionContext): MemoryBankService {
    if (!MemoryBankService.instance && context) {
      MemoryBankService.instance = new MemoryBankService(context);
    }
    return MemoryBankService.instance!;
  }

  static getMemoryBankService(): MemoryBankService {
    return MemoryBankService.getInstance()!;
  }

  async initialize(): Promise<void> {
    log.info('Initializing Memory Bank Service');

    this.statusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, 95);
    this.statusBarItem.text = '$(book) MB';
    this.statusBarItem.tooltip = 'Memory Bank: Ready';
    this.statusBarItem.command = 'theNewFuse.memoryBank';
    this.statusBarItem.show();
    this.context.subscriptions.push(this.statusBarItem);

    await this.loadMemories();
    log.info('Memory Bank Service initialized');
  }

  async showMemoryBank(): Promise<void> {
    const panel = vscode.window.createWebviewPanel(
      'memoryBank',
      'Memory Bank',
      vscode.ViewColumn.One,
      { enableScripts: true }
    );

    panel.webview.html = this.generateMemoryBankHtml();
  }

  async showActiveContext(): Promise<void> {
    const panel = vscode.window.createWebviewPanel(
      'activeContext',
      'Active Context',
      vscode.ViewColumn.One,
      { enableScripts: true }
    );

    panel.webview.html = this.generateContextHtml(
      'activeContext',
      'Active Context',
      `
      <p>Current session context and ongoing tasks.</p>
      <ul>
        <li>Last task: Code review</li>
        <li>Active files: src/App.tsx, src/components/</li>
        <li>Recent changes: Added new authentication module</li>
      </ul>
    `
    );
  }

  async showProjectBrief(): Promise<void> {
    const panel = vscode.window.createWebviewPanel(
      'projectBrief',
      'Project Brief',
      vscode.ViewColumn.One,
      { enableScripts: true }
    );

    panel.webview.html = this.generateContextHtml(
      'projectBrief',
      'Project Brief',
      `
      <h3>The New Fuse Platform</h3>
      <p>A comprehensive AI agent orchestration platform with multi-agent capabilities.</p>
      <ul>
        <li><strong>Vision:</strong> Democratize AI agent technology</li>
        <li><strong>Mission:</strong> Build the most capable agent ecosystem</li>
        <li><strong>Key Features:</strong> MCP, A2A, AG-UI protocols</li>
      </ul>
    `
    );
  }

  async showSystemPatterns(): Promise<void> {
    const panel = vscode.window.createWebviewPanel(
      'systemPatterns',
      'System Patterns',
      vscode.ViewColumn.One,
      { enableScripts: true }
    );

    panel.webview.html = this.generateContextHtml(
      'systemPatterns',
      'System Patterns',
      `
      <h3>Architectural Patterns</h3>
      <ul>
        <li><strong>Event-Driven:</strong> All services communicate via events</li>
        <li><strong>Service-Oriented:</strong> Modular, composable services</li>
        <li><strong>Agent-Centric:</strong> Agents as first-class citizens</li>
      </ul>
    `
    );
  }

  async addToMemory(type: MemoryContext['type'], content: string): Promise<void> {
    const memory: MemoryContext = {
      id: `mem-${Date.now()}`,
      type,
      content,
      lastUpdated: new Date().toISOString(),
    };

    this.memories.set(memory.id, memory);
    await this.saveMemories();
    log.info(`Added memory: ${memory.id}`);
  }

  async syncWithWorkspace(): Promise<void> {
    const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
    if (!workspaceFolder) {
      vscode.window.showErrorMessage('No workspace folder open');
      return;
    }

    // Look for memory-bank directory
    const memoryBankPath = vscode.Uri.parse(workspaceFolder.uri.toString() + '/memory-bank');

    try {
      // Check if memory-bank exists
      await vscode.workspace.fs.stat(memoryBankPath);

      vscode.window.showInformationMessage('Memory Bank synced with workspace');
      log.info('Memory Bank synced with workspace');
    } catch {
      // Create memory-bank directory
      await vscode.workspace.fs.createDirectory(memoryBankPath);
      vscode.window.showInformationMessage('Created memory-bank directory');
    }
  }

  private generateMemoryBankHtml(): string {
    const memoriesHtml =
      Array.from(this.memories.values())
        .map(
          (m) => `
        <div class="memory-card ${m.type}">
          <div class="memory-header">
            <span class="memory-type">${m.type}</span>
            <span class="memory-date">${new Date(m.lastUpdated).toLocaleDateString()}</span>
          </div>
          <div class="memory-content">${m.content.substring(0, 100)}...</div>
        </div>
      `
        )
        .join('') || '<p>No memories stored yet.</p>';

    return `<!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: var(--vscode-font-family); padding: 20px; }
          h1 { color: var(--vscode-foreground); }
          .memory-card {
            background: var(--vscode-editor-background);
            border: 1px solid var(--vscode-editor-lineHighlightBorder);
            border-radius: 8px;
            padding: 16px;
            margin-bottom: 12px;
          }
          .memory-header { display: flex; justify-content: space-between; margin-bottom: 8px; }
          .memory-type { font-weight: bold; text-transform: capitalize; }
          .memory-date { color: var(--vscode-disabledForeground); font-size: 12px; }
          .memory-content { color: var(--vscode-descriptionForeground); }
          .actions { margin-top: 20px; display: flex; gap: 12px; flex-wrap: wrap; }
          .action-btn {
            background: var(--vscode-button-background);
            color: var(--vscode-button-foreground);
            border: none;
            padding: 8px 16px;
            border-radius: 4px;
            cursor: pointer;
          }
        </style>
      </head>
      <body>
        <h1>Memory Bank</h1>
        <p>Project context and memory management.</p>

        <div class="actions">
          <button class="action-btn" onclick="vscode.postMessage({command: 'activeContext'})">Active Context</button>
          <button class="action-btn" onclick="vscode.postMessage({command: 'projectBrief'})">Project Brief</button>
          <button class="action-btn" onclick="vscode.postMessage({command: 'systemPatterns'})">System Patterns</button>
          <button class="action-btn" onclick="vscode.postMessage({command: 'sync'})">Sync with Workspace</button>
        </div>

        <h2>Stored Memories</h2>
        ${memoriesHtml}
      </body>
      </html>`;
  }

  private generateContextHtml(type: string, title: string, content: string): string {
    return `<!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: var(--vscode-font-family); padding: 20px; }
          h1 { color: var(--vscode-foreground); }
          h3 { color: var(--vscode-foreground); }
          ul { color: var(--vscode-descriptionForeground); }
          .context-card {
            background: var(--vscode-editor-background);
            border: 1px solid var(--vscode-editor-lineHighlightBorder);
            border-radius: 8px;
            padding: 20px;
            margin-top: 20px;
          }
        </style>
      </head>
      <body>
        <h1>${title}</h1>
        <div class="context-card">
          ${content}
        </div>
      </body>
      </html>`;
  }

  private async loadMemories(): Promise<void> {
    const cached = this.context.workspaceState.get<MemoryContext[]>('memorybank.memories');
    if (cached) {
      for (const m of cached) {
        this.memories.set(m.id, m);
      }
    }
  }

  private async saveMemories(): Promise<void> {
    await this.context.workspaceState.update(
      'memorybank.memories',
      Array.from(this.memories.values())
    );
  }

  dispose(): void {
    this.statusBarItem?.dispose();
  }
}

export function getMemoryBankService(): MemoryBankService {
  return MemoryBankService.getMemoryBankService();
}
