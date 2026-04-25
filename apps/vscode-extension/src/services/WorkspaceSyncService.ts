import * as vscode from 'vscode';
import { WorkspaceMirrorService } from '../../../../packages/sync-core/src';

/**
 * WorkspaceSyncService
 *
 * Manages the bidirectional synchronization between the local VS Code workspace
 * and the remote TNF Cloud Sandbox.
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

    this.mirrorService = new WorkspaceMirrorService({
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
