import * as vscode from 'vscode';
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
    ];

    // Add to subscriptions
    context.subscriptions.push(
        providerRegistration,
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