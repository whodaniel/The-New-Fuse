import * as vscode from 'vscode';
import { LLMProviderManager } from '../llm/LLMProviderManager';
import { AgentCommunicationService } from './AgentCommunicationService';

export interface WebViewMessage {
    command: string;
    text?: string;
    data?: any;
    timestamp?: string;
    type?: string;
    metadata?: Record<string, any>;
}

/**
 * WebViewMessageRouter service
 * 
 * Handles routing of messages between webviews and various services in the extension.
 * Acts as a central messaging hub for webview communications.
 */
export class WebviewMessageRouter {
    constructor(
        private readonly context: vscode.ExtensionContext,
        private readonly llmManager: LLMProviderManager,
        private readonly communicationService: AgentCommunicationService
    ) {}

    /**
     * Handle messages from webviews
     */
    public async handleMessage(message: WebViewMessage): Promise<void> {
        try {
            console.log(`WebviewMessageRouter: Handling message with command: ${message.command}`);
            
            switch (message.command) {
                case 'status':
                    await this.handleStatusRequest();
                    break;
                case 'sendMessage':
                    await this.handleSendMessage(message);
                    break;
                case 'llm-request':
                    await this.handleLLMRequest(message);
                    break;
                case 'saveSettings':
                    await this.handleSaveSettings(message.data);
                    break;
                case 'testConnection':
                    await this.handleTestConnection(message.data);
                    break;
                case 'getDashboardStats':
                    await this.handleGetDashboardStats();
                    break;
                case 'getConnectionStatus':
                    await this.handleGetConnectionStatus();
                    break;
                case 'clearMonitoringData':
                    await this.handleClearMonitoringData();
                    break;
                case 'startCollaboration':
                    await this.handleStartCollaboration();
                    break;
                case 'ready':
                    await this.handleWebviewReady();
                    break;
                default:
                    console.warn(`WebviewMessageRouter: Unknown command: ${message.command}`);
            }
        } catch (error) {
            console.error('WebviewMessageRouter: Error handling webview message:', error);
            throw error; // Re-throw to allow caller to handle
        }
    }

    /**
     * Handle status request message
     */
    private async handleStatusRequest(): Promise<void> {
        try {
            const provider = await this.llmManager.getCurrentProvider();
            const providerInfo = provider?.getInfo ? await provider.getInfo() : undefined; // Optional chaining for getInfo
            const connected = this.communicationService ? this.communicationService.isConnected() : false;

            // Send status back to all webviews through the communication service
            await this.communicationService.broadcastMessage('status', {
                connected: connected,
                provider: providerInfo
            });
        } catch (error) {
            console.error('WebviewMessageRouter: Error handling status request:', error);
            
            await this.communicationService.broadcastMessage('status', {
                connected: false,
                error: 'Failed to get provider status'
            });
        }
    }

    /**
     * Handle send message command
     */
    private async handleSendMessage(message: WebViewMessage): Promise<void> {
        if (message.text) {
            await this.communicationService.broadcastMessage('message', {
                text: message.text,
                timestamp: new Date().toISOString()
            });
        }
    }

    /**
     * Handle LLM request message
     */
    private async handleLLMRequest(message: WebViewMessage): Promise<void> {
        try {
            const provider = await this.llmManager.getCurrentProvider();
            if (!provider) {
                throw new Error('No LLM provider available');
            }

            // Initialize if needed
            if (provider.isInitialized && !(await provider.isInitialized())) { // Await isInitialized if it's a promise
                if (provider.initialize) {
                    await provider.initialize(); // Await initialize
                }
            }

            // Use generateText if available, otherwise fall back to query
            let response;
            if (provider.generateText) { // Check if generateText exists on provider
                response = await provider.generateText(message.text || '', message.metadata);
            } else if (provider.query) { // Fallback to query if generateText is not available
                const text = await provider.query(message.text || '', message.metadata);
                response = { text, metadata: {} };
            } else {
                throw new Error('Provider does not support text generation or querying.');
            }
            
            await this.communicationService.broadcastMessage('llm-response', {
                text: response.text,
                metadata: response.metadata
            });
        } catch (error) {
            console.error('WebviewMessageRouter: Error handling LLM request:', error);
            
            await this.communicationService.broadcastMessage('llm-error', {
                error: error instanceof Error ? error.message : 'Unknown error'
            });
        }
    }

