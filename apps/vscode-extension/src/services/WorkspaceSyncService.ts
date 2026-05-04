import * as vscode from 'vscode';
import { log } from '../utils/logger';

interface WsConnection {
  readyState: number;
  send: (data: string) => void;
  close: () => void;
  onopen: (() => void) | null;
  onclose: (() => void) | null;
  onerror: ((err: Event) => void) | null;
  onmessage: ((event: { data: string }) => void) | null;
}

interface WorkspaceMirrorOptions {
  localPath: string;
  remoteEndpoint: string;
  tenantId: string;
}

interface WorkspaceMirrorService {
  start(): Promise<void>;
  stop(): Promise<void>;
}

/**
 * WorkspaceSyncService
 *
 * Manages the bidirectional synchronization between the local VS Code workspace
 * and the remote TNF Cloud Sandbox.
 *
 * Uses dynamic import to load @the-new-fuse/sync-core at runtime,
 * avoiding broken relative paths that fail in VSIX packaging.
 */
export class WorkspaceSyncService {
  private mirrorService: WorkspaceMirrorService | null = null;
  private statusItem: vscode.StatusBarItem;

  constructor() {
    this.statusItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, 100);
    this.statusItem.text = '$(sync~spin) TNF Sync: Off';
    this.statusItem.tooltip = 'TNF Cloud Workspace Mirror Status';
    this.statusItem.command = 'theNewFuse.toggleWorkspaceSync';
  }

  private async createMirrorService(
    options: WorkspaceMirrorOptions
  ): Promise<WorkspaceMirrorService> {
    try {
      // @ts-ignore - dynamic import with fallback if package unavailable
      const mod = await import('@the-new-fuse/sync-core');
      const Ctor = mod.WorkspaceMirrorService || mod.default?.WorkspaceMirrorService;
      if (Ctor) {
        return new Ctor(options);
      }
    } catch {
      log.warn('@the-new-fuse/sync-core not available, using built-in sync');
    }

    return new BuiltinWorkspaceMirrorService(options);
  }

  /**
   * Start syncing the current workspace
   */
  public async startSync(): Promise<void> {
    const workspaceFolders = vscode.workspace.workspaceFolders;
    if (!workspaceFolders || workspaceFolders.length === 0) {
      vscode.window.showErrorMessage('No workspace folder open to sync.');
      return;
    }

    const localPath = workspaceFolders[0].uri.fsPath;
    const remoteEndpoint =
      vscode.workspace.getConfiguration('theNewFuse').get<string>('cloudSandboxUrl') ||
      'wss://api-gateway.tnf.computer/ws/sync';

    this.mirrorService = await this.createMirrorService({
      localPath,
      remoteEndpoint,
      tenantId: 'vscode-user',
    });

    try {
      this.statusItem.text = '$(sync~spin) TNF Sync: Starting...';
      this.statusItem.show();

      await this.mirrorService.start();

      this.statusItem.text = '$(sync) TNF Sync: On';
      this.statusItem.backgroundColor = new vscode.ThemeColor('statusBarItem.prominentBackground');
      vscode.window.showInformationMessage(
        `Workspace mirroring started: ${localPath} -> TNF Cloud`
      );
    } catch (error) {
      this.statusItem.text = '$(error) TNF Sync: Error';
      this.statusItem.backgroundColor = new vscode.ThemeColor('statusBarItem.errorBackground');
      vscode.window.showErrorMessage(`Failed to start workspace sync: ${error}`);
    }
  }

  /**
   * Stop syncing
   */
  public async stopSync(): Promise<void> {
    if (this.mirrorService) {
      await this.mirrorService.stop();
      this.mirrorService = null;
    }
    this.statusItem.text = '$(sync~spin) TNF Sync: Off';
    this.statusItem.backgroundColor = undefined;
    vscode.window.showInformationMessage('Workspace mirroring stopped.');
  }

  /**
   * Toggle sync state
   */
  public async toggleSync(): Promise<void> {
    if (this.mirrorService) {
      await this.stopSync();
    } else {
      await this.startSync();
    }
  }

  /**
   * Dispose resources
   */
  public dispose(): void {
    this.stopSync();
    this.statusItem.dispose();
  }
}

class BuiltinWorkspaceMirrorService implements WorkspaceMirrorService {
  private options: WorkspaceMirrorOptions;
  private ws: WsConnection | null = null;
  private fileWatcher: vscode.FileSystemWatcher | null = null;

  constructor(options: WorkspaceMirrorOptions) {
    this.options = options;
  }

  async start(): Promise<void> {
    log.info(`[WorkspaceSync] Connecting to ${this.options.remoteEndpoint}`);

    try {
      const wsMod = await import('ws');
      const WS = wsMod.default || wsMod;
      this.ws = new WS(this.options.remoteEndpoint) as unknown as WsConnection;

      this.ws.onopen = () => {
        log.info('[WorkspaceSync] Connected to cloud mirror');
      };

      this.ws.onclose = () => {
        log.info('[WorkspaceSync] Disconnected from cloud mirror');
      };

      this.ws.onerror = (err: Event) => {
        log.error('[WorkspaceSync] WebSocket error:', err);
      };
    } catch {
      log.warn('[WorkspaceSync] ws module unavailable; sync will operate in file-watch-only mode');
    }

    this.fileWatcher = vscode.workspace.createFileSystemWatcher(
      new vscode.RelativePattern(this.options.localPath, '**/*')
    );

    this.fileWatcher.onDidChange((uri) => this.handleChange('change', uri));
    this.fileWatcher.onDidCreate((uri) => this.handleChange('create', uri));
    this.fileWatcher.onDidDelete((uri) => this.handleChange('delete', uri));

    log.info('[WorkspaceSync] File watcher started');
  }

  private handleChange(eventType: string, uri: vscode.Uri): void {
    if (!this.ws || this.ws.readyState !== 1) return;

    const message = JSON.stringify({
      type: 'file_change',
      event: eventType,
      path: uri.fsPath,
      tenantId: this.options.tenantId,
      timestamp: new Date().toISOString(),
    });

    this.ws.send(message);
  }

  async stop(): Promise<void> {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    if (this.fileWatcher) {
      this.fileWatcher.dispose();
      this.fileWatcher = null;
    }
    log.info('[WorkspaceSync] Stopped');
  }
}
