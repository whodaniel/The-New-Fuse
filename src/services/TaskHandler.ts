import * as vscode from 'vscode';
import { CodeTask } from './A2ACoordinator.js';

/**
 * Simple handler that inserts a processing comment at the top of the target file
 * indicating which agent processed the task and when.
 */
export async function handleCodeTask(task: CodeTask, agentId: string): Promise<void> {
  const uri = vscode.Uri.file(task.filePath);
  const doc = await vscode.workspace.openTextDocument(uri);
  const edit = new vscode.WorkspaceEdit();

  const comment = `// [${agentId}] processed task ${task.taskId} at ${new Date().toISOString()}\n`;
  edit.insert(uri, new vscode.Position(0, 0), comment);

  const applied = await vscode.workspace.applyEdit(edit);
  if (!applied) {
    throw new Error(`Failed to apply edits for task ${task.taskId}`);
  }

  await doc.save();
  console.log(`[TaskHandler] ${agentId} applied edits to ${task.filePath}`);
}