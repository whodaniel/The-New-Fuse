import * as vscode from 'vscode';
// import * as dotenv from 'dotenv';
// import * as path from 'path';

// // Load environment variables from .env file
// dotenv.config({ path: path.resolve(__dirname, '../.env') });

// Core Services
import { ConfigurationService } from './services/core/ConfigurationService';
import { NotificationService } from './services/core/NotificationService';
import { CommandService } from './services/core/CommandService';

// Data Services
import { StorageService } from './services/data/StorageService';

// Feature Services
import { LLMService } from './services/features/LLMService';
import { ChatService } from './services/features/ChatService'; // Uncommented for use with ChatViewProvider

// Communication Services
import { WebviewMessageRouter } from './services/communication/WebviewMessageRouter';
import { AgentCommunicationService } from './services/AgentCommunicationService'; // New Stub
import { LLMMonitoringService } from './services/LLMMonitoringService'; // New Stub
import { FuseSuggestionService } from './services/fuse-suggestion-service'; // Added import

// LLM Management
import { LLMProviderManager } from './llm/LLMProviderManager';

// Copilot Coordination
import { CopilotInstanceCoordinator } from './copilot-coordination/CopilotInstanceCoordinator';

// Universal Trigger System
import { UniversalTriggerService } from './services/trigger/UniversalTriggerService';
import { TriggerCommandInterface } from './services/trigger/TriggerCommandInterface';

// View Providers/Controllers (Assuming these are the "Enhanced" versions)
import { TabbedContainerProvider } from './views/TabbedContainerProvider';
import { ChatViewProvider } from './views/ChatViewProvider';
import { CommunicationHubProvider } from './views/CommunicationHubProvider';
import { DashboardProvider } from './views/DashboardProvider'; // New Stub
import { SettingsViewProvider } from './views/SettingsViewProvider'; // New Stub
import { CopilotCoordinationProvider } from './views/CopilotCoordinationProvider';

import { FuseCompletionProvider } from './completion-provider';
// Application Monitor
import { ApplicationMonitor } from './application-monitor';

// Kanban Service
import { KanbanService } from './kanban-service';


// // Enhanced Integration Services - Commented out as per refactoring focus
// import { EnhancedIntegrationService } from './services/EnhancedIntegrationService';
// import { MultiAgentOrchestrationService } from './services/MultiAgentOrchestrationService';
// import { SecurityObservabilityService } from './services/SecurityObservabilityService';
// import { A2AProtocolClient, A2AAgent } from './protocols/A2AProtocol';
// import { MCP2025Client } from './mcp/MCP2025Client';

// // Enhanced Configuration - Commented out as per refactoring focus
// import {
//     getConfig,
//     validateConfig,
//     // defaultEnhancedConfig,
//     // developmentConfig,
//     // productionConfig,
//     // testConfig
// } from './config/enhancedConfig';

// // Global references for cleanup - Commented out as per refactoring focus
// let enhancedIntegrationService: EnhancedIntegrationService | null = null;
// let orchestrationService: MultiAgentOrchestrationService | null = null;
// let securityObservabilityService: SecurityObservabilityService | null = null;
// let a2aProtocolClient: A2AProtocolClient | null = null;
// let mcp2025Client: MCP2025Client | null = null;

