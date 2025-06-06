/**
 * Copilot Instance Coordination Demo
 * 
 * This file demonstrates how to use the Copilot Instance Coordination System
 * to enable communication and collaboration between multiple Copilot instances
 * running in different parts of VS Code.
 */

import * as vscode from 'vscode';
import { CopilotInstanceCoordinator } from './CopilotInstanceCoordinator';

export class CopilotCoordinationDemo {
    private coordinator: CopilotInstanceCoordinator;

    constructor(context: vscode.ExtensionContext) {
        this.coordinator = new CopilotInstanceCoordinator(context);
    }

    /**
     * Demo 1: Basic Coordination Setup
     * Shows how to initialize and start coordination between instances
     */
    async demo1_BasicSetup() {
        console.log('🎬 Demo 1: Basic Coordination Setup');
        
        // Initialize the coordination system
        await this.coordinator.initialize();
        console.log('✅ Coordinator initialized');
        
        // Start coordination
        await this.coordinator.startCoordination();
        console.log('✅ Coordination started');
        
        // Check active instances
        const instances = this.coordinator.getActiveInstances();
        console.log(`📊 Active instances: ${instances.length}`);
        instances.forEach(instance => {
            console.log(`  - ${instance.type} (${instance.id}): ${instance.capabilities.join(', ')}`);
        });
    }

    /**
     * Demo 2: Context Sharing
     * Shows how to share context between different Copilot instances
     */
    async demo2_ContextSharing() {
        console.log('🎬 Demo 2: Context Sharing');
        
        const activeEditor = vscode.window.activeTextEditor;
        if (!activeEditor) {
            console.log('❌ No active editor for context sharing demo');
            return;
        }

        // Prepare context from current editor
        const context = {
            document: {
                uri: activeEditor.document.uri.toString(),
                languageId: activeEditor.document.languageId,
                content: activeEditor.document.getText(),
                selection: activeEditor.selection ? {
                    start: activeEditor.selection.start,
                    end: activeEditor.selection.end,
                    text: activeEditor.document.getText(activeEditor.selection)
                } : undefined
            },
            workspace: vscode.workspace.workspaceFolders?.[0]?.uri.toString(),
            timestamp: new Date().toISOString(),
            metadata: {
                demo: 'context_sharing',
                source: 'sidebar_chat'
            }
        };

        // Share context with other instances
        await this.coordinator.shareContext(context);
        console.log('📤 Context shared successfully');
        
        // Listen for context updates from other instances
        this.coordinator.onContextShared((sharedContext, sourceInstance) => {
            console.log(`📨 Received context from ${sourceInstance}:`, {
                document: sharedContext.document?.uri,
                timestamp: sharedContext.timestamp
            });
        });
    }

    /**
     * Demo 3: Collaborative Suggestions
     * Shows how instances can request and provide suggestions to each other
     */
    async demo3_CollaborativeSuggestions() {
        console.log('🎬 Demo 3: Collaborative Suggestions');
        
        const activeEditor = vscode.window.activeTextEditor;
        if (!activeEditor) {
            console.log('❌ No active editor for suggestions demo');
            return;
        }

        // Request suggestion from other instances
        const request = {
            context: {
                document: {
                    uri: activeEditor.document.uri.toString(),
                    languageId: activeEditor.document.languageId,
                    content: activeEditor.document.getText(),
                    selection: activeEditor.selection ? {
                        start: activeEditor.selection.start,
                        end: activeEditor.selection.end,
                        text: activeEditor.document.getText(activeEditor.selection)
                    } : undefined
                },
                workspace: vscode.workspace.workspaceFolders?.[0]?.uri.toString(),
                task: 'code_completion'
            },
            type: 'code_completion' as const,
            priority: 'high' as const,
            timeout: 5000
        };

        console.log('💡 Requesting suggestions from other instances...');
        const response = await this.coordinator.requestSuggestion(request);
        
        if (response?.suggestion) {
            console.log(`✅ Received suggestion from ${response.sourceInstance}:`);
            console.log(`   Confidence: ${response.confidence}`);
            console.log(`   Suggestion: ${response.suggestion.substring(0, 100)}...`);
            
            // Show suggestion to user
            const action = await vscode.window.showInformationMessage(
                `💡 Suggestion from ${response.sourceInstance} (confidence: ${response.confidence})`,
                'Apply', 'View Details', 'Dismiss'
            );
            
            if (action === 'Apply' && activeEditor.selection) {
                await activeEditor.edit(editBuilder => {
                    editBuilder.replace(activeEditor.selection, response.suggestion);
                });
                console.log('✅ Suggestion applied to editor');
            } else if (action === 'View Details') {
                const doc = await vscode.workspace.openTextDocument({
                    content: `Suggestion from ${response.sourceInstance}\nConfidence: ${response.confidence}\n\n${response.suggestion}`,
                    language: activeEditor.document.languageId
                });
                await vscode.window.showTextDocument(doc);
            }
        } else {
            console.log('❌ No suggestions available from other instances');
            vscode.window.showInformationMessage('No suggestions available from other Copilot instances');
        }
    }

