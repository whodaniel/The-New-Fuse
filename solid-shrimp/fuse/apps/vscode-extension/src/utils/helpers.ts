/**
 * The New Fuse VSCode Extension - Helper Utilities
 * Version 9.0.0 - Clean Architecture
 */

import * as vscode from 'vscode';

/**
 * Generate a unique ID
 */
export function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Delay execution for specified milliseconds
 */
export function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Debounce function execution
 */
export function debounce<T extends (...args: unknown[]) => unknown>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout | null = null;

  return (...args: Parameters<T>) => {
    if (timeout) clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}

/**
 * Throttle function execution
 */
export function throttle<T extends (...args: unknown[]) => unknown>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle = false;

  return (...args: Parameters<T>) => {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => (inThrottle = false), limit);
    }
  };
}

/**
 * Get the currently selected text in the editor
 */
export function getSelectedText(): string | undefined {
  const editor = vscode.window.activeTextEditor;
  if (!editor) return undefined;

  const selection = editor.selection;
  if (selection.isEmpty) return undefined;

  return editor.document.getText(selection);
}

/**
 * Get the current file's content
 */
export function getCurrentFileContent(): string | undefined {
  const editor = vscode.window.activeTextEditor;
  return editor?.document.getText();
}

/**
 * Get the current file's language ID
 */
export function getCurrentLanguageId(): string | undefined {
  const editor = vscode.window.activeTextEditor;
  return editor?.document.languageId;
}

/**
 * Get the current file's path
 */
export function getCurrentFilePath(): string | undefined {
  const editor = vscode.window.activeTextEditor;
  return editor?.document.uri.fsPath;
}

/**
 * Insert text at the cursor position
 */
export async function insertTextAtCursor(text: string): Promise<boolean> {
  const editor = vscode.window.activeTextEditor;
  if (!editor) return false;

  return editor.edit((editBuilder) => {
    editBuilder.insert(editor.selection.active, text);
  });
}

/**
 * Replace the current selection with text
 */
export async function replaceSelection(text: string): Promise<boolean> {
  const editor = vscode.window.activeTextEditor;
  if (!editor) return false;

  return editor.edit((editBuilder) => {
    editBuilder.replace(editor.selection, text);
  });
}

/**
 * Show a quick pick with items
 */
export async function showQuickPick<T extends vscode.QuickPickItem>(
  items: T[],
  options?: vscode.QuickPickOptions
): Promise<T | undefined> {
  return vscode.window.showQuickPick(items, options) as Promise<T | undefined>;
}

/**
 * Show an input box
 */
export async function showInputBox(options?: vscode.InputBoxOptions): Promise<string | undefined> {
  return vscode.window.showInputBox(options);
}

/**
 * Show an information message with optional actions
 */
export async function showInfo(message: string, ...actions: string[]): Promise<string | undefined> {
  return vscode.window.showInformationMessage(message, ...actions);
}

/**
 * Show a warning message with optional actions
 */
export async function showWarning(
  message: string,
  ...actions: string[]
): Promise<string | undefined> {
  return vscode.window.showWarningMessage(message, ...actions);
}

/**
 * Show an error message with optional actions
 */
export async function showError(
  message: string,
  ...actions: string[]
): Promise<string | undefined> {
  return vscode.window.showErrorMessage(message, ...actions);
}

/**
 * Show a progress notification
 */
export async function withProgress<T>(
  title: string,
  task: (progress: vscode.Progress<{ message?: string; increment?: number }>) => Promise<T>
): Promise<T> {
  return vscode.window.withProgress(
    {
      location: vscode.ProgressLocation.Notification,
      title,
      cancellable: false,
    },
    task
  );
}

/**
 * Format bytes to human-readable string
 */
export function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

/**
 * Truncate string to specified length
 */
export function truncate(str: string, maxLength: number): string {
  if (str.length <= maxLength) return str;
  return str.slice(0, maxLength - 3) + '...';
}

/**
 * Escape HTML special characters
 */
export function escapeHtml(text: string): string {
  const map: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;',
  };
  return text.replace(/[&<>"']/g, (m) => map[m]);
}

/**
 * Parse JSON safely with default value
 */
export function parseJsonSafe<T>(json: string, defaultValue: T): T {
  try {
    return JSON.parse(json) as T;
  } catch {
    return defaultValue;
  }
}