export async function activate(context: vscode.ExtensionContext): Promise<void> {
    console.log('🚀 The New Fuse extension is being activated (Refactored)');

    try {
        // Initialize VS Code LM API availability check (keeping this for now)
        console.log('🔍 Checking VS Code LM API availability...');
        checkVSCodeLmApiAvailability().then(available => {
            console.log(`📡 VS Code LM API available: ${available}`);
            if (!available) {
                vscode.window.showWarningMessage(
                    'VS Code Language Model API is not available. ' +
                    'Please ensure you have GitHub Copilot or another LM provider installed and enabled.'
                );
            }
        }).catch(error => {
            console.error('❌ Error checking VS Code LM API:', error);
        });

        // Instantiate Core Services
        console.log('🔧 Initializing Core Services...');
        const configurationService = new ConfigurationService(); // ConfigurationService doesn't need context
        console.log('   ✅ ConfigurationService initialized');
        const notificationService = new NotificationService();
        console.log('   ✅ NotificationService initialized');
        const commandService = new CommandService(); // CommandService doesn't need context
        context.subscriptions.push(commandService);
        console.log('   ✅ CommandService initialized and subscribed');
        const storageService = new StorageService(context);
        console.log('   ✅ StorageService initialized');

        // Instantiate LLM Management
        console.log('🧠 Initializing LLM Management...');
        const llmProviderManager = new LLMProviderManager(context); // Only needs context
        console.log('   ✅ LLMProviderManager initialized');

        // Instantiate New Stub Services
        console.log('🛠️ Initializing New Stub Services...');
        const agentCommunicationService = new AgentCommunicationService(context);
        console.log('   ✅ AgentCommunicationService initialized');
        const llmMonitoringService = new LLMMonitoringService(context);
        console.log('   ✅ LLMMonitoringService initialized');
        const suggestionService = new FuseSuggestionService(); // Initialize SuggestionService (REPLACE THIS WITH YOUR ACTUAL SERVICE IMPLEMENTATION)

        // Initialize Copilot Instance Coordination System
        console.log('🤖 Initializing Copilot Instance Coordination System...');
        const copilotCoordinator = new CopilotInstanceCoordinator(context, agentCommunicationService);
        await copilotCoordinator.initialize();
        console.log('   ✅ CopilotInstanceCoordinator initialized');

        // Initialize Universal Trigger System
        console.log('🎯 Initializing Universal Trigger System...');
        const universalTriggerService = new UniversalTriggerService(context, agentCommunicationService, copilotCoordinator);
        console.log('   ✅ UniversalTriggerService initialized');
        
        const triggerCommandInterface = new TriggerCommandInterface(context, universalTriggerService, agentCommunicationService);
        triggerCommandInterface.registerWithNewFuse();
        console.log('   ✅ TriggerCommandInterface initialized and registered with The New Fuse');

        // Instantiate Feature Services (LLMService might still be generally useful)
        console.log('✨ Initializing Feature Services...');
        const llmService = new LLMService(llmProviderManager, configurationService, notificationService);
        console.log('   ✅ LLMService initialized');
        const chatService = new ChatService(llmService, notificationService, storageService);
        console.log('   ✅ ChatService initialized');

        // Register Inline Completion Provider (Copilot-like)
        context.subscriptions.push(
            vscode.languages.registerInlineCompletionItemProvider(
                { pattern: '**' }, // All files
                new FuseCompletionProvider(llmService)
            )
        );
        console.log('   ✅ Inline Completion Provider registered');

        // Instantiate "Enhanced" View Providers/Controllers
        console.log('🎨 Initializing Enhanced View Providers...');
        const enhancedChatProvider = new ChatViewProvider(chatService, notificationService, context.extensionUri);
        console.log('   ✅ EnhancedChatViewProvider initialized');
        const communicationHubProvider = new CommunicationHubProvider(context.extensionUri, agentCommunicationService);
        console.log('   ✅ CommunicationHubProvider initialized');
        const dashboardProvider = new DashboardProvider(context);
        console.log('   ✅ DashboardProvider (Stub) initialized');
        const settingsProvider = new SettingsViewProvider(context);
        console.log('   ✅ SettingsProvider (Stub) initialized');
        const copilotCoordinationProvider = new CopilotCoordinationProvider(context.extensionUri, context, copilotCoordinator);
        console.log('   ✅ CopilotCoordinationProvider initialized');

        // Instantiate Communication Services
        console.log('💬 Initializing Communication Services...');
        const webviewMessageRouter = new WebviewMessageRouter();
        console.log('   ✅ WebviewMessageRouter initialized');

        // Instantiate "Enhanced" Main View Provider (TabbedContainerProvider)
        console.log('🖼️ Initializing Enhanced Main View Provider...');
        const tabbedContainerProvider = new TabbedContainerProvider(
            context,
            webviewMessageRouter,
            enhancedChatProvider,
            communicationHubProvider,
            dashboardProvider,
            settingsProvider,
            notificationService
        );
        console.log('   ✅ Enhanced TabbedContainerProvider initialized');

        // Register "Enhanced" TabbedContainerProvider
        console.log('🔗 Registering Enhanced TabbedContainerProvider...');
        context.subscriptions.push(
            vscode.window.registerWebviewViewProvider(TabbedContainerProvider.viewType, tabbedContainerProvider, { // Ensure TabbedContainerProvider.viewType is correct (e.g., "theNewFuse.tabbedContainer")
                webviewOptions: {
                    retainContextWhenHidden: true,
                }
            })
        );
        console.log('   ✅ Enhanced TabbedContainerProvider registered successfully');

        // Register Copilot Coordination Provider
        console.log('🔗 Registering Copilot Coordination Provider...');
        context.subscriptions.push(
            vscode.window.registerWebviewViewProvider(CopilotCoordinationProvider.viewType, copilotCoordinationProvider, {
                webviewOptions: {
                    retainContextWhenHidden: true,
                }
            })
        );
        console.log('   ✅ CopilotCoordinationProvider registered successfully');

        // Register Handlers with WebviewMessageRouter (for general/fallback commands)
        console.log('🔌 Registering Fallback Handlers with WebviewMessageRouter...');
        // Example: Commands not directly handled by TabbedContainerProvider's own message handler
        webviewMessageRouter.registerHandler('config:getSetting', async (payload) => configurationService.get(payload.key, payload.defaultValue));
        webviewMessageRouter.registerHandler('config:updateSetting', async (payload) => configurationService.update(payload.key, payload.value, payload.target));
        webviewMessageRouter.registerHandler('llm:listProviders', async () => llmService.getAvailableProviders()); // Example, adjust if llmService is used differently
        // Add other general handlers as needed. Chat-specific messages are likely handled by TabbedContainerProvider or routed internally.
        console.log('   ✅ WebviewMessageRouter fallback handlers registered');

        // Register VS Code Commands (using CommandService)
        console.log('⚡ Registering VS Code Commands...');
        commandService.registerCommand('theNewFuse.showChat', () => {
            // Focus the view container and then switch to the chat tab.
            // The command 'theNewFuse.tabbedContainer.focus' should be defined in package.json if it's a command to focus the view.
            // Alternatively, use 'workbench.action.focusSideBar' or the specific view container's focus command.
            vscode.commands.executeCommand(TabbedContainerProvider.viewType + '.focus'); // Assumes viewType is like 'theNewFuse.tabbedContainer'
            tabbedContainerProvider.switchToTab('chat');
        });
        commandService.registerCommand('theNewFuse.showSettings', () => {
            vscode.commands.executeCommand(TabbedContainerProvider.viewType + '.focus');
            tabbedContainerProvider.switchToTab('settings');
        });
        
        // Copilot Instance Coordination Commands

        // Explain Selection (Documentation Q&A)
        commandService.registerCommand('theNewFuse.explainSelection', async () => {
            const editor = vscode.window.activeTextEditor;
            if (!editor) {
                notificationService.showWarning('No active editor to explain selection from.');
                return;
            }
            const selection = editor.selection;
            const selectedText = editor.document.getText(selection);
            if (!selectedText) {
                notificationService.showWarning('No code selected.');
                return;
            }
            const question = await vscode.window.showInputBox({
                prompt: 'Ask a question about the selected code (e.g., "What does this function do?")',
                placeHolder: 'What does this code do?'
            });
            if (!question) {
                notificationService.showWarning('No question provided.');
                return;
            }
            try {
                const answer = await llmService.askAboutCode(selectedText, question, editor.document.languageId);
                vscode.window.showInformationMessage(answer, { modal: true });
            } catch (err) {
                notificationService.showError('Failed to get answer from LLM.');
            }
        });

        commandService.registerCommand('theNewFuse.copilot.startCoordination', async () => {
            try {
                await copilotCoordinator.startCoordination();
                notificationService.showInfo('🤖 Copilot instance coordination started successfully!');
            } catch (error) {
                notificationService.showError(`Failed to start Copilot coordination: ${error instanceof Error ? error.message : String(error)}`);
            }
        });
        
        commandService.registerCommand('theNewFuse.copilot.stopCoordination', async () => {
            try {
                await copilotCoordinator.stopCoordination();
                notificationService.showInfo('🤖 Copilot instance coordination stopped.');
            } catch (error) {
                notificationService.showError(`Failed to stop Copilot coordination: ${error instanceof Error ? error.message : String(error)}`);
            }
        });
        
        commandService.registerCommand('theNewFuse.copilot.shareContext', async () => {
            try {
                const activeEditor = vscode.window.activeTextEditor;
                if (!activeEditor) {
                    notificationService.showWarning('No active editor to share context from');
                    return;
                }
                
                const context = {
                    activeDocument: activeEditor.document,
                    cursorPosition: activeEditor.selection.start,
                    selection: activeEditor.selection,
                    workspaceContext: vscode.workspace.workspaceFolders?.[0]?.uri.toString(),
                    recentActivity: ['context_sharing_command'],
                    currentTask: 'context_sharing'
                };
                
                await copilotCoordinator.shareContext('copilot-sidebar-chat', context);
                notificationService.showInfo('📤 Context shared with other Copilot instances');
            } catch (error) {
                notificationService.showError(`Failed to share context: ${error instanceof Error ? error.message : String(error)}`);
            }
        });
        
        commandService.registerCommand('theNewFuse.copilot.requestSuggestion', async () => {
            try {
                const activeEditor = vscode.window.activeTextEditor;
                if (!activeEditor) {
                    notificationService.showWarning('No active editor for suggestion request');
                    return;
                }
                
                const request = {
                    activeDocument: activeEditor.document,
                    cursorPosition: activeEditor.selection.start,
                    type: 'code_completion'
                };
                
                const response = await copilotCoordinator.requestSuggestion(request);
                if (response) {
                    notificationService.showInfo(`💡 Suggestion received: ${response.content?.substring(0, 100) || 'No content'}...`);
                    // Could implement inline suggestion display here
                } else {
                    notificationService.showInfo('No suggestions available from other Copilot instances');
                }
            } catch (error) {
                notificationService.showError(`Failed to request suggestion: ${error instanceof Error ? error.message : String(error)}`);
            }
        });
        
        commandService.registerCommand('theNewFuse.copilot.showStatus', async () => {
            try {
                const stats = copilotCoordinator.getCoordinationStats();
                const statusItems = stats.instances.map((instance: any) => 
                    `• ${instance.type} (${instance.id}) - Status: ${instance.status} - Capabilities: ${instance.capabilities}`
                );
                
                const statusMessage = stats.instances.length > 0 
                    ? `Active Copilot Instances (${stats.instances.length}):\n${statusItems.join('\n')}\n\nMessages sent: ${stats.messagesSent}\nCoordination active: ${copilotCoordinator.isCoordinationActive()}`
                    : 'No active Copilot instances detected';
                    
                vscode.window.showInformationMessage(statusMessage, { modal: true });
            } catch (error) {
                notificationService.showError(`Failed to get coordination status: ${error instanceof Error ? error.message : String(error)}`);
            }
        });
        
        // commandService.registerCommand('theNewFuse.clearChatHistory', async () => { // ChatService role changed, this command needs review
        //     const currentSession = chatService.getCurrentSession();
        //     if (currentSession) {
        //         await chatService.clearSession(currentSession.id);
        //         notificationService.showInformation('Chat history cleared for the current session.');
        //     } else {
        //         notificationService.showWarning('No active chat session to clear.');
        //     }
        // });
        commandService.registerCommand('theNewFuse.exportChat', async () => {
            notificationService.showInformation('Export chat command triggered (implementation pending in new structure).');
        });
        commandService.registerCommand('theNewFuse.importChat', async () => {
            notificationService.showInformation('Import chat command triggered (implementation pending in new structure).');
        });

        // Universal Trigger System Commands
        commandService.registerCommand('theNewFuse.trigger.demonstrateSystem', async () => {
            try {
                await triggerCommandInterface.demonstrateUsage();
            } catch (error) {
                notificationService.showError(`Failed to demonstrate trigger system: ${error instanceof Error ? error.message : String(error)}`);
            }
        });
        
        commandService.registerCommand('theNewFuse.trigger.pingClaude', async () => {
            try {
                const result = await vscode.commands.executeCommand('theNewFuse.trigger.claudeDesktop', 
                    'Hello from The New Fuse! This is a coordination message from the VS Code extension.');
                if (result?.success) {
                    notificationService.showInfo('🎉 Successfully pinged Claude Desktop!');
                } else {
                    notificationService.showError(`Failed to ping Claude Desktop: ${result?.error || 'Unknown error'}`);
                }
            } catch (error) {
                notificationService.showError(`Error pinging Claude Desktop: ${error instanceof Error ? error.message : String(error)}`);
            }
        });
        
        commandService.registerCommand('theNewFuse.trigger.startClaudeHeartbeat', async () => {
            try {
                await vscode.commands.executeCommand('theNewFuse.heartbeat.start', 
                    'claude_desktop_main', 30, 'ping - maintain engagement from VS Code');
                notificationService.showInfo('💓 Claude Desktop heartbeat started (30 second interval)');
            } catch (error) {
                notificationService.showError(`Failed to start Claude heartbeat: ${error instanceof Error ? error.message : String(error)}`);
            }
        });
        
        commandService.registerCommand('theNewFuse.trigger.stopClaudeHeartbeat', async () => {
            try {
                await vscode.commands.executeCommand('theNewFuse.heartbeat.stop', 'claude_desktop_main');
                notificationService.showInfo('🛑 Claude Desktop heartbeat stopped');
            } catch (error) {
                notificationService.showError(`Failed to stop Claude heartbeat: ${error instanceof Error ? error.message : String(error)}`);
            }
        });
        // Add other necessary commands that call methods on tabbedContainerProvider or other services
        console.log('   ✅ VS Code Commands registered');

        // Initializations
        console.log('🚀 Performing Initializations...');
        if (llmProviderManager.initialize) {
            await llmProviderManager.initialize();
            console.log('   ✅ LLMProviderManager initialized (post-constructor)');
        }
        // if (chatService.loadSessions) { // ChatService role changed
        //     await chatService.loadSessions();
        //     console.log('   ✅ Chat sessions loaded');
        // }
        // Call any init methods on new providers if they have them
        // e.g., if (enhancedChatProvider.initialize) { await enhancedChatProvider.initialize(); }

        console.log('🎉 The New Fuse extension activated successfully with Enhanced Providers');

        // Start Application Monitor
        console.log('📊 Starting Application Monitor...');
        const applicationMonitor = new ApplicationMonitor(context);
        applicationMonitor.startMonitoring();
        console.log('   ✅ Application Monitor started');

        // Initialize KanbanService
        console.log('📋 Initializing Kanban Service...');
        const kanbanService = new KanbanService({ suggestionService });
        context.subscriptions.push({
            dispose: () => {
                // Any cleanup for kanbanService if needed
                console.log('[Extension] KanbanService disposed (placeholder)');
            }
        });

        // Example: Load Kanban data on activation (you might do this on a command or webview load)
        kanbanService.loadData().then(() => {
            console.log('[Extension] Initial Kanban data loaded by KanbanService.');
            // You can now get data using kanbanService.getFilteredColumns() or kanbanService.getAirtableData()
            // and send it to a webview or use it in other extension parts.
            const airtableData = kanbanService.getAirtableData();
            console.log('[Extension] Airtable-compatible data:', JSON.stringify(airtableData.table.rows.length, null, 2) + ' rows');
        }).catch(error => {
            console.error('[Extension] Failed to load initial Kanban data:', error);
            vscode.window.showErrorMessage('Failed to load Kanban board data. Check console for details.');
        });

        // Register a command to open a Kanban board (example)
        let disposable = vscode.commands.registerCommand('the-new-fuse.openKanbanBoard', () => {
            vscode.window.showInformationMessage('Opening The New Fuse Kanban Board (placeholder)!');
            // Here you would typically create and show a webview panel
            // and pass data from kanbanService to it.
            // For now, let's just log the current columns
            const columns = kanbanService.getFilteredColumns();
            console.log('[Extension] Kanban columns for webview (example):', columns);
            vscode.window.showInformationMessage(`Kanban has ${columns.reduce((acc, col) => acc + col.items.length, 0)} items across ${columns.length} columns.`);

            // Example of using a filter
            // kanbanService.updateSearchTerm('dark mode');
            // console.log('[Extension] Filtered columns for "dark mode":', kanbanService.getFilteredColumns());
            // kanbanService.resetFilters();
        });

        context.subscriptions.push(disposable);

        // ... (rest of your activation code, like MCP, Roo output monitor, etc.)
    } catch (error) {
        console.error('❌ CRITICAL ERROR during extension activation (Refactored):', error);
        notificationService.showError(`The New Fuse extension failed to activate: ${error instanceof Error ? error.message : String(error)}`);
        // vscode.window.showErrorMessage(`The New Fuse extension failed to activate: ${error instanceof Error ? error.message : String(error)}`);
        throw error; // Re-throw to ensure VS Code knows the extension failed to activate
    }
}

