import * as vscode from 'vscode';
import * as path from 'path';
import { TabbedContainerProvider } from './views/TabbedContainerProvider';
import { ChatViewProvider } from './views/ChatViewProvider';
import { CommunicationHubProvider } from './views/CommunicationHubProvider';
import { DashboardProvider } from './views/DashboardProvider';
import { SettingsViewProvider } from './views/SettingsViewProvider';
import { LLMProviderManager } from './llm/LLMProviderManager';
import { ApiClient } from './services/ApiClient';
import { ConfigurationManager } from './config/ConfigurationManager';
import { ChatService } from './services/features/ChatService';
import { LLMService } from './services/features/LLMService';
import { ConfigurationService } from './services/core/ConfigurationService';
import { NotificationService } from './services/core/NotificationService';
import { WebviewMessageRouter } from './services/communication/WebviewMessageRouter';
import { AgentCommunicationService } from './services/AgentCommunicationService';
import { CustomModesManager } from './services/CustomModesManager';
import { CodeCompletionProvider } from './providers/CodeCompletionProvider';
import { ChatInterfaceProvider } from './views/ChatInterfaceProvider';
import { CodeAnalysisService } from './services/CodeAnalysisService';
import { MultiModelManager } from './services/MultiModelManager';
import { WorkspaceIntegrationService } from './services/WorkspaceIntegrationService';
import { RealTimeCollaborationService } from './services/RealTimeCollaborationService';

