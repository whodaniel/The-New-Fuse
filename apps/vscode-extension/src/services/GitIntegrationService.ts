/**
 * The New Fuse VSCode Extension - Git Integration Service
 *
 * Deep integration with VSCode's Git extension for enhanced context awareness
 * Provides git status, branch info, diff analysis, and commit history
 */

import * as vscode from 'vscode';
import { log } from '../utils/logger';

interface GitRepository {
  readonly rootUri: vscode.Uri;
  readonly state: GitRepositoryState;
  readonly inputBox: { value: string };
}

interface GitRepositoryState {
  readonly HEAD: GitBranch | undefined;
  readonly refs: GitRef[];
  readonly remotes: GitRemote[];
  readonly submodules: GitSubmodule[];
  readonly rebaseCommit: Commit | undefined;
  readonly mergeChanges: GitChange[];
  readonly indexChanges: GitChange[];
  readonly workingTreeChanges: GitChange[];
  readonly onDidChange: vscode.Event<void>;
}

interface GitBranch {
  readonly name: string;
  readonly commit?: string;
  readonly upstream?: GitBranch;
  readonly ahead?: number;
  readonly behind?: number;
}

interface GitRef {
  readonly type: number;
  readonly name?: string;
  readonly commit?: string;
  readonly remote?: string;
}

interface GitRemote {
  readonly name: string;
  readonly fetchUrl?: string;
  readonly pushUrl?: string;
  readonly isReadOnly: boolean;
}

interface GitSubmodule {
  readonly name: string;
  readonly path: string;
  readonly url: string;
}

interface Commit {
  readonly hash: string;
  readonly message: string;
  readonly parents: string[];
  readonly authorDate?: Date;
  readonly authorName?: string;
  readonly authorEmail?: string;
  readonly commitDate?: Date;
}

interface GitChange {
  readonly uri: vscode.Uri;
  readonly originalUri: vscode.Uri;
  readonly renameUri: vscode.Uri | undefined;
  readonly status: number;
}

interface GitAPI {
  readonly repositories: GitRepository[];
  readonly onDidOpenRepository: vscode.Event<GitRepository>;
  readonly onDidCloseRepository: vscode.Event<GitRepository>;
  getRepository(uri: vscode.Uri): GitRepository | null;
}

export class GitIntegrationService {
  private static instance: GitIntegrationService;
  private gitExtension?: vscode.Extension<{ getAPI(version: number): GitAPI }>;
  private gitAPI?: GitAPI;
  private repositories: GitRepository[] = [];

  private constructor() {}

  public static getInstance(): GitIntegrationService {
    if (!GitIntegrationService.instance) {
      GitIntegrationService.instance = new GitIntegrationService();
    }
    return GitIntegrationService.instance;
  }

  /**
   * Initialize Git integration
   */
  public async initialize(): Promise<void> {
    log.info('Initializing Git integration service...');

    try {
      // Get VSCode Git extension
      this.gitExtension = vscode.extensions.getExtension('vscode.git');

      if (!this.gitExtension) {
        log.warn('Git extension not found');
        return;
      }

      // Activate if not already activated
      if (!this.gitExtension.isActive) {
        await this.gitExtension.activate();
      }

      // Get Git API
      const gitExtensionExports = this.gitExtension.exports;
      this.gitAPI = gitExtensionExports.getAPI(1);

      if (!this.gitAPI) {
        log.warn('Git API not available');
        return;
      }

      // Get existing repositories
      this.repositories = this.gitAPI.repositories;

      // Listen for repository changes
      this.gitAPI.onDidOpenRepository((repo) => {
        log.info(`Git repository opened: ${repo.rootUri.fsPath}`);
        this.repositories.push(repo);
      });

      this.gitAPI.onDidCloseRepository((repo) => {
        log.info(`Git repository closed: ${repo.rootUri.fsPath}`);
        this.repositories = this.repositories.filter((r) => r !== repo);
      });

      log.info(`Git integration initialized with ${this.repositories.length} repositories`);
    } catch (error) {
      log.error('Failed to initialize Git integration', error);
    }
  }

  /**
   * Get repository for a file URI
   */
  public getRepository(uri: vscode.Uri): GitRepository | null {
    if (!this.gitAPI) {
      return null;
    }

    return this.gitAPI.getRepository(uri);
  }

  /**
   * Get current branch name
   */
  public getCurrentBranch(uri: vscode.Uri): string | null {
    const repo = this.getRepository(uri);
    return repo?.state.HEAD?.name || null;
  }

  /**
   * Get current commit hash
   */
  public getCurrentCommit(uri: vscode.Uri): string | null {
    const repo = this.getRepository(uri);
    return repo?.state.HEAD?.commit || null;
  }

  /**
   * Get upstream branch info
   */
  public getUpstreamInfo(uri: vscode.Uri): { ahead: number; behind: number } | null {
    const repo = this.getRepository(uri);
    const head = repo?.state.HEAD;

    if (!head?.upstream) {
      return null;
    }

    return {
      ahead: head.ahead || 0,
      behind: head.behind || 0,
    };
  }

  /**
   * Get working tree changes (unstaged changes)
   */
  public getWorkingTreeChanges(uri: vscode.Uri): GitChange[] {
    const repo = this.getRepository(uri);
    return repo?.state.workingTreeChanges || [];
  }

