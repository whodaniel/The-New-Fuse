import * as vscode from 'vscode';
import { CodeTask } from './A2ACoordinator.js';
import { FileCreationCoordinationService } from '../coordination/FileCreationCoordinationService';
import { EventEmitter2 } from '@nestjs/event-emitter';

/**
 * Enhanced Task Handler that integrates with the File Creation Participants system
 * Provides coordination capabilities for multi-agent file operations
 */
export class EnhancedTaskHandler {
  private coordinationService: FileCreationCoordinationService | null = null;
  
  constructor(
    private readonly eventEmitter: EventEmitter2
  ) {}

  /**
   * Set the coordination service
   */
  public setCoordinationService(service: FileCreationCoordinationService): void {
    this.coordinationService = service;
  }

  /**
   * Handle a code task with enhanced multi-agent coordination
   */
  async handleCodeTask(task: CodeTask, agentId: string): Promise<void> {
    const uri = vscode.Uri.file(task.filePath);
    
    try {
      // Check if file exists - if not, this will trigger file creation coordination
      const fileExists = await this.fileExists(uri);
      
      if (!fileExists) {
        // File creation will be coordinated through the participants system
        await this.handleNewFileCreation(task, agentId, uri);
      } else {
        // File exists, handle modification with coordination
        await this.handleFileModification(task, agentId, uri);
      }
      
    } catch (error) {
      console.error(`[EnhancedTaskHandler] Error processing task ${task.taskId}:`, error);
      throw error;
    }
  }

  /**
   * Handle creation of a new file with agent coordination
   */
  private async handleNewFileCreation(task: CodeTask, agentId: string, uri: vscode.Uri): Promise<void> {
    console.log(`[EnhancedTaskHandler] ${agentId} creating new file: ${task.filePath}`);
    
    // Create the file first - this will trigger the coordination system
    await vscode.workspace.fs.writeFile(uri, new TextEncoder().encode(''));
    
    // Wait a moment for coordination to complete
    await this.waitForCoordination(uri);
    
    // Now apply the actual content
    await this.applyTaskContent(task, agentId, uri);
  }

  /**
   * Handle modification of existing file with coordination awareness
   */
  private async handleFileModification(task: CodeTask, agentId: string, uri: vscode.Uri): Promise<void> {
    console.log(`[EnhancedTaskHandler] ${agentId} modifying existing file: ${task.filePath}`);
    
    // Check if other agents are currently working on this file
    const activeCoordinations = this.coordinationService?.getActiveCoordinations() || [];
    const fileCoordination = activeCoordinations.find(coord => 
      coord.fileEvent.uri.toString() === uri.toString()
    );
    
    if (fileCoordination) {
      console.log(`[EnhancedTaskHandler] Coordination in progress for ${task.filePath}, waiting...`);
      await this.waitForCoordinationCompletion(fileCoordination.id);
    }
    
    // Apply the task content
    await this.applyTaskContent(task, agentId, uri);
  }

  /**
   * Apply the actual task content to the file
   */
  private async applyTaskContent(task: CodeTask, agentId: string, uri: vscode.Uri): Promise<void> {
    const doc = await vscode.workspace.openTextDocument(uri);
    const edit = new vscode.WorkspaceEdit();

    // Add agent processing comment
    const comment = `// [${agentId}] processed task ${task.taskId} at ${new Date().toISOString()}\n`;
    
    // Check if we have template content prepared by the template agent
    const templateKey = `file-template:${uri.toString()}`;
    const config = vscode.workspace.getConfiguration();
    const templateContent = config.get<string>(templateKey);
    
    let contentToInsert = comment;
    
    if (templateContent && doc.getText().trim() === '') {
      // Use template content if file is empty and template is available
      contentToInsert = templateContent + '\n' + comment;
      edit.replace(uri, new vscode.Range(0, 0, doc.lineCount, 0), contentToInsert);
    } else {
      // Just add the processing comment
      edit.insert(uri, new vscode.Position(0, 0), comment);
    }

    // Add task-specific content if provided
    if (task.content) {
      const endPosition = new vscode.Position(doc.lineCount, 0);
      edit.insert(uri, endPosition, `\n// Task content:\n${task.content}\n`);
    }

    const applied = await vscode.workspace.applyEdit(edit);
    if (!applied) {
      throw new Error(`Failed to apply edits for task ${task.taskId}`);
    }

    await doc.save();
    
    // Emit event about task completion
    this.eventEmitter.emit('task.completed', {
      taskId: task.taskId,
      agentId,
      filePath: task.filePath,
      timestamp: Date.now()
    });
    
    console.log(`[EnhancedTaskHandler] ${agentId} successfully applied edits to ${task.filePath}`);
  }