export async function activate(context: vscode.ExtensionContext) {
    console.log('Activating The New Fuse extension with full tabbed interface...');

    // Initialize core services
    const configManager = new ConfigurationManager(context);
    const apiClient = new ApiClient(configManager);
    const llmManager = new LLMProviderManager(configManager);
    
    // Initialize enhanced services
    const configService = new ConfigurationService(context);
    const notificationService = new NotificationService(context);
    const chatService = new ChatService(context, configService, notificationService);
    const llmService = new LLMService(llmManager, configService);

    // Initialize custom modes manager
    const customModesManager = new CustomModesManager(context);

    // Initialize code completion provider
    const completionProvider = new CodeCompletionProvider(apiClient, configManager);

    // Initialize chat interface provider
    const chatInterfaceProvider = new ChatInterfaceProvider(apiClient, configManager, customModesManager);

    // Initialize code analysis service
    const codeAnalysisService = new CodeAnalysisService(apiClient, configManager);

    // Initialize multi-model manager
    const multiModelManager = new MultiModelManager(apiClient, configManager);

    // Initialize workspace integration service
    const workspaceIntegrationService = new WorkspaceIntegrationService(apiClient, configManager);

    // Initialize real-time collaboration service
    const collaborationService = new RealTimeCollaborationService(apiClient, configManager);
    
    // Initialize view providers
    const chatViewProvider = new ChatViewProvider(chatService, notificationService, context.extensionUri);
    const communicationService = new AgentCommunicationService(context);
    const communicationHubProvider = new CommunicationHubProvider(context.extensionUri, communicationService);
    const dashboardProvider = new DashboardProvider(context.extensionUri);
    const settingsProvider = new SettingsViewProvider(context.extensionUri, configService);
    
    // Initialize message router
    const webviewMessageRouter = new WebviewMessageRouter(
        chatService,
        llmService,
        configService,
        notificationService
    );

    // Create tabbed container provider with all features
    const tabbedContainerProvider = new TabbedContainerProvider(
        context,
        webviewMessageRouter,
        chatViewProvider,
        communicationHubProvider,
        dashboardProvider,
        settingsProvider,
        notificationService
    );
    
    // Register the tabbed container provider
    const providerRegistration = vscode.window.registerWebviewViewProvider(
        'theNewFuse.tabbedContainer',
        tabbedContainerProvider,
        { webviewOptions: { retainContextWhenHidden: true } }
    );

    // Register code completion provider
    const supportedLanguages = [
        'typescript', 'javascript', 'python', 'java', 'csharp', 'cpp', 'c',
        'go', 'rust', 'php', 'ruby', 'swift', 'kotlin', 'scala', 'html', 'css'
    ];

    const completionProviderRegistrations = supportedLanguages.map(language =>
        vscode.languages.registerCompletionItemProvider(
            { language, scheme: 'file' },
            completionProvider,
            '.', '(', '[', '{', ' ', '\n'
        )
    );

    // Register chat interface provider
    const chatInterfaceRegistration = vscode.window.registerWebviewViewProvider(
        ChatInterfaceProvider.viewType,
        chatInterfaceProvider
    );

    // Register enhanced commands
    const commands = [
        vscode.commands.registerCommand('the-new-fuse.showChat', () => {
            tabbedContainerProvider.focus();
            tabbedContainerProvider.switchToTab('chat');
        }),
        
        vscode.commands.registerCommand('the-new-fuse.selectLLMProvider', async () => {
            await llmManager.selectProvider();
        }),
        
        vscode.commands.registerCommand('the-new-fuse.runDiagnostic', async () => {
            await runSystemDiagnostic(llmManager, apiClient);
        }),

        vscode.commands.registerCommand('theNewFuse.copilot.startCoordination', async () => {
            vscode.window.showInformationMessage('Copilot coordination started');
        }),

        vscode.commands.registerCommand('theNewFuse.monitoring.showStatus', async () => {
            const output = vscode.window.createOutputChannel('The New Fuse Status');
            output.show();
            output.appendLine('System Status: Active');
        }),

        vscode.commands.registerCommand('theNewFuse.showCommunicationHub', () => {
            tabbedContainerProvider.focus();
            tabbedContainerProvider.switchToTab('communication');
        }),

        vscode.commands.registerCommand('theNewFuse.showDashboard', () => {
            tabbedContainerProvider.focus();
            tabbedContainerProvider.switchToTab('dashboard');
        }),

        vscode.commands.registerCommand('theNewFuse.showSettings', () => {
            tabbedContainerProvider.focus();
            tabbedContainerProvider.switchToTab('settings');
        }),

        vscode.commands.registerCommand('theNewFuse.showChatInterface', () => {
            vscode.commands.executeCommand('workbench.view.extension.theNewFuse');
            // Focus on chat interface if available
        }),

        vscode.commands.registerCommand('theNewFuse.analyzeCurrentFile', async () => {
            const editor = vscode.window.activeTextEditor;
            if (editor) {
                await vscode.window.withProgress({
                    location: vscode.ProgressLocation.Notification,
                    title: 'Analyzing file...',
                    cancellable: false
                }, async (progress) => {
                    try {
                        const result = await codeAnalysisService.analyzeFile(editor.document.fileName);
                        const score = codeAnalysisService.calculateQualityScore(result);

                        vscode.window.showInformationMessage(
                            `File Analysis Complete!\n` +
                            `Quality Score: ${score}/100\n` +
                            `Issues: ${result.issues.length}\n` +
                            `Suggestions: ${result.suggestions.length}`,
                            'View Details'
                        ).then(selection => {
                            if (selection === 'View Details') {
                                showAnalysisResults(result);
                            }
                        });
                    } catch (error) {
                        vscode.window.showErrorMessage(`Analysis failed: ${error}`);
                    }
                });
            } else {
                vscode.window.showWarningMessage('No active file to analyze');
            }
        }),

        vscode.commands.registerCommand('theNewFuse.analyzeWorkspace', async () => {
            await vscode.window.withProgress({
                location: vscode.ProgressLocation.Notification,
                title: 'Analyzing workspace...',
                cancellable: false
            }, async (progress: any) => {
                try {
                    const summary = await codeAnalysisService.getWorkspaceAnalysisSummary();
                    vscode.window.showInformationMessage(
                        `Workspace Analysis Complete!\n` +
                        `Files: ${summary.totalFiles}\n` +
                        `Average Quality: ${summary.averageQuality}/100\n` +
                        `Total Issues: ${summary.totalIssues}\n` +
                        `Critical Issues: ${summary.criticalIssues}`,
                        'View Details'
                    );
                } catch (error) {
                    vscode.window.showErrorMessage(`Workspace analysis failed: ${error}`);
                }
            });
        }),

        vscode.commands.registerCommand('theNewFuse.selectModelProvider', async () => {
            const providers = multiModelManager.getProviders();
            const providerItems = providers.map(provider => ({
                label: provider.name,
                detail: `${provider.models.length} models available`,
                provider: provider
            }));

            const selectedProvider = await vscode.window.showQuickPick(providerItems, {
                placeHolder: 'Select AI model provider'
            });

            if (selectedProvider) {
                await multiModelManager.switchProvider(selectedProvider.provider.id);
            }
        }),

        vscode.commands.registerCommand('theNewFuse.showModelPerformance', async () => {
            const performanceData = multiModelManager.getAllPerformanceData();
            const currentProvider = multiModelManager.getCurrentProvider();

            let content = `## Model Performance Report\n\n`;
            content += `**Current Provider:** ${currentProvider?.name || 'None'}\n\n`;

            for (const [modelId, performance] of performanceData) {
                const successRate = performance.totalRequests > 0
                    ? Math.round((performance.successfulRequests / performance.totalRequests) * 100)
                    : 0;

                content += `### ${modelId}\n`;
                content += `- **Requests:** ${performance.totalRequests}\n`;
                content += `- **Success Rate:** ${successRate}%\n`;
                content += `- **Avg Response Time:** ${Math.round(performance.averageResponseTime)}ms\n`;
                content += `- **Last Used:** ${performance.lastUsed.toLocaleString()}\n\n`;
            }

            const doc = await vscode.workspace.openTextDocument({
                content,
                language: 'markdown'
            });

            await vscode.window.showTextDocument(doc);
        }),

        vscode.commands.registerCommand('theNewFuse.compareModels', async () => {
            const providers = multiModelManager.getProviders();
            const allModels: Array<{ label: string; modelId: string; provider: string }> = [];

            for (const provider of providers) {
                for (const model of provider.models) {
                    if (model.status === 'available') {
                        allModels.push({
                            label: `${model.name} (${provider.name})`,
                            modelId: model.id,
                            provider: provider.id
                        });
                    }
                }
            }

            const selectedModels = await vscode.window.showQuickPick(allModels, {
                canPickMany: true,
                placeHolder: 'Select models to compare (2-4 recommended)'
            });

            if (selectedModels && selectedModels.length >= 2) {
                const testMessage = 'Write a brief summary of what makes a good software architecture.';

                await vscode.window.withProgress({
                    location: vscode.ProgressLocation.Notification,
                    title: `Comparing ${selectedModels.length} models...`,
                    cancellable: false
                }, async (progress: any) => {
                    try {
                        const responses = await multiModelManager.compareModels(
                            [{ role: 'user', content: testMessage }],
                            selectedModels.map((m: any) => m.modelId)
                        );

                        // Show comparison results
                        let content = `## Model Comparison Results\n\n`;
                        content += `**Test Query:** ${testMessage}\n\n`;

                        for (let i = 0; i < responses.length; i++) {
                            const response = responses[i];
                            const modelInfo = selectedModels[i];

                            content += `### ${modelInfo.label}\n`;
                            content += `**Response Time:** ${response.responseTime}ms\n`;
                            content += `**Tokens Used:** ${response.tokensUsed}\n\n`;
                            content += `${response.content}\n\n`;
                            content += `---\n\n`;
                        }

                        const doc = await vscode.workspace.openTextDocument({
                            content,
                            language: 'markdown'
                        });

                        await vscode.window.showTextDocument(doc);
                    } catch (error) {
                        vscode.window.showErrorMessage(`Model comparison failed: ${error}`);
                    }
                });
            } else {
                vscode.window.showWarningMessage('Please select at least 2 models to compare');
            }
        }),

        vscode.commands.registerCommand('theNewFuse.searchWorkspace', async () => {
            const query = await vscode.window.showInputBox({
                prompt: 'Enter search query',
                placeHolder: 'Search across workspace files...'
            });

            if (query) {
                await vscode.window.withProgress({
                    location: vscode.ProgressLocation.Notification,
                    title: 'Searching workspace...',
                    cancellable: true
                }, async (progress: any, token: any) => {
                    try {
                        const results = await workspaceIntegrationService.searchWorkspace(query, {
                            useAI: true
                        });

                        if (results.length === 0) {
                            vscode.window.showInformationMessage('No results found');
                            return;
                        }

                        // Show search results in quick pick
                        const items = results.map(result => ({
                            label: path.basename(result.file),
                            detail: `Line ${result.line}: ${result.content.substring(0, 100)}...`,
                            result: result
                        }));

                        const selected = await vscode.window.showQuickPick(items, {
                            placeHolder: `Found ${results.length} results`
                        });

                        if (selected) {
                            const uri = vscode.Uri.file(selected.result.file);
                            const doc = await vscode.workspace.openTextDocument(uri);
                            const editor = await vscode.window.showTextDocument(doc);

                            // Highlight the matching line
                            const range = new vscode.Range(
                                selected.result.line - 1, 0,
                                selected.result.line - 1, 0
                            );
                            editor.selection = new vscode.Selection(range.start, range.end);
                            editor.revealRange(range, vscode.TextEditorRevealType.InCenter);
                        }
                    } catch (error) {
                        vscode.window.showErrorMessage(`Workspace search failed: ${error}`);
                    }
                });
            }
        }),

        vscode.commands.registerCommand('theNewFuse.showWorkspaceContext', async () => {
            await vscode.window.withProgress({
                location: vscode.ProgressLocation.Notification,
                title: 'Analyzing workspace context...',
                cancellable: false
            }, async (progress: any) => {
                try {
                    const context = await workspaceIntegrationService.getWorkspaceContext();

                    let content = `## Workspace Context Analysis\n\n`;
                    content += `**Project:** ${context.workspace.projectName}\n`;
                    content += `**Files:** ${context.workspace.files.length}\n`;
                    content += `**Health Score:** ${context.projectHealth.score}/100\n\n`;

                    if (context.gitStatus) {
                        content += `### Git Status\n`;
                        content += `- **Branch:** ${context.gitStatus.branch}\n`;
                        content += `- **Status:** ${context.gitStatus.status}\n`;
                        content += `- **Last Commit:** ${context.gitStatus.lastCommit.toLocaleString()}\n\n`;
                    }

                    if (context.projectHealth.issues.length > 0) {
                        content += `### Issues\n`;
                        context.projectHealth.issues.forEach(issue => {
                            content += `- ${issue}\n`;
                        });
                        content += `\n`;
                    }

                    if (context.projectHealth.recommendations.length > 0) {
                        content += `### Recommendations\n`;
                        context.projectHealth.recommendations.forEach(rec => {
                            content += `- ${rec}\n`;
                        });
                        content += `\n`;
                    }

                    content += `### Project Structure\n`;
                    content += `- **Source:** ${context.workspace.structure.src.join(', ') || 'None'}\n`;
                    content += `- **Tests:** ${context.workspace.structure.tests.join(', ') || 'None'}\n`;
                    content += `- **Docs:** ${context.workspace.structure.docs.join(', ') || 'None'}\n`;
                    content += `- **Config:** ${context.workspace.structure.config.join(', ') || 'None'}\n\n`;

                    if (context.recentFiles.length > 0) {
                        content += `### Recent Files\n`;
                        context.recentFiles.slice(0, 5).forEach(file => {
                            content += `- ${path.basename(file)}\n`;
                        });
                    }

                    const doc = await vscode.workspace.openTextDocument({
                        content,
                        language: 'markdown'
                    });

                    await vscode.window.showTextDocument(doc);
                } catch (error) {
                    vscode.window.showErrorMessage(`Failed to analyze workspace context: ${error}`);
                }
            });
        }),

        vscode.commands.registerCommand('theNewFuse.refreshWorkspaceIndex', async () => {
            await vscode.window.withProgress({
                location: vscode.ProgressLocation.Notification,
                title: 'Refreshing workspace index...',
                cancellable: false
            }, async (progress: any) => {
                try {
                    workspaceIntegrationService.dispose();
                    const workspace = await workspaceIntegrationService.initializeWorkspace();

                    if (workspace) {
                        vscode.window.showInformationMessage(
                            `Workspace index refreshed!\n` +
                            `Indexed ${workspace.files.length} files in ${workspace.projectName}`
                        );
                    }
                } catch (error) {
                    vscode.window.showErrorMessage(`Failed to refresh workspace index: ${error}`);
                }
            });
        }),

        vscode.commands.registerCommand('theNewFuse.startCollaboration', async () => {
            const sessionName = await vscode.window.showInputBox({
                prompt: 'Enter collaboration session name',
                placeHolder: 'My Collaboration Session'
            });

            if (sessionName) {
                try {
                    await collaborationService.startCollaborationSession(sessionName);
                } catch (error) {
                    vscode.window.showErrorMessage(`Failed to start collaboration: ${error}`);
                }
            }
        }),

        vscode.commands.registerCommand('theNewFuse.joinCollaboration', async () => {
            const sessionId = await vscode.window.showInputBox({
                prompt: 'Enter collaboration session ID',
                placeHolder: 'session-id-here'
            });

            if (sessionId) {
                try {
                    await collaborationService.joinCollaborationSession(sessionId);
                } catch (error) {
                    vscode.window.showErrorMessage(`Failed to join collaboration: ${error}`);
                }
            }
        }),

        vscode.commands.registerCommand('theNewFuse.leaveCollaboration', async () => {
            try {
                await collaborationService.leaveCollaborationSession();
            } catch (error) {
                vscode.window.showErrorMessage(`Failed to leave collaboration: ${error}`);
            }
        }),

        vscode.commands.registerCommand('theNewFuse.inviteCollaborator', async () => {
            const email = await vscode.window.showInputBox({
                prompt: 'Enter collaborator email',
                placeHolder: 'collaborator@example.com'
            });

            if (email) {
                const role = await vscode.window.showQuickPick(
                    [
                        { label: 'Editor', description: 'Can edit and comment', value: 'editor' },
                        { label: 'Viewer', description: 'Can only view and comment', value: 'viewer' }
                    ],
                    { placeHolder: 'Select role for collaborator' }
                );

                if (role) {
                    try {
                        await collaborationService.inviteToSession(email, role.value as 'editor' | 'viewer');
                    } catch (error) {
                        vscode.window.showErrorMessage(`Failed to invite collaborator: ${error}`);
                    }
                }
            }
        }),

        vscode.commands.registerCommand('theNewFuse.showCollaborationPanel', async () => {
            const session = collaborationService.getActiveSession();
            const participants = collaborationService.getParticipants();

            if (!session) {
                vscode.window.showInformationMessage('No active collaboration session');
                return;
            }

            let content = `## Collaboration Session: ${session.name}\n\n`;
            content += `**Status:** ${session.status}\n`;
            content += `**Participants:** ${participants.length}\n\n`;

            participants.forEach(participant => {
                content += `### ${participant.name}\n`;
                content += `- **Role:** ${participant.role}\n`;
                content += `- **Status:** ${participant.status}\n`;
                content += `- **Last Seen:** ${participant.lastSeen.toLocaleString()}\n\n`;
            });

            const doc = await vscode.workspace.openTextDocument({
                content,
                language: 'markdown'
            });

            await vscode.window.showTextDocument(doc);
        }),

        vscode.commands.registerCommand('the-new-fuse.manageCustomModes', async () => {
            await manageCustomModes(customModesManager);
        }),

        vscode.commands.registerCommand('the-new-fuse.importCustomModes', async () => {
            await importCustomModes(customModesManager);
        }),

        vscode.commands.registerCommand('the-new-fuse.exportCustomModes', async () => {
            await exportCustomModes(customModesManager);
        }),

        vscode.commands.registerCommand('the-new-fuse.createDefaultModes', async () => {
            await customModesManager.createDefaultModes();
            vscode.window.showInformationMessage('Default custom modes created successfully!');
        }),
    ];

    // Add to subscriptions
    context.subscriptions.push(
        providerRegistration,
        ...completionProviderRegistrations,
        chatInterfaceRegistration,
        ...commands
    );

    // Initialize services
    await llmManager.initialize();
    await llmService.initialize();

    console.log('The New Fuse extension activated successfully with full tabbed interface!');
}