    /**
     * Demo 4: Task Handoff
     * Shows how to hand off complex tasks between different specialized instances
     */
    async demo4_TaskHandoff() {
        console.log('🎬 Demo 4: Task Handoff');
        
        // Example: Hand off a complex refactoring task from chat to inline completion
        const task = {
            id: 'refactor_' + Date.now(),
            type: 'code_refactoring',
            description: 'Refactor function to use modern ES6 syntax',
            context: {
                document: vscode.window.activeTextEditor?.document.uri.toString(),
                selection: vscode.window.activeTextEditor?.selection,
                requirements: [
                    'Convert to arrow functions',
                    'Use const/let instead of var',
                    'Add proper TypeScript types'
                ]
            },
            priority: 'high' as const,
            deadline: new Date(Date.now() + 300000).toISOString() // 5 minutes
        };

        console.log('🔄 Handing off refactoring task...');
        const result = await this.coordinator.handOffTask(task, 'editor_inline');
        
        if (result.success) {
            console.log(`✅ Task handed off to ${result.assignedInstance}`);
            vscode.window.showInformationMessage(`Task handed off to ${result.assignedInstance}`);
            
            // Monitor task progress
            this.coordinator.onTaskUpdate((taskId, update) => {
                if (taskId === task.id) {
                    console.log(`📊 Task ${taskId} update:`, update);
                    if (update.status === 'completed') {
                        vscode.window.showInformationMessage(`✅ Task ${taskId} completed by ${update.assignedInstance}`);
                    }
                }
            });
        } else {
            console.log(`❌ Task handoff failed: ${result.reason}`);
            vscode.window.showWarningMessage(`Task handoff failed: ${result.reason}`);
        }
    }

    /**
     * Demo 5: Real-time Synchronization
     * Shows how instances stay synchronized with editor changes
     */
    async demo5_RealTimeSync() {
        console.log('🎬 Demo 5: Real-time Synchronization');
        
        // Listen for document changes and sync with other instances
        const changeListener = vscode.workspace.onDidChangeTextDocument(async (event) => {
            if (event.document === vscode.window.activeTextEditor?.document) {
                console.log('📝 Document changed, syncing with other instances...');
                
                const syncData = {
                    document: {
                        uri: event.document.uri.toString(),
                        version: event.document.version,
                        changes: event.contentChanges.map(change => ({
                            range: change.range,
                            text: change.text
                        }))
                    },
                    timestamp: new Date().toISOString()
                };
                
                await this.coordinator.syncCompletion(syncData);
                console.log('🔄 Synchronization sent to other instances');
            }
        });

        // Listen for sync updates from other instances
        this.coordinator.onCompletionSync((syncData, sourceInstance) => {
            console.log(`🔄 Received sync from ${sourceInstance}:`, {
                document: syncData.document?.uri,
                changes: syncData.document?.changes?.length || 0
            });
        });

        console.log('👁️ Real-time synchronization active');
        
        // Return disposable for cleanup
        return changeListener;
    }