    /**
     * Handle save settings message
     */
    private async handleSaveSettings(settings: any): Promise<void> {
        try {
            if (!settings) {
                throw new Error('No settings provided');
            }

            console.log('Saving settings:', settings);
            
            // Update settings
            for (const [key, value] of Object.entries(settings)) {
                try {
                    if (key.includes('.')) {
                        // For dot notation settings (e.g., "ollama.url"), split and use section-based approach
                        const [section, settingName] = key.split('.', 2);
                        const config = vscode.workspace.getConfiguration('theNewFuse.' + section);
                        await config.update(settingName, value, vscode.ConfigurationTarget.Global);
                    } else {
                        // For top-level settings (e.g., "llmProvider")
                        const config = vscode.workspace.getConfiguration('theNewFuse');
                        await config.update(key, value, vscode.ConfigurationTarget.Global);
                    }
                    console.log(`Successfully updated setting: theNewFuse.${key} = ${value}`);
                } catch (settingError) {
                    console.error(`Error updating setting ${key}:`, settingError);
                    throw new Error(`Failed to update setting: ${key}. ${settingError instanceof Error ? settingError.message : String(settingError)}`);
                }
            }

            vscode.window.showInformationMessage('The New Fuse settings saved successfully!');
            
            // Notify all webviews that settings were updated
            await this.communicationService.broadcastMessage('settings-updated', settings);
        } catch (error) {
            console.error('WebviewMessageRouter: Error saving settings:', error);
            vscode.window.showErrorMessage(`Failed to save settings: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }

    /**
     * Handle get dashboard stats message
     */
    private async handleGetDashboardStats(): Promise<void> {
        try {
            // Get stats from monitoring service or other sources
            const stats = {
                llmRequests: 0,
                agentMessages: 0,
                activeSessions: 0,
                errors: 0
            };

            await this.communicationService.broadcastMessage('dashboardStats', stats);
        } catch (error) {
            console.error('WebviewMessageRouter: Error getting dashboard stats:', error);
        }
    }

    /**
     * Handle get connection status message
     */
    private async handleGetConnectionStatus(): Promise<void> {
        try {
            const connected = this.communicationService.isConnected();
            
            await this.communicationService.broadcastMessage('connectionStatus', { connected });
        } catch (error) {
            console.error('WebviewMessageRouter: Error getting connection status:', error);
        }
    }

    /**
     * Handle clear monitoring data message
     */
    private async handleClearMonitoringData(): Promise<void> {
        try {
            // Clear monitoring data
            await this.communicationService.broadcastMessage('monitoringDataCleared', { success: true });
            
            vscode.window.showInformationMessage('Monitoring data cleared successfully!');
        } catch (error) {
            console.error('WebviewMessageRouter: Error clearing monitoring data:', error);
            vscode.window.showErrorMessage('Failed to clear monitoring data');
        }
    }

    /**
     * Handle start collaboration message
     */
    private async handleStartCollaboration(): Promise<void> {
        try {
            // Start collaboration - this could trigger various initialization
            await this.communicationService.broadcastMessage('collaborationStarted', { timestamp: new Date().toISOString() });
            
            vscode.window.showInformationMessage('AI Collaboration started!');
        } catch (error) {
            console.error('WebviewMessageRouter: Error starting collaboration:', error);
            vscode.window.showErrorMessage('Failed to start collaboration');
        }
    }

    /**
     * Handle webview ready message
     */
    private async handleWebviewReady(): Promise<void> {
        try {
            // Send initial status when webview is ready
            await this.handleStatusRequest();
        } catch (error) {
            console.error('WebviewMessageRouter: Error handling webview ready:', error);
        }
    }

    /**
     * Handle test connection message
     */
    private async handleTestConnection(data: any): Promise<void> {
        try {
            const provider = data?.provider || 'vscode';
            console.log(`Testing connection for provider: ${provider}`);
            
            // Test the provider
            const testResult = await this.llmManager.checkProviderHealth();
            
            if (testResult.status === 'healthy') {
                vscode.window.showInformationMessage(`✅ Provider connection successful!`);
                await this.communicationService.broadcastMessage('test-connection-result', { success: true, provider, message: 'Connection successful!' });
            } else {
                vscode.window.showErrorMessage(`❌ Provider connection failed: ${testResult.message}`);
                await this.communicationService.broadcastMessage('test-connection-result', { success: false, provider, error: testResult.message });
            }
        } catch (error) {
            console.error('WebviewMessageRouter: Error testing connection:', error);
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            vscode.window.showErrorMessage(`Connection test failed: ${errorMessage}`);
            await this.communicationService.broadcastMessage('test-connection-result', { success: false, error: errorMessage });
        }
    }
}