async function runSystemDiagnostic(
    llmManager: LLMProviderManager, 
    apiClient: ApiClient
): Promise<void> {
    const output = vscode.window.createOutputChannel('The New Fuse Diagnostics');
    output.show();
    
    output.appendLine('🔍 Running system diagnostic...');
    
    // Test LLM providers
    const providers = await llmManager.getAvailableProviders();
    output.appendLine(`✅ Found ${providers.length} LLM providers`);
    
    // Test API connection
    try {
        const health = await apiClient.checkHealth();
        output.appendLine(`✅ API connection: ${health.status}`);
    } catch (error) {
        output.appendLine(`❌ API connection failed: ${error}`);
    }
    
    output.appendLine('🎉 Diagnostic complete!');
}

export function deactivate() {
    console.log('The New Fuse extension deactivated');
}

// Custom Modes Management Functions
async function manageCustomModes(customModesManager: CustomModesManager): Promise<void> {
    const modes = customModesManager.getCustomModes();
    const modeNames = modes.map(mode => mode.name).join('\n');

    const action = await vscode.window.showQuickPick([
        'View All Modes',
        'Add New Mode',
        'Edit Mode',
        'Delete Mode'
    ], {
        placeHolder: 'Select custom modes action'
    });

    switch (action) {
        case 'View All Modes':
            vscode.window.showInformationMessage(`Current custom modes:\n${modeNames || 'None'}`);
            break;
        case 'Add New Mode':
            await addNewCustomMode(customModesManager);
            break;
        case 'Edit Mode':
            await editCustomMode(customModesManager);
            break;
        case 'Delete Mode':
            await deleteCustomMode(customModesManager);
            break;
    }
}

