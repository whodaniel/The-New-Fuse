import * as vscode from 'vscode';
import { RelayService } from './relay-service.js';
import { LLMProviderManager } from './llm/LLMProviderManager.js';

interface WebViewMessage {
    type: string;
    text: string;
    metadata?: Record<string, any>;
}

export class WebViewMessageRouter {
    constructor(
        private readonly relayService: RelayService,
        private readonly llmManager: LLMProviderManager
    ) {}

    async handleMessage(message: WebViewMessage): Promise<void> {
        try {
            if (this.relayService.isRelayConnected()) {
                switch (message.type) {
                    case 'llm-request':
                        await this.handleLLMRequest(message);
                        break;
                    default:
                        this.relayService.sendMessageToWeb(message.text);
                }
            }
        } catch (error) {
            vscode.window.showErrorMessage(`Failed to process message: ${(error as Error).message}`);
        }
    }

    private async handleLLMRequest(message: WebViewMessage): Promise<void> {
        try {
            const provider = this.llmManager.getCurrentProvider();
            if (!provider) {
                throw new Error('No LLM provider available');
            }

            const response = await provider.generateText(message.text, message.metadata);
            this.relayService.sendMessageToWeb(response.text);
        } catch (error) {
            vscode.window.showErrorMessage(`Failed to process with LLM: ${(error as Error).message}`);
        }
    }
}