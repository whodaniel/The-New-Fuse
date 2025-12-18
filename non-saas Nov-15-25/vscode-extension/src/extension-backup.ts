import * as vscode from 'vscode';
import { ChatProvider } from './views/ChatProvider';
import { LLMProviderManager } from './llm/LLMProviderManager';
import { ApiClient } from './services/ApiClient';
import { ConfigurationManager } from './config/ConfigurationManager';

export async function activate(context: vscode.ExtensionContext) {
    console.log('Activating The New Fuse extension...');

    // Initialize core services
    const configManager = new ConfigurationManager(context);
    const apiClient = new ApiClient(configManager);
    const llmManager = new LLMProviderManager(configManager);

    // Initialize chat provider
    const chatProvider = new ChatProvider(context, apiClient, llmManager);
    
    // Register webview providers
    const tabbedContainerProvider = vscode.window.registerWebviewViewProvider(
        'theNewFuse.tabbedContainer',
        chatProvider,
        { webviewOptions: { retainContextWhenHidden: true } }
    );

    // Register commands
    const commands = [
        vscode.commands.registerCommand('the-new-fuse.showChat', () => {
            chatProvider.show();
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
    ];

    // Add to subscriptions
    context.subscriptions.push(
        tabbedContainerProvider,
        ...commands
    );

    // Initialize services
    await llmManager.initialize();

    console.log('The New Fuse extension activated successfully!');
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