  /**
   * Wait for file creation coordination to complete
   */
  private async waitForCoordination(uri: vscode.Uri): Promise<void> {
    const maxWait = 10000; // 10 seconds
    const checkInterval = 100; // 100ms
    let waited = 0;
    
    while (waited < maxWait) {
      const activeCoordinations = this.coordinationService?.getActiveCoordinations() || [];
      const fileCoordination = activeCoordinations.find(coord => 
        coord.fileEvent.uri.toString() === uri.toString()
      );
      
      if (!fileCoordination || fileCoordination.status === 'COMPLETED') {
        break;
      }
      
      await this.sleep(checkInterval);
      waited += checkInterval;
    }
  }

  /**
   * Wait for a specific coordination to complete
   */
  private async waitForCoordinationCompletion(coordinationId: string): Promise<void> {
    const maxWait = 15000; // 15 seconds
    const checkInterval = 200; // 200ms
    let waited = 0;
    
    while (waited < maxWait) {
      const coordination = this.coordinationService?.getCoordinationSession(coordinationId);
      
      if (!coordination || coordination.status === 'COMPLETED' || coordination.status === 'FAILED') {
        break;
      }
      
      await this.sleep(checkInterval);
      waited += checkInterval;
    }
  }

  /**
   * Check if a file exists
   */
  private async fileExists(uri: vscode.Uri): Promise<boolean> {
    try {
      await vscode.workspace.fs.stat(uri);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Sleep utility
   */
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Register as a file creation participant for task handling
   */
  public registerAsParticipant(): void {
    if (!this.coordinationService) return;

    const taskHandlerParticipant = {
      agentId: 'task-handler-agent',
      agentName: 'Task Handler Agent',
      capabilities: ['task-processing', 'file-operations', 'workspace-edits'],
      priority: 60, // Medium priority

      async participate(event: any) {
        // Participate in files that might need task processing
        const needsTaskProcessing = 
          event.metadata?.hasActiveTasks ||
          event.fileName.includes('task') ||
          event.fileName.includes('todo');

        if (!needsTaskProcessing) {
          return { willParticipate: false };
        }

        return {
          willParticipate: true,
          estimatedDuration: 400,
          preparationTasks: [
            async () => {
              // Prepare task processing context
              const taskContext = {
                fileUri: event.uri.toString(),
                preparedForTasks: true,
                preparedAt: Date.now()
              };

              await vscode.workspace.getConfiguration().update(
                `task-context:${event.uri.toString()}`,
                taskContext,
                vscode.ConfigurationTarget.Workspace
              );
            }
          ],
          coordinationNeeded: {
            agentIds: ['template-agent', 'code-analysis-agent'],
            reason: 'Task processing needs coordination with template and analysis agents'
          }
        };
      }
    };

    this.coordinationService.registerCustomParticipant(taskHandlerParticipant);
    console.log('[EnhancedTaskHandler] Registered as file creation participant');
  }
}

/**
 * Backward compatibility function - enhanced version of the original handleCodeTask
 */
export async function handleCodeTask(task: CodeTask, agentId: string): Promise<void> {
  // Create a temporary enhanced handler for backward compatibility
  const handler = new EnhancedTaskHandler(new EventEmitter2());
  await handler.handleCodeTask(task, agentId);
}

/**
 * Export the enhanced handler as default
 */
export default EnhancedTaskHandler;