async function addNewCustomMode(customModesManager: CustomModesManager): Promise<void> {
    const name = await vscode.window.showInputBox({
        prompt: 'Enter custom mode name',
        placeHolder: 'e.g., Code Reviewer'
    });

    if (!name) return;

    const slug = await vscode.window.showInputBox({
        prompt: 'Enter custom mode slug (identifier)',
        placeHolder: 'e.g., code-reviewer',
        value: name.toLowerCase().replace(/\s+/g, '-')
    });

    if (!slug) return;

    const roleDefinition = await vscode.window.showInputBox({
        prompt: 'Enter role definition',
        placeHolder: 'Describe what this mode does...'
    });

    if (!roleDefinition) return;

    const newMode = {
        name,
        slug,
        roleDefinition
    };

    await customModesManager.addCustomMode(newMode);
    vscode.window.showInformationMessage(`Custom mode "${name}" added successfully!`);
}

async function editCustomMode(customModesManager: CustomModesManager): Promise<void> {
    const modes = customModesManager.getCustomModes();
    const modeItems = modes.map(mode => ({
        label: mode.name,
        detail: mode.slug,
        mode: mode
    }));

    const selectedModeItem = await vscode.window.showQuickPick(modeItems, {
        placeHolder: 'Select mode to edit'
    });

    if (!selectedModeItem) return;

    const newName = await vscode.window.showInputBox({
        prompt: 'Enter new name',
        value: selectedModeItem.mode.name
    });

    if (!newName) return;

    const newRoleDefinition = await vscode.window.showInputBox({
        prompt: 'Enter new role definition',
        value: selectedModeItem.mode.roleDefinition
    });

    if (!newRoleDefinition) return;

    const updatedMode = {
        ...selectedModeItem.mode,
        name: newName,
        roleDefinition: newRoleDefinition
    };

    await customModesManager.addCustomMode(updatedMode);
    vscode.window.showInformationMessage(`Custom mode "${newName}" updated successfully!`);
}