/**
 * Check if the VS Code LM API is available
 */
async function checkVSCodeLmApiAvailability(): Promise<boolean> {
    try {
        const lmAvailable = vscode.lm !== undefined;
        console.log('VS Code LM API available:', lmAvailable);
        
        if (lmAvailable) {
            try {
                const models = await vscode.lm.selectChatModels({});
                console.log(`Found ${models?.length || 0} available language models`);
                return models && models.length > 0;
            } catch (err) {
                console.warn('Warning checking for language models (might be transient):', err);
                // Don't immediately return false, could be a temporary issue or no models configured yet.
                // The user will be warned by the main logic if it's a persistent problem.
            }
        }
        
        return lmAvailable; // Return based on API presence, model check is secondary for basic availability
    } catch (err) {
        console.error('Error checking for VS Code LM API availability:', err);
        return false;
    }
}

export function deactivate() {
    console.log('🔄 The New Fuse extension is being deactivated (Refactored)');
    // Cleanup logic for new services if needed.
    // CommandService should handle its own disposables if pushed to context.subscriptions.
    // Other services might need explicit dispose calls if they manage resources
    // that aren't automatically cleaned up by VS Code.

    // Cleanup Copilot coordination system
    try {
        // The coordinator should be accessible here for cleanup
        // In a real implementation, you'd want to store the coordinator reference
        // in a global variable or pass it to the deactivation function
        console.log('🤖 Cleaning up Copilot coordination system...');
    } catch (error) {
        console.error('Error during Copilot coordinator cleanup:', error);
    }

    // Example:
    // if (chatService && typeof chatService.dispose === 'function') {
    //     chatService.dispose();
    // }
    // if (llmService && typeof llmService.dispose === 'function') {
    //     llmService.dispose();
    // }
    // ... and so on for other services that implement vscode.Disposable

    console.log('✅ The New Fuse extension deactivated successfully (Refactored)');
}