    /**
     * Demo 6: Multi-Instance Workflow
     * Shows a complete workflow involving multiple instance types
     */
    async demo6_MultiInstanceWorkflow() {
        console.log('🎬 Demo 6: Multi-Instance Workflow');
        
        // Scenario: User asks a question in sidebar chat, which coordinates with 
        // inline completions for code suggestions and notebook for data analysis
        
        // Step 1: Start in sidebar chat
        const chatContext = {
            userQuery: "How can I optimize this database query?",
            document: vscode.window.activeTextEditor?.document.uri.toString(),
            timestamp: new Date().toISOString()
        };
        
        console.log('💬 Step 1: User query in sidebar chat');
        await this.coordinator.shareContext(chatContext);
        
        // Step 2: Request code analysis from editor inline
        console.log('🔍 Step 2: Requesting code analysis...');
        const analysisRequest = {
            context: chatContext,
            type: 'code_analysis' as const,
            priority: 'high' as const
        };
        
        const analysisResponse = await this.coordinator.requestSuggestion(analysisRequest);
        if (analysisResponse) {
            console.log(`✅ Code analysis received: ${analysisResponse.suggestion.substring(0, 100)}...`);
        }
        
        // Step 3: If it's a data-heavy query, hand off to notebook instance
        if (chatContext.userQuery.includes('database') || chatContext.userQuery.includes('data')) {
            console.log('📊 Step 3: Handing off to notebook for data analysis...');
            
            const dataTask = {
                id: 'data_analysis_' + Date.now(),
                type: 'data_analysis',
                description: 'Analyze database query performance',
                context: {
                    ...chatContext,
                    analysisResult: analysisResponse?.suggestion
                },
                priority: 'high' as const
            };
            
            await this.coordinator.handOffTask(dataTask, 'notebook');
        }
        
        // Step 4: Coordinate final response
        console.log('🎯 Step 4: Coordinating final response...');
        const finalContext = {
            workflowId: 'query_optimization_' + Date.now(),
            steps: ['chat_query', 'code_analysis', 'data_analysis'],
            timestamp: new Date().toISOString()
        };
        
        await this.coordinator.shareContext(finalContext);
        console.log('✅ Multi-instance workflow completed');
    }

    /**
     * Run all demos in sequence
     */
    async runAllDemos() {
        console.log('🎬 Starting Copilot Coordination Demo Suite');
        console.log('='.repeat(50));
        
        try {
            await this.demo1_BasicSetup();
            await new Promise(resolve => setTimeout(resolve, 1000));
            
            await this.demo2_ContextSharing();
            await new Promise(resolve => setTimeout(resolve, 1000));
            
            await this.demo3_CollaborativeSuggestions();
            await new Promise(resolve => setTimeout(resolve, 1000));
            
            await this.demo4_TaskHandoff();
            await new Promise(resolve => setTimeout(resolve, 1000));
            
            const syncListener = await this.demo5_RealTimeSync();
            await new Promise(resolve => setTimeout(resolve, 2000));
            syncListener.dispose();
            
            await this.demo6_MultiInstanceWorkflow();
            
            console.log('='.repeat(50));
            console.log('🎉 All demos completed successfully!');
            
        } catch (error) {
            console.error('❌ Demo error:', error);
            vscode.window.showErrorMessage(`Demo failed: ${error instanceof Error ? error.message : String(error)}`);
        }
    }

    /**
     * Cleanup resources
     */
    dispose() {
        // The coordinator will be cleaned up by the extension's deactivate function
    }
}

/**
 * Register demo command
 */
export function registerCopilotCoordinationDemo(context: vscode.ExtensionContext) {
    const demo = new CopilotCoordinationDemo(context);
    
    // Register command to run demos
    const disposable = vscode.commands.registerCommand('theNewFuse.copilot.runDemo', async () => {
        const choice = await vscode.window.showQuickPick([
            'Run All Demos',
            '1. Basic Setup',
            '2. Context Sharing', 
            '3. Collaborative Suggestions',
            '4. Task Handoff',
            '5. Real-time Sync',
            '6. Multi-Instance Workflow'
        ], {
            placeHolder: 'Select a Copilot coordination demo to run'
        });
        
        if (!choice) return;
        
        switch (choice) {
            case 'Run All Demos':
                await demo.runAllDemos();
                break;
            case '1. Basic Setup':
                await demo.demo1_BasicSetup();
                break;
            case '2. Context Sharing':
                await demo.demo2_ContextSharing();
                break;
            case '3. Collaborative Suggestions':
                await demo.demo3_CollaborativeSuggestions();
                break;
            case '4. Task Handoff':
                await demo.demo4_TaskHandoff();
                break;
            case '5. Real-time Sync':
                await demo.demo5_RealTimeSync();
                break;
            case '6. Multi-Instance Workflow':
                await demo.demo6_MultiInstanceWorkflow();
                break;
        }
    });
    
    context.subscriptions.push(disposable);
    return demo;
}
