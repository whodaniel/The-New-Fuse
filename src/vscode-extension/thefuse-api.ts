import * as vscode from 'vscode';
import { AgentClient } from './src/agent-communication.js';
import { Logger } from './src/core/logging.js';
import { TheFuseAPI, LanguageModelAccessInformation } from './src/types.js';

export class TheFuseAPIImpl implements TheFuseAPI {
    constructor(
        private readonly agentClient: AgentClient,
        private readonly logger: Logger
    ) {}

    public async sendMessage(message: string): Promise<string> {
        try {
            const result = await this.agentClient.sendMessage({
                type: 'message',
                payload: message,
                metadata: {
                    timestamp: new Date().toISOString()
                }
            });

            return typeof result === 'string' ? result : JSON.stringify(result);
        } catch (error) {
            this.logger.error('Error sending message:', error);
            throw error;
        }
    }

    public async getAvailableModels(): Promise<string[]> {
        try {
            const result = await this.agentClient.sendMessage({
                type: 'command',
                command: 'get_available_models'
            });

            return Array.isArray(result) ? result : [];
        } catch (error) {
            this.logger.error('Error getting available models:', error);
            throw error;
        }
    }

    public async getCurrentModel(): Promise<string> {
        try {
            const result = await this.agentClient.sendMessage({
                type: 'command',
                command: 'get_current_model'
            });

            return typeof result === 'string' ? result : '';
        } catch (error) {
            this.logger.error('Error getting current model:', error);
            throw error;
        }
    }
}