  /**
   * Get index changes (staged changes)
   */
  public getIndexChanges(uri: vscode.Uri): GitChange[] {
    const repo = this.getRepository(uri);
    return repo?.state.indexChanges || [];
  }

  /**
   * Get all changes (staged + unstaged)
   */
  public getAllChanges(uri: vscode.Uri): GitChange[] {
    const repo = this.getRepository(uri);
    if (!repo) {
      return [];
    }

    return [...repo.state.indexChanges, ...repo.state.workingTreeChanges];
  }

  /**
   * Get file status
   */
  public getFileStatus(uri: vscode.Uri): string | null {
    const repo = this.getRepository(uri);
    if (!repo) {
      return null;
    }

    const allChanges = this.getAllChanges(uri);
    const change = allChanges.find((c) => c.uri.toString() === uri.toString());

    if (!change) {
      return 'unmodified';
    }

    // Map status codes to readable strings
    const statusMap: Record<number, string> = {
      0: 'index_modified',
      1: 'index_added',
      2: 'index_deleted',
      3: 'index_renamed',
      4: 'index_copied',
      5: 'modified',
      6: 'deleted',
      7: 'untracked',
      8: 'ignored',
      9: 'intent_to_add',
      10: 'added_by_us',
      11: 'deleted_by_us',
      12: 'added_by_them',
      13: 'deleted_by_them',
      14: 'both_added',
      15: 'both_deleted',
      16: 'both_modified',
    };

    return statusMap[change.status] || 'unknown';
  }

  /**
   * Get diff for a file
   */
  public async getFileDiff(uri: vscode.Uri): Promise<string | null> {
    try {
      const repo = this.getRepository(uri);
      if (!repo) {
        return null;
      }

      // Get changes
      const changes = this.getAllChanges(uri);
      const change = changes.find((c) => c.uri.toString() === uri.toString());

      if (!change) {
        return null;
      }

      // Open diff
      const originalUri = change.originalUri;
      const modifiedUri = change.uri;

      const originalDoc = await vscode.workspace.openTextDocument(originalUri);
      const modifiedDoc = await vscode.workspace.openTextDocument(modifiedUri);

      const originalText = originalDoc.getText();
      const modifiedText = modifiedDoc.getText();

      // Generate unified diff (simple implementation)
      return this.generateUnifiedDiff(originalText, modifiedText, uri.fsPath);
    } catch (error) {
      log.error('Failed to get file diff', error);
      return null;
    }
  }

  /**
   * Generate unified diff
   */
  private generateUnifiedDiff(original: string, modified: string, filePath: string): string {
    // This is a simplified diff generator
    // For production, consider using a diff library like 'diff'

    const originalLines = original.split('\n');
    const modifiedLines = modified.split('\n');

    let diff = `--- ${filePath}\n+++ ${filePath}\n`;

    const maxLines = Math.max(originalLines.length, modifiedLines.length);

    for (let i = 0; i < maxLines; i++) {
      const origLine = originalLines[i] || '';
      const modLine = modifiedLines[i] || '';

      if (origLine !== modLine) {
        if (origLine) {
          diff += `- ${origLine}\n`;
        }
        if (modLine) {
          diff += `+ ${modLine}\n`;
        }
      } else {
        diff += `  ${origLine}\n`;
      }
    }

    return diff;
  }

  /**
   * Get repository summary for AI context
   */
  public getRepositorySummary(uri: vscode.Uri): string {
    const repo = this.getRepository(uri);
    if (!repo) {
      return 'Not a git repository';
    }

    const branch = this.getCurrentBranch(uri);
    const commit = this.getCurrentCommit(uri);
    const upstream = this.getUpstreamInfo(uri);
    const workingTreeChanges = this.getWorkingTreeChanges(uri);
    const indexChanges = this.getIndexChanges(uri);

    let summary = `Git Repository: ${repo.rootUri.fsPath}\n`;
    summary += `Branch: ${branch || 'unknown'}\n`;
    summary += `Commit: ${commit ? commit.substring(0, 8) : 'unknown'}\n`;

    if (upstream) {
      summary += `Upstream: ahead ${upstream.ahead}, behind ${upstream.behind}\n`;
    }

    summary += `Changes:\n`;
    summary += `  Staged: ${indexChanges.length} files\n`;
    summary += `  Unstaged: ${workingTreeChanges.length} files\n`;

    if (indexChanges.length > 0) {
      summary += `\nStaged files:\n`;
      for (const change of indexChanges) {
        summary += `  - ${vscode.workspace.asRelativePath(change.uri)}\n`;
      }
    }

    if (workingTreeChanges.length > 0) {
      summary += `\nUnstaged files:\n`;
      for (const change of workingTreeChanges) {
        summary += `  - ${vscode.workspace.asRelativePath(change.uri)}\n`;
      }
    }

    return summary;
  }

  /**
   * Get all repositories
   */
  public getRepositories(): GitRepository[] {
    return this.repositories;
  }

  /**
   * Check if Git is available
   */
  public isAvailable(): boolean {
    return !!this.gitAPI;
  }

  /**
   * Dispose resources
   */
  public dispose(): void {
    // Nothing to dispose
  }
}

/**
 * Get the singleton instance
 */
export function getGitIntegrationService(): GitIntegrationService {
  return GitIntegrationService.getInstance();
}
