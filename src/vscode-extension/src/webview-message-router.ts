import { ExtensionLogger } from './core/logging.js';
import { LLMProviderManager } from './llm/LLMProviderManager.js';
import { RelayService } from './services/relay-service.js';

export interface WebViewMessage {
    command: string;
    text?: string;
    data?: any;
    timestamp?: string;
    type?: string;
    metadata?: Record<string, any>;
}

export class WebViewMessageRouter {
    constructor(
        private readonly logger: ExtensionLogger,
        private readonly llmManager: LLMProviderManager,
        private readonly relayService: RelayService
    ) {}

    public async handleMessage(message: WebViewMessage): Promise<void> {
        try {
            switch (message.command) {
                case 'status':
                    await this.handleStatusRequest();
                    break;
                case 'sendMessage':
                    if (message.text) {
                        await this.relayService.sendMessageToWeb({
                            command: 'message',
                            text: message.text,
                            timestamp: new Date().toISOString()
                        });
                    }
                    break;
                case 'llm-request':
                    await this.handleLLMRequest(message);
                    break;
                default:
                    this.logger.warn(`Unknown command: ${message.command}`);
            }
        } catch (error) {
            this.logger.error('Error handling webview message:', error);
            throw error; // Re-throw to allow caller to handle
        }
    }

    private async handleStatusRequest(): Promise<void> {
        try {
            const provider = await this.llmManager.getCurrentProvider();
            const providerInfo = provider ? await provider.getInfo() : undefined;

            await this.relayService.sendMessageToWeb({
                command: 'status',
                data: {
                    connected: this.relayService.getConnectionStatus(),
                    provider: providerInfo
                }
            });
        } catch (error) {
            this.logger.error('Error handling status request:', error);
            
            await this.relayService.sendMessageToWeb({
                command: 'status',
                data: {
                    connected: false,
                    error: 'Failed to get provider status'
                }
            });
        }
    }

    private async handleLLMRequest(message: WebViewMessage): Promise<void> {
        try {
            const provider = this.llmManager.getCurrentProvider();
            if (!provider) {
                throw new Error('No LLM provider available');
            }

            // Initialize if needed
            if (typeof provider.initialize === 'function') {
                await provider.initialize();
            }

            const response = await provider.generateText(message.text || '', message.metadata);
            
            await this.relayService.sendMessageToWeb({
                command: 'llm-response',
                text: response.text,
                metadata: response.metadata
            });
        } catch (error) {
            this.logger.error('Error handling LLM request:', error);
            
            await this.relayService.sendMessageToWeb({
                command: 'llm-error',
                data: {
                    error: error instanceof Error ? error.message : 'Unknown error'
                }
            });
            
            throw error; // Re-throw to allow caller to handle
        }
    }
}