async function deleteCustomMode(customModesManager: CustomModesManager): Promise<void> {
    const modes = customModesManager.getCustomModes();
    const modeItems = modes.map(mode => ({
        label: mode.name,
        detail: mode.slug,
        mode: mode
    }));

    const selectedModeItem = await vscode.window.showQuickPick(modeItems, {
        placeHolder: 'Select mode to delete'
    });

    if (!selectedModeItem) return;

    const confirm = await vscode.window.showWarningMessage(
        `Are you sure you want to delete "${selectedModeItem.mode.name}"?`,
        'Yes', 'No'
    );

    if (confirm === 'Yes') {
        await customModesManager.removeCustomMode(selectedModeItem.mode.slug);
        vscode.window.showInformationMessage(`Custom mode "${selectedModeItem.mode.name}" deleted successfully!`);
    }
}

async function importCustomModes(customModesManager: CustomModesManager): Promise<void> {
    const fileUri = await vscode.window.showOpenDialog({
        canSelectFiles: true,
        canSelectFolders: false,
        filters: {
            'JSON': ['json']
        },
        openLabel: 'Import Custom Modes'
    });

    if (fileUri && fileUri[0]) {
        await customModesManager.importCustomModes(fileUri[0].fsPath);
    }
}

async function exportCustomModes(customModesManager: CustomModesManager): Promise<void> {
    const fileUri = await vscode.window.showSaveDialog({
        filters: {
            'JSON': ['json']
        },
        saveLabel: 'Export Custom Modes'
    });

    if (fileUri) {
        await customModesManager.exportCustomModes(fileUri.fsPath);
    }
}

