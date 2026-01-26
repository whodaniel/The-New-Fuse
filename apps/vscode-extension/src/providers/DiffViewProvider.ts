/**
 * The New Fuse VSCode Extension - Diff View Provider
 *
 * Provides inline diff view for AI-proposed code changes
 * Shows changes before applying them for user approval
 */

import * as vscode from 'vscode';
import { log } from '../utils/logger';

export interface CodeChange {
  uri: vscode.Uri;
  originalContent: string;
  modifiedContent: string;
  description?: string;
}

export class DiffViewProvider {
  private static instance: DiffViewProvider;
  private pendingChanges: Map<string, CodeChange> = new Map();
  private decorationType: vscode.TextEditorDecorationType;

  private constructor() {
    // Create decoration type for highlighting proposed changes
    this.decorationType = vscode.window.createTextEditorDecorationType({
      backgroundColor: new vscode.ThemeColor('diffEditor.insertedTextBackground'),
      isWholeLine: true,
      overviewRulerColor: new vscode.ThemeColor('diffEditor.insertedTextBorder'),
      overviewRulerLane: vscode.OverviewRulerLane.Left,
    });
  }

  public static getInstance(): DiffViewProvider {
    if (!DiffViewProvider.instance) {
      DiffViewProvider.instance = new DiffViewProvider();
    }
    return DiffViewProvider.instance;
  }

  /**
   * Show a diff view for proposed code changes
   */
  public async showDiff(change: CodeChange): Promise<'accept' | 'reject' | 'modify'> {
    const changeId = change.uri.toString();
    this.pendingChanges.set(changeId, change);

    try {
      // Create a temporary file with the modified content
      const tempUri = change.uri.with({
        scheme: 'tnf-proposed',
        path: change.uri.path + '.proposed',
      });

      // Register a text document content provider for the proposed changes
      const provider = new ProposedChangeContentProvider(this.pendingChanges);
      const disposable = vscode.workspace.registerTextDocumentContentProvider(
        'tnf-proposed',
        provider
      );

      // Open diff editor
      const title = `${vscode.workspace.asRelativePath(change.uri)} (AI Proposed Changes)`;
      await vscode.commands.executeCommand('vscode.diff', change.uri, tempUri, title, {
        preview: true,
        preserveFocus: false,
      });

      // Show quick pick for user decision
      const decision = await vscode.window.showQuickPick(
        [
          {
            label: '$(check) Accept Changes',
            description: 'Apply the proposed changes',
            value: 'accept' as const,
          },
          {
            label: '$(edit) Modify',
            description: 'Open the file to modify the changes manually',
            value: 'modify' as const,
          },
          {
            label: '$(close) Reject',
            description: 'Discard the proposed changes',
            value: 'reject' as const,
          },
        ],
        {
          placeHolder: change.description || 'Review the proposed changes',
          ignoreFocusOut: true,
        }
      );

      disposable.dispose();

      if (!decision) {
        return 'reject';
      }

      if (decision.value === 'accept') {
        await this.applyChange(change);
      }

      return decision.value;
    } catch (error) {
      log.error('Failed to show diff view', error);
      vscode.window.showErrorMessage(`Failed to show diff: ${(error as Error).message}`);
      return 'reject';
    } finally {
      this.pendingChanges.delete(changeId);
    }
  }

  /**
   * Apply the code change to the file
   */
  private async applyChange(change: CodeChange): Promise<void> {
    try {
      const edit = new vscode.WorkspaceEdit();

      // Get the full range of the document
      const document = await vscode.workspace.openTextDocument(change.uri);
      const fullRange = new vscode.Range(
        document.positionAt(0),
        document.positionAt(document.getText().length)
      );

      edit.replace(change.uri, fullRange, change.modifiedContent);

      const success = await vscode.workspace.applyEdit(edit);

      if (success) {
        await document.save();
        vscode.window.showInformationMessage('✓ Changes applied successfully');
        log.info(`Applied changes to ${change.uri.fsPath}`);
      } else {
        throw new Error('Failed to apply edit');
      }
    } catch (error) {
      log.error('Failed to apply change', error);
      vscode.window.showErrorMessage(`Failed to apply changes: ${(error as Error).message}`);
    }
  }

  /**
   * Show diff for a range-based change (for partial file edits)
   */
  public async showRangeDiff(
    uri: vscode.Uri,
    range: vscode.Range,
    newText: string,
    description?: string
  ): Promise<'accept' | 'reject'> {
    try {
      const document = await vscode.workspace.openTextDocument(uri);
      const originalText = document.getText(range);

      const decision = await vscode.window.showQuickPick(
        [
          {
            label: '$(check) Accept Change',
            description: description || 'Apply the proposed change',
            value: 'accept' as const,
          },
          {
            label: '$(close) Reject',
            description: 'Keep the original code',
            value: 'reject' as const,
          },
        ],
        {
          placeHolder: 'Review the proposed change',
          ignoreFocusOut: true,
        }
      );

      if (decision?.value === 'accept') {
        const edit = new vscode.WorkspaceEdit();
        edit.replace(uri, range, newText);
        const success = await vscode.workspace.applyEdit(edit);

        if (success) {
          await document.save();
          vscode.window.showInformationMessage('✓ Change applied');
          return 'accept';
        }
      }

      return 'reject';
    } catch (error) {
      log.error('Failed to show range diff', error);
      return 'reject';
    }
  }

  /**
   * Highlight proposed changes in the active editor
   */
  public highlightChanges(editor: vscode.TextEditor, ranges: vscode.Range[]): void {
    editor.setDecorations(this.decorationType, ranges);
  }

  /**
   * Clear all highlights
   */
  public clearHighlights(editor: vscode.TextEditor): void {
    editor.setDecorations(this.decorationType, []);
  }

  /**
   * Dispose resources
   */
  public dispose(): void {
    this.decorationType.dispose();
    this.pendingChanges.clear();
  }
}

/**
 * Content provider for proposed changes
 */
class ProposedChangeContentProvider implements vscode.TextDocumentContentProvider {
  constructor(private pendingChanges: Map<string, CodeChange>) {}

  provideTextDocumentContent(uri: vscode.Uri): string {
    const originalUri = uri.with({
      scheme: 'file',
      path: uri.path.replace('.proposed', ''),
    });

    const change = this.pendingChanges.get(originalUri.toString());
    return change?.modifiedContent || '';
  }
}

/**
 * Get the singleton instance
 */
export function getDiffViewProvider(): DiffViewProvider {
  return DiffViewProvider.getInstance();
}
