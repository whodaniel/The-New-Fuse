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
// import { ChatService } from './services/features/ChatService'; // Commented out, role might be superseded

// Communication Services
import { WebviewMessageRouter } from './services/communication/WebviewMessageRouter';
import { AgentCommunicationService } from './services/AgentCommunicationService'; // New Stub
import { LLMMonitoringService } from './services/LLMMonitoringService'; // New Stub

// LLM Management
import { LLMProviderManager } from './llm/LLMProviderManager';

// View Providers/Controllers (Assuming these are the "Enhanced" versions)
import { TabbedContainerProvider } from './views/TabbedContainerProvider';
import { ChatViewProvider } from './views/ChatViewProvider';
import { CommunicationHubProvider } from './views/CommunicationHubProvider';
import { DashboardProvider } from './views/DashboardProvider'; // New Stub
import { SettingsViewProvider } from './views/SettingsViewProvider'; // New Stub


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

export function activate(context: vscode.ExtensionContext) {
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
        const configurationService = new ConfigurationService(context); // Assuming context is needed
        console.log('   ✅ ConfigurationService initialized');
        const notificationService = new NotificationService();
        console.log('   ✅ NotificationService initialized');
        const commandService = new CommandService(context); // Assuming context is needed
        context.subscriptions.push(commandService);
        console.log('   ✅ CommandService initialized and subscribed');
        const storageService = new StorageService(context);
        console.log('   ✅ StorageService initialized');

        // Instantiate LLM Management
        console.log('🧠 Initializing LLM Management...');
        const llmProviderManager = new LLMProviderManager(configurationService, notificationService);
        console.log('   ✅ LLMProviderManager initialized');

        // Instantiate New Stub Services
        console.log('🛠️ Initializing New Stub Services...');
        const agentCommunicationService = new AgentCommunicationService(context);
        console.log('   ✅ AgentCommunicationService initialized');
        const llmMonitoringService = new LLMMonitoringService(context);
        console.log('   ✅ LLMMonitoringService initialized');

        // Instantiate Feature Services (LLMService might still be generally useful)
        console.log('✨ Initializing Feature Services...');
        const llmService = new LLMService(llmProviderManager, configurationService, notificationService);
        console.log('   ✅ LLMService initialized');
        // const chatService = new ChatService(llmService, storageService, notificationService, context); // Commented out, role likely changed
        // console.log('   ✅ ChatService initialized');

        // Instantiate "Enhanced" View Providers/Controllers
        console.log('🎨 Initializing Enhanced View Providers...');
        const enhancedChatProvider = new ChatViewProvider(context.extensionUri, context, llmProviderManager, agentCommunicationService, llmMonitoringService);
        console.log('   ✅ EnhancedChatViewProvider initialized');
        const communicationHubProvider = new CommunicationHubProvider(context.extensionUri, agentCommunicationService);
        console.log('   ✅ CommunicationHubProvider initialized');
        const dashboardProvider = new DashboardProvider(context);
        console.log('   ✅ DashboardProvider (Stub) initialized');
        const settingsProvider = new SettingsViewProvider(context);
        console.log('   ✅ SettingsProvider (Stub) initialized');

        // Instantiate Communication Services
        console.log('💬 Initializing Communication Services...');
        const webviewMessageRouter = new WebviewMessageRouter();
        console.log('   ✅ WebviewMessageRouter initialized');

        // Instantiate "Enhanced" Main View Provider (TabbedContainerProvider)
        console.log('🖼️ Initializing Enhanced Main View Provider...');
        const tabbedContainerProvider = new TabbedContainerProvider(
            context.extensionUri,
            context,
            enhancedChatProvider,
            communicationHubProvider,
            dashboardProvider,
            settingsProvider,
            webviewMessageRouter
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
