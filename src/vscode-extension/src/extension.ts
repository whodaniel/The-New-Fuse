import * as vscode from 'vscode';
import { ChatViewProvider } from './views/ChatViewProvider';
import { LLMProviderManager } from './llm/LLMProviderManager';
import { AgentCommunicationService } from './services/AgentCommunicationService';
import { LLMMonitoringService } from './services/LLMMonitoringService';
import { WebviewMessageRouter } from './services/WebviewMessageRouter';
import { TabbedContainerProvider } from './views/TabbedContainerProvider';
import { CommunicationHubProvider } from './views/CommunicationHubProvider';
import { DashboardProvider } from './views/DashboardProvider';
import { SettingsViewProvider } from './views/SettingsViewProvider';

export function activate(context: vscode.ExtensionContext) {
    console.log('🚀 The New Fuse extension is being activated');

    try {
        // Initialize VS Code LM API availability check
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

        console.log('🔧 Initializing services...');
        
        console.log('   - Initializing LLMProviderManager...');
        const llmProviderManager = new LLMProviderManager(context);
        console.log('   ✅ LLMProviderManager initialized');
        
        console.log('   - Initializing LLMMonitoringService...');
        const llmMonitoringService = new LLMMonitoringService(context);
        console.log('   ✅ LLMMonitoringService initialized');
        
        console.log('   - Initializing AgentCommunicationService...');
        const agentCommunicationService = new AgentCommunicationService(context, llmProviderManager);
        console.log('   ✅ AgentCommunicationService initialized');
        
        console.log('   - Initializing WebviewMessageRouter...');
        const messageRouter = new WebviewMessageRouter(context, llmProviderManager, agentCommunicationService);
        console.log('   ✅ WebviewMessageRouter initialized');

        console.log('🎨 Creating view providers...');
        
        console.log('   - Creating ChatViewProvider...');
        const chatProvider = new ChatViewProvider(
            context.extensionUri,
            context,
            llmProviderManager,
            agentCommunicationService,
            llmMonitoringService
        );
        console.log('   ✅ ChatViewProvider created');
        
        console.log('   - Creating CommunicationHubProvider...');
        const communicationHubProvider = new CommunicationHubProvider(context.extensionUri, agentCommunicationService);
        console.log('   ✅ CommunicationHubProvider created');
        
        console.log('   - Creating DashboardProvider...');
        const dashboardProvider = new DashboardProvider(context.extensionUri, llmMonitoringService);
        console.log('   ✅ DashboardProvider created');
        
        console.log('   - Creating SettingsViewProvider...');
        const settingsProvider = new SettingsViewProvider(context.extensionUri, context, llmProviderManager, messageRouter);
        console.log('   ✅ SettingsViewProvider created');

        console.log('   - Creating TabbedContainerProvider...');
        const tabbedContainerProvider = new TabbedContainerProvider(
            context.extensionUri,
            context,
            chatProvider,
            communicationHubProvider,
            dashboardProvider,
            settingsProvider,
            messageRouter
        );
        console.log('   ✅ TabbedContainerProvider created');

        console.log('🔗 Registering webview view provider...');
        context.subscriptions.push(
            vscode.window.registerWebviewViewProvider(TabbedContainerProvider.viewType, tabbedContainerProvider, {
                webviewOptions: {
                    retainContextWhenHidden: true
                }
            })
        );
        console.log('   ✅ WebviewViewProvider registered successfully');

        // Register commands
        console.log('⚡ Registering commands...');
        context.subscriptions.push(
        vscode.commands.registerCommand('theFuse.startChat', () => tabbedContainerProvider.switchToTab('chat')),
        vscode.commands.registerCommand('theFuse.clearChat', () => chatProvider.clearChatHistory()),
        vscode.commands.registerCommand('theFuse.checkLLM', async () => {
            const diagnosticResult = await chatProvider.performDiagnostic();
            vscode.window.showInformationMessage(`Chat Diagnostic:\n${diagnosticResult}`);
        }),
        vscode.commands.registerCommand('theFuse.newChat', () => chatProvider.handleNewChat()),
        vscode.commands.registerCommand('theFuse.viewStarredMessages', () => chatProvider.viewStarredMessages()),
        vscode.commands.registerCommand('theFuse.exportChatHistory', async () => {
            const success = await chatProvider.exportChatHistory();
            if (success) {
                vscode.window.showInformationMessage('Chat history exported successfully!');
            } else {
                vscode.window.showErrorMessage('Failed to export chat history.');
            }
        }),
        vscode.commands.registerCommand('theFuse.importChatHistory', async () => {
            const success = await chatProvider.importChatHistory();
            if (success) {
                vscode.window.showInformationMessage('Chat history imported successfully!');
            } else {
                vscode.window.showErrorMessage('Failed to import chat history.');
            }
        }),
        vscode.commands.registerCommand('the-new-fuse.startAICollab', () => agentCommunicationService.startCollaboration()),
        vscode.commands.registerCommand('the-new-fuse.stopAICollab', () => agentCommunicationService.stopCollaboration()),
        vscode.commands.registerCommand('the-new-fuse.selectLLMProvider', () => llmProviderManager.showProviderQuickPick()),
        vscode.commands.registerCommand('the-new-fuse.checkLLMProviderHealth', async () => {
            const health = await llmProviderManager.checkProviderHealth();
            vscode.window.showInformationMessage(`LLM Provider Health: ${health.status === 'healthy' ? '✅' : '❌'} ${health.message}`);
        }),
        vscode.commands.registerCommand('the-new-fuse.resetLLMProviderHealth', () => {
            llmProviderManager.resetFailedProviders();
            vscode.window.showInformationMessage('LLM provider health has been reset.');
        }),
        vscode.commands.registerCommand('the-new-fuse.connectMCP', async () => {
            try {
                await agentCommunicationService.connect();
                vscode.window.showInformationMessage('Connected to MCP server.');
            } catch (error) {
                vscode.window.showErrorMessage(`Failed to connect to MCP: ${error instanceof Error ? error.message : String(error)}`);
            }
        }),
        vscode.commands.registerCommand('the-new-fuse.disconnectMCP', async () => {
            try {
                await agentCommunicationService.disconnect();
                vscode.window.showInformationMessage('Disconnected from MCP server.');
            } catch (error) {
                vscode.window.showErrorMessage(`Failed to disconnect from MCP: ${error instanceof Error ? error.message : String(error)}`);
            }
        }),
        vscode.commands.registerCommand('the-new-fuse.showChat', () => tabbedContainerProvider.focus()),
        vscode.commands.registerCommand('the-new-fuse.openSettings', () => tabbedContainerProvider.switchToTab('settings')),
        vscode.commands.registerCommand('the-new-fuse.notifyProviderSwitch', (previousProvider: string, newProvider: string) => {
            chatProvider.notifyProviderSwitch(previousProvider, newProvider);
        }),
        
        // Register new commands for selecting LM models
        vscode.commands.registerCommand('the-new-fuse.selectLLMModel', () => llmProviderManager.showModelQuickPick())
    );
    console.log('   ✅ Commands registered successfully');

    console.log('🎉 The New Fuse extension activated successfully');
    
    } catch (error) {
        console.error('❌ CRITICAL ERROR during extension activation:', error);
        vscode.window.showErrorMessage(`The New Fuse extension failed to activate: ${error instanceof Error ? error.message : String(error)}`);
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
                console.log('Error checking for language models:', err);
                return false;
            }
        }
        
        return false;
    } catch (err) {
        console.error('Error checking for VS Code LM API availability:', err);
        return false;
    }
}

export function deactivate() {
    console.log('The New Fuse extension is being deactivated');
}
