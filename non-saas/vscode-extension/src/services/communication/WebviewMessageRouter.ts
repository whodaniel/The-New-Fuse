import * as vscode from 'vscode';
import { ChatService } from '../features/ChatService';
import { LLMService } from '../features/LLMService';
import { ConfigurationService } from '../core/ConfigurationService';
import { NotificationService } from '../core/NotificationService';
import { CommunicationHubProvider } from '../../views/ViewProviders';

export interface WebviewMessage {
    command: string;
    payload?: any;
}

export class WebviewMessageRouter {
    private communicationHubProvider?: CommunicationHubProvider;

    constructor(
        private chatService: ChatService,
        private llmService: LLMService,
        private configService: ConfigurationService,
        private notificationService: NotificationService
    ) {}

    setCommunicationHubProvider(provider: CommunicationHubProvider): void {
        this.communicationHubProvider = provider;
    }

    async handleMessage(webview: vscode.Webview, message: WebviewMessage): Promise<any> {
        try {
            switch (message.command) {
                case 'chat:sendMessage':
                    return await this.handleChatMessage(message.payload);
                
                case 'chat:newSession':
                    return await this.handleNewSession(message.payload);
                
                case 'chat:clearHistory':
                    return await this.handleClearHistory();
                
                case 'llm:getProviders':
                    return await this.handleGetProviders();
                
                case 'config:get':
                    return this.handleGetConfig(message.payload);
                
                case 'config:update':
                    return await this.handleUpdateConfig(message.payload);
                
                default:
                    console.warn(`Unknown command: ${message.command}`);
                    return { error: `Unknown command: ${message.command}` };
            }
        } catch (error) {
            console.error(`Error handling message ${message.command}:`, error);
            return { error: error instanceof Error ? error.message : 'Unknown error' };
        }
    }

    private async handleChatMessage(payload: { message: string }): Promise<any> {
        const { message } = payload;
        
        await this.chatService.addMessage(message, 'user');
        
        const response = await this.llmService.generateResponse(message);
        await this.chatService.addMessage(response, 'assistant');
        
        return {
            userMessage: message,
            assistantResponse: response,
            session: this.chatService.getCurrentSession()
        };
    }

    private async handleNewSession(payload: { title?: string }): Promise<any> {
        const session = await this.chatService.createNewSession(payload?.title);
        return { session };
    }

    private async handleClearHistory(): Promise<any> {
        await this.chatService.clearHistory();
        return { success: true };
    }

    private async handleGetProviders(): Promise<any> {
        const providers = await this.llmService.getAvailableProviders();
        return { providers };
    }

    private handleGetConfig(payload: { key: string }): any {
        const { key } = payload;
        const value = this.configService.get(key);
        return { key, value };
    }

    private async handleUpdateConfig(payload: { key: string; value: any }): Promise<any> {
        const { key, value } = payload;
        await this.configService.update(key, value);
        return { success: true };
    }
}