/**
 * Enhanced AI Workflow for Next Edit Suggestions
 * This implementation leverages VS Code April 2025 features including:
 * - Next Edit Suggestions (NES)
 * - Streamable HTTP transport for MCP
 * - Real-time progress reporting
 * - Enhanced UI integrations
 */

import * as vscode from 'vscode';
import { AITask, AICollaborationWorkflow } from '../types/ai-collaboration.js';
import { MCPClient } from '../mcp/mcp-client.js';
import { EventEmitter } from 'events';

/**
 * Enhanced Workflow Manager for Next Edit Suggestions
 * Handles creation and execution of AI workflows with real-time progress updates
 */
export class NESWorkflowManager extends EventEmitter {
    private context: vscode.ExtensionContext;
    private mcpClient: MCPClient;
    private statusBarItem: vscode.StatusBarItem;
    private activeWorkflows: Map<string, AICollaborationWorkflow> = new Map();
    private progressBars: Map<string, vscode.Progress<{ message?: string; increment?: number }>> = new Map();
    private cancelTokens: Map<string, vscode.CancellationTokenSource> = new Map();

    constructor(context: vscode.ExtensionContext, mcpClient: MCPClient) {
        super();
        this.context = context;
        this.mcpClient = mcpClient;
        this.statusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, 100);
        this.statusBarItem.text = "$(rocket) NES";
        this.statusBarItem.tooltip = "Next Edit Suggestions Workflows";
        this.statusBarItem.command = 'thefuse.nes.showActiveWorkflows';
        this.context.subscriptions.push(this.statusBarItem);
        this.registerCommands();
    }

    /**
     * Register all NES-related commands
     */
    private registerCommands(): void {
        this.context.subscriptions.push(
            vscode.commands.registerCommand('thefuse.nes.createWorkflow', this.createWorkflow.bind(this)),
            vscode.commands.registerCommand('thefuse.nes.showActiveWorkflows', this.showActiveWorkflows.bind(this)),
            vscode.commands.registerCommand('thefuse.nes.cancelWorkflow', this.cancelWorkflow.bind(this)),
            vscode.commands.registerCommand('thefuse.nes.applyNextEditSuggestion', this.applyNextEditSuggestion.bind(this))
        );
    }

    /**
     * Create a new NES workflow
     */
    async createWorkflow(): Promise<string> {
        // Prompt user for workflow details
        const workflowName = await vscode.window.showInputBox({
            title: 'Create Next Edit Suggestion Workflow',
            prompt: 'Enter a name for this workflow',
            placeHolder: 'e.g., Refactor authentication logic'
        });

        if (!workflowName) {
            return '';
        }

        // Create workflow ID
        const workflowId = `nes_workflow_${Date.now()}`;

        // Create and start the workflow
        const workflow: AICollaborationWorkflow = {
            id: workflowId,
            name: workflowName,
            description: `NES workflow: ${workflowName}`,
            tasks: [],
            status: 'pending',
            progress: 0,
            startTime: new Date(),
            owner: 'user',
            priority: 'medium',
            tags: ['next-edit-suggestions', 'ai-workflow'],
            notifyOnCompletion: true,
            uiElements: {
                panelId: 'nes-workflow-panel',
                iconPath: 'resources/icons/nes-workflow.svg',
                contextActions: [{
                    label: 'Apply All Suggestions',
                    command: 'thefuse.nes.applyAllSuggestions',
                    args: [workflowId]
                }]
            }
        };

        // Add to active workflows
        this.activeWorkflows.set(workflowId, workflow);

        // Show status bar
        this.updateStatusBar();

        // Start the workflow with progress
        await this.runWorkflowWithProgress(workflow);

        return workflowId;
    }

    /**
     * Show all active NES workflows
     */
    async showActiveWorkflows(): Promise<void> {
        if (this.activeWorkflows.size === 0) {
            vscode.window.showInformationMessage('No active Next Edit Suggestions workflows');
            return;
        }

        const workflowItems = Array.from(this.activeWorkflows.values()).map(workflow => ({
            label: workflow.name,
            description: `Progress: ${workflow.progress}%, Status: ${workflow.status}`,
            workflow
        }));

        const selected = await vscode.window.showQuickPick(workflowItems, {
            placeHolder: 'Select a workflow to view or manage'
        });

        if (selected) {
            // Show workflow details panel
            this.showWorkflowDetailsPanel(selected.workflow);
        }
    }

    /**
     * Cancel an active workflow
     */
    async cancelWorkflow(workflowId?: string): Promise<void> {
        if (!workflowId) {
            const workflowItems = Array.from(this.activeWorkflows.values()).map(workflow => ({
                label: workflow.name,
                description: `Progress: ${workflow.progress}%, Status: ${workflow.status}`,
                id: workflow.id
            }));

            const selected = await vscode.window.showQuickPick(workflowItems, {
                placeHolder: 'Select a workflow to cancel'
            });

            if (selected) {
                workflowId = selected.id;
            } else {
                return;
            }
        }

        const cancelTokenSource = this.cancelTokens.get(workflowId);
        if (cancelTokenSource) {
            cancelTokenSource.cancel();
            this.cancelTokens.delete(workflowId);
        }

        const workflow = this.activeWorkflows.get(workflowId);
        if (workflow) {
            workflow.status = 'failed';
            workflow.error = 'Cancelled by user';
            workflow.endTime = new Date();
            workflow.duration = workflow.endTime.getTime() - workflow.startTime!.getTime();
            
            this.emit('workflowCancelled', workflow);
            vscode.window.showInformationMessage(`Workflow "${workflow.name}" cancelled`);
        }

        this.updateStatusBar();
    }

    /**
     * Apply a specific next edit suggestion
     */
    async applyNextEditSuggestion(taskId: string): Promise<void> {
        // Find the task
        let task: AITask | undefined;
        // let edit: any | undefined; // Declare edit here
         for (const workflow of this.activeWorkflows.values()) {
             task = workflow.tasks.find(t => t.id === taskId);
             if (task) {
                 break;
             }
         }

         if (!task || task.status !== 'completed') {
             vscode.window.showErrorMessage('Cannot apply suggestion: Task not found or not completed');
             return;
         }

         // Apply the edit suggestion
         try {
            const edit = task.output?.suggestion; // Initialize edit from task
             if (edit && edit.fileEdits) { // Check if edit and fileEdits exist
                const workspaceEdit = new vscode.WorkspaceEdit();

                for (const fileEdit of edit.fileEdits) {
                    const uri = vscode.Uri.file(fileEdit.filePath);
                    const range = new vscode.Range(
                        new vscode.Position(fileEdit.range.start.line, fileEdit.range.start.character),
                        new vscode.Position(fileEdit.range.end.line, fileEdit.range.end.character)
                    );
                    workspaceEdit.replace(uri, range, fileEdit.newText);
                }

                const success = await vscode.workspace.applyEdit(workspaceEdit);
                if (success) {
                    vscode.window.showInformationMessage(`Applied edit suggestion: ${task.output?.description || 'No description provided'}`);
                } else {
                    vscode.window.showErrorMessage('Failed to apply edit suggestion');
                }
            } else {
                vscode.window.showErrorMessage('No edit suggestion available');
            }
        } catch (error) {
            vscode.window.showErrorMessage(`Error applying suggestion: ${error.message}`);
        }
    }

    /**
     * Run a workflow with progress reporting
     */
    private async runWorkflowWithProgress(workflow: AICollaborationWorkflow): Promise<void> {
        const cancelTokenSource = new vscode.CancellationTokenSource();
        this.cancelTokens.set(workflow.id, cancelTokenSource);

        await vscode.window.withProgress({
            location: vscode.ProgressLocation.Notification,
            title: `Running ${workflow.name}`,
            cancellable: true
        }, async (progress, token) => {
            // Store progress object for updates
            this.progressBars.set(workflow.id, progress);
            
            // Handle cancellation
            token.onCancellationRequested(() => {
                this.cancelWorkflow(workflow.id);
            });

            // Start workflow
            try {
                workflow.status = 'running';
                this.emit('workflowStarted', workflow);

                // Create and add analysis task
                const analysisTask = await this.createAnalysisTask(workflow);
                workflow.tasks.push(analysisTask);
                
                // Update progress
                workflow.progress = 20;
                progress.report({ increment: 20, message: 'Analyzing codebase...' });
                
                // Execute analysis task
                await this.executeTask(analysisTask, progress);
                
                // If analysis was successful, create suggestion tasks
                if (analysisTask.status === 'completed') {
                    const analysisResult = analysisTask.output?.results || [];
                    
                    // Create suggestion tasks based on analysis
                    for (let i = 0; i < analysisResult.length; i++) {
                        const result = analysisResult[i];
                        const suggestionTask = await this.createSuggestionTask(workflow, result);
                        workflow.tasks.push(suggestionTask);
                        
                        // Calculate progress increment
                        const progressIncrement = 70 / analysisResult.length;
                        
                        // Update progress
                        workflow.progress = 20 + (progressIncrement * (i + 1));
                        progress.report({ 
                            increment: progressIncrement, 
                            message: `Generating edit suggestion ${i + 1} of ${analysisResult.length}...` 
                        });
                        
                        // Execute suggestion task
                        await this.executeTask(suggestionTask, progress);
                        
                        // If cancelled, break the loop
                        if (cancelTokenSource.token.isCancellationRequested) {
                            break;
                        }
                    }
                }
                
                // Complete workflow if not cancelled
                if (!cancelTokenSource.token.isCancellationRequested) {
                    // Update final progress
                    workflow.progress = 100;
                    progress.report({ increment: 10, message: 'Workflow completed' });
                    
                    workflow.status = 'completed';
                    workflow.endTime = new Date();
                    workflow.duration = workflow.endTime.getTime() - workflow.startTime!.getTime();
                    
                    // Emit completion event
                    this.emit('workflowCompleted', workflow);
                    
                    // Show completion message with suggestions count
                    const completedSuggestions = workflow.tasks
                        .filter(task => task.type === 'suggestion' && task.status === 'completed')
                        .length;
                    
                    vscode.window.showInformationMessage(
                        `${workflow.name} complete. Generated ${completedSuggestions} edit suggestions.`,
                        'View Suggestions'
                    ).then(selection => {
                        if (selection === 'View Suggestions') {
                            this.showWorkflowDetailsPanel(workflow);
                        }
                    });
                }
            } catch (error) {
                workflow.status = 'failed';
                workflow.error = error.message;
                workflow.endTime = new Date();
                workflow.duration = workflow.endTime.getTime() - workflow.startTime!.getTime();
                
                this.emit('workflowFailed', workflow);
                vscode.window.showErrorMessage(`Workflow "${workflow.name}" failed: ${error.message}`);
            } finally {
                // Remove progress bar reference
                this.progressBars.delete(workflow.id);
                this.updateStatusBar();
            }
        });
    }

    /**
     * Create an analysis task for the workflow
     */
    private async createAnalysisTask(workflow: AICollaborationWorkflow): Promise<AITask> {
        // Get active text editor
        const editor = vscode.window.activeTextEditor;
        const filePath = editor?.document.uri.fsPath || '';
        const fileContent = editor?.document.getText() || '';
        
        // Create task
        const task: AITask = {
            id: `${workflow.id}_analysis`,
            type: 'analysis',
            input: {
                filePath,
                fileContent,
                workspaceRoot: vscode.workspace.rootPath || ''
            },
            status: 'pending',
            progress: 0,
            progressMessage: 'Initializing analysis...',
            toolName: 'code-analysis',
            toolInput: {
                filePath,
                analysisType: 'edit-suggestions'
            }
        };
        
        return task;
    }

    /**
     * Create a suggestion task based on analysis results
     */
    private async createSuggestionTask(workflow: AICollaborationWorkflow, analysisResult: any): Promise<AITask> {
        // Create task
        const task: AITask = {
            id: `${workflow.id}_suggestion_${Date.now()}`,
            type: 'suggestion',
            input: {
                analysisResult,
                workspaceRoot: vscode.workspace.rootPath || ''
            },
            status: 'pending',
            progress: 0,
            progressMessage: 'Initializing suggestion generation...',
            toolName: 'edit-suggestion-generator',
            toolInput: {
                analysisResultId: analysisResult.id,
                suggestionType: 'next-edit'
            }
        };
        
        return task;
    }

    /**
     * Execute a task and update progress
     */
    private async executeTask(task: AITask, progress: vscode.Progress<{ message?: string; increment?: number }>): Promise<void> {
        // Update task status
        task.status = 'running';
        task.startTime = new Date();
        
        try {
            // Call MCP with streamable HTTP
            const result = await this.mcpClient.executeToolWithProgress(
                task.toolName!,
                task.toolInput!,
                (p: number, message: string) => {
                    // Update task progress
                    task.progress = p;
                    task.progressMessage = message;
                    
                    // Report progress to UI
                    progress.report({ message });
                    
                    // Emit progress event
                    this.emit('taskProgress', task);
                }
            );
            
            // Update task with result
            task.status = 'completed';
            task.output = result;
            task.endTime = new Date();
            task.duration = task.endTime.getTime() - task.startTime!.getTime();
            task.toolOutput = result;
            
            // Emit task completion event
            this.emit('taskCompleted', task);
        } catch (error) {
            // Update task with error
            task.status = 'failed';
            task.error = error.message;
            task.endTime = new Date();
            task.duration = task.endTime.getTime() - task.startTime!.getTime();
            
            // Emit task failure event
            this.emit('taskFailed', task);
            
            // Throw error to be handled by workflow
            throw error;
        }
    }

    /**
     * Show workflow details in a panel
     */
    private showWorkflowDetailsPanel(workflow: AICollaborationWorkflow): void {
        // Create and show panel
        const panel = vscode.window.createWebviewPanel(
            'nesWorkflowDetails',
            `NES: ${workflow.name}`,
            vscode.ViewColumn.Beside,
            {
                enableScripts: true,
                retainContextWhenHidden: true
            }
        );
        
        // Set HTML content
        panel.webview.html = this.getWorkflowDetailsHtml(workflow);
        
        // Handle messages
        panel.webview.onDidReceiveMessage(message => {
            switch (message.command) {
                case 'applySuggestion':
                    this.applyNextEditSuggestion(message.taskId);
                    break;
                case 'viewDiff':
                    this.showSuggestionDiff(message.taskId);
                    break;
                case 'cancelWorkflow':
                    this.cancelWorkflow(workflow.id);
                    break;
            }
        });
    }

    /**
     * Get HTML for workflow details panel
     */
    private getWorkflowDetailsHtml(workflow: AICollaborationWorkflow): string {
        // Generate suggestions list
        const suggestionTasks = workflow.tasks.filter(task => task.type === 'suggestion');
        const suggestionsList = suggestionTasks.map(task => `
            <div class="suggestion ${task.status}">
                <h3>${task.output?.description || 'Edit suggestion'}</h3>
                <div class="file-path">${task.output?.edit?.fileEdits?.[0]?.filePath || 'Unknown file'}</div>
                <div class="status">Status: ${task.status}</div>
                <div class="actions">
                    <button class="apply-btn" ${task.status !== 'completed' ? 'disabled' : ''} 
                            onclick="applySuggestion('${task.id}')">Apply</button>
                    <button class="view-diff-btn" ${task.status !== 'completed' ? 'disabled' : ''} 
                            onclick="viewDiff('${task.id}')">View Diff</button>
                </div>
            </div>
        `).join('');
        
        // Return full HTML
        return `
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>NES: ${workflow.name}</title>
            <style>
                body { font-family: var(--vscode-font-family); color: var(--vscode-editor-foreground); padding: 20px; }
                h1 { color: var(--vscode-editor-foreground); }
                .workflow-info { margin-bottom: 20px; }
                .progress-bar { height: 10px; background: var(--vscode-progressBar-background); width: 100%; }
                .progress-fill { height: 100%; background: var(--vscode-activityBarBadge-background); width: ${workflow.progress}%; }
                .suggestions { margin-top: 20px; }
                .suggestion { padding: 10px; margin-bottom: 10px; border: 1px solid var(--vscode-panel-border); }
                .suggestion.completed { border-left: 4px solid var(--vscode-terminal-ansiGreen); }
                .suggestion.failed { border-left: 4px solid var(--vscode-terminal-ansiRed); }
                .suggestion.running { border-left: 4px solid var(--vscode-terminal-ansiYellow); }
                .file-path { font-size: 0.9em; color: var(--vscode-descriptionForeground); margin: 5px 0; }
                .actions { margin-top: 10px; }
                button { background: var(--vscode-button-background); color: var(--vscode-button-foreground); 
                        border: none; padding: 5px 10px; cursor: pointer; margin-right: 5px; }
                button:disabled { opacity: 0.5; cursor: not-allowed; }
                .status { font-style: italic; }
            </style>
        </head>
        <body>
            <h1>Next Edit Suggestions: ${workflow.name}</h1>
            
            <div class="workflow-info">
                <div>Status: ${workflow.status}</div>
                <div>Progress: ${workflow.progress}%</div>
                <div class="progress-bar"><div class="progress-fill"></div></div>
                <div>Duration: ${workflow.duration ? Math.round(workflow.duration / 1000) + 's' : 'In progress...'}</div>
                ${workflow.error ? `<div class="error">Error: ${workflow.error}</div>` : ''}
            </div>
            
            <h2>Edit Suggestions (${suggestionTasks.length})</h2>
            <div class="suggestions">
                ${suggestionsList.length > 0 ? suggestionsList : '<p>No suggestions generated yet.</p>'}
            </div>
            
            <script>
                const vscode = acquireVsCodeApi();
                
                function applySuggestion(taskId) {
                    vscode.postMessage({
                        command: 'applySuggestion',
                        taskId: taskId
                    });
                }
                
                function viewDiff(taskId) {
                    vscode.postMessage({
                        command: 'viewDiff',
                        taskId: taskId
                    });
                }
                
                function cancelWorkflow() {
                    vscode.postMessage({
                        command: 'cancelWorkflow'
                    });
                }
            </script>
        </body>
        </html>
        `;
    }

    /**
     * Show a diff view for a suggestion
     */
    private async showSuggestionDiff(taskId: string): Promise<void> {
        // Find the task
        let task: AITask | undefined;
        for (const workflow of this.activeWorkflows.values()) {
            task = workflow.tasks.find(t => t.id === taskId);
            if (task) {
                break;
            }
        }

        if (!task || task.status !== 'completed') {
            vscode.window.showErrorMessage('Cannot show diff: Task not found or not completed');
            return;
        }

        try {
            const taskOutputEdit = task.output?.edit;
            if (taskOutputEdit && taskOutputEdit.fileEdits && taskOutputEdit.fileEdits.length > 0) {
                const fileEdit = taskOutputEdit.fileEdits[0];
                const uri = vscode.Uri.file(fileEdit.filePath);
                
                // Read the current file content
                const document = await vscode.workspace.openTextDocument(uri);
                const originalContent = document.getText();
                
                // Create the edited content
                const range = new vscode.Range(
                    new vscode.Position(fileEdit.range.start.line, fileEdit.range.start.character),
                    new vscode.Position(fileEdit.range.end.line, fileEdit.range.end.character)
                );
                const originalText = document.getText(range);
                const editedContent = originalContent.replace(originalText, fileEdit.newText);
                
                // Create temporary files for diff
                const originalUri = uri;
                const editedUri = vscode.Uri.parse(`untitled:${fileEdit.filePath}.suggested`);
                
                // Create document with edited content
                const newWorkspaceEdit = new vscode.WorkspaceEdit();
                newWorkspaceEdit.createFile(editedUri, { overwrite: true });
                await vscode.workspace.applyEdit(newWorkspaceEdit);
                
                const editedDocument = await vscode.workspace.openTextDocument(editedUri);
                const editedEditor = await vscode.window.showTextDocument(editedDocument);
                
                const fullRange = new vscode.Range(
                    new vscode.Position(0, 0),
                    new vscode.Position(editedDocument.lineCount, 0)
                );
                await editedEditor.edit(builder => builder.replace(fullRange, editedContent));
                
                // Show diff
                await vscode.commands.executeCommand('vscode.diff',
                    originalUri,
                    editedUri,
                    `${task.output?.description || 'Edit suggestion'} (${fileEdit.filePath})`,
                    { viewColumn: vscode.ViewColumn.Beside }
                );
            } else {
                vscode.window.showErrorMessage('No edit information available');
            }
        } catch (error) {
            vscode.window.showErrorMessage(`Error showing diff: ${error.message}`);
        }
    }

    /**
     * Update the status bar to show active workflow count
     */
    private updateStatusBar(): void {
        const activeCount = Array.from(this.activeWorkflows.values())
            .filter(w => w.status === 'running' || w.status === 'pending')
            .length;

        if (activeCount > 0) {
            this.statusBarItem.text = `$(rocket) NES (${activeCount})`;
            this.statusBarItem.show();
        } else {
            this.statusBarItem.hide();
        }
    }

    /**
     * Activate the NES workflow manager
     */
    activate(): void {
        this.statusBarItem.show();
        vscode.window.showInformationMessage('Next Edit Suggestions workflow manager activated');
    }

    /**
     * Deactivate the NES workflow manager
     */
    deactivate(): void {
        this.statusBarItem.hide();
        
        // Cancel all active workflows
        for (const workflowId of this.activeWorkflows.keys()) {
            this.cancelWorkflow(workflowId);
        }
        
        this.activeWorkflows.clear();
        this.progressBars.clear();
        this.cancelTokens.clear();
    }
}