// Code Analysis Helper Functions
async function showAnalysisResults(result: any): Promise<void> {
    const issues = result.issues.map((issue: any) =>
        `• ${issue.type.toUpperCase()}: ${issue.message} (Line ${issue.line})`
    ).join('\n');

    const suggestions = result.suggestions.map((suggestion: any) =>
        `• ${suggestion.type.toUpperCase()}: ${suggestion.message} (Line ${suggestion.line})`
    ).join('\n');

    const content = `## Code Analysis Results

**File:** ${result.filePath}
**Language:** ${result.language}
**Complexity:** ${result.complexity}
**Quality Score:** ${Math.round(result.metrics.maintainabilityIndex)}/100

### Issues Found:
${issues || 'No issues found'}

### Suggestions:
${suggestions || 'No suggestions'}

### Metrics:
- Lines of Code: ${result.metrics.linesOfCode}
- Cyclomatic Complexity: ${result.metrics.cyclomaticComplexity}
- Technical Debt: ${result.metrics.technicalDebt}
${result.metrics.codeCoverage ? `- Code Coverage: ${result.metrics.codeCoverage}%` : ''}
${result.metrics.performanceScore ? `- Performance Score: ${result.metrics.performanceScore}/100` : ''}
`;

    const doc = await vscode.workspace.openTextDocument({
        content,
        language: 'markdown'
    });

    await vscode.window.showTextDocument(doc);
}