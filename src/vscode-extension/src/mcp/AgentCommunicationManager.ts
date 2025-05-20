import * as vscode from 'vscode';
import { LLMProviderManager } from '../llm/LLMProviderManager.js';
import { getLogger, Logger, LogLevel, VSCodeLogger } from '../logger.js';
import { MCPMessage, MCPRequest, MCPResponse } from '../types/mcp.js';
import { GenerateOptions } from '../types/llm.js';
import { TelemetryService } from '../core/telemetry.js';
import { ConfigurationManager } from '../core/configuration.js';

export class AgentCommunicationManager {
    private messageQueue: MCPRequest[] = [];
    private isProcessing: boolean = false;
    
    constructor(
        private llmManager: LLMProviderManager,
        private logger: Logger,
        private telemetry: TelemetryService,
        private configManager: ConfigurationManager
    ) {}

    public async sendRequest(request: MCPRequest): Promise<MCPResponse> {
        const config = this.configManager.getConfiguration();
        if (!config.mcpEnabled) {
            throw new Error('MCP communication is disabled');
        }

        this.messageQueue.push(request);
        this.logger.debug('Request queued:', request);
        
        return this.processQueue();
    }

    private async processQueue(): Promise<MCPResponse> {
        if (this.messageQueue.length === 0) {
            throw new Error('No messages in queue');
        }

        if (this.isProcessing) {
            return new Promise((resolve) => {
                const checkQueue = setInterval(() => {
                    if (!this.isProcessing) {
                        clearInterval(checkQueue);
                        this.processNextMessage().then(resolve);
                    }
                }, 100);
            });
        }

        return this.processNextMessage();
    }

    private async processNextMessage(): Promise<MCPResponse> {
        this.isProcessing = true;
        const message = this.messageQueue.shift() as MCPRequest;

        try {
            this.telemetry.sendTelemetryEvent({
                name: 'mcp.request',
                properties: {
                    type: message.type,
                    intent: message.intent
                }
            });

            const prompt = this.constructPrompt(message);
            const result = await this.generateResponse(prompt);
            const response = this.parseResponse(result);
            
            this.telemetry.sendTelemetryEvent({
                name: 'mcp.response',
                properties: {
                    type: response.type,
                    status: response.status
                }
            });

            return response;
        } catch (error) {
            this.logger.error('Failed to process message:', error);
            throw error;
        } finally {
            this.isProcessing = false;
        }
    }

    private async generateResponse(prompt: string): Promise<string> {
        const options: GenerateOptions = {
            temperature: 0.7,
            maxTokens: 1000
        };

        return await this.llmManager.generate(prompt, options);
    }

    private constructPrompt(request: MCPRequest): string {
        // Construct prompt based on the MCP request
        return `Process MCP request:
Type: ${request.type}
Intent: ${request.intent}
Payload: ${JSON.stringify(request.payload)}`;
    }

    private parseResponse(text: string): MCPResponse {
        try {
            // Basic response parsing - in practice, you'd want more sophisticated parsing
            return {
                type: 'response',
                status: 'success',
                payload: { message: text }
            };
        } catch (error) {
            return {
                type: 'response',
                status: 'error',
                error: {
                    code: 'PARSE_ERROR',
                    message: 'Failed to parse response',
                    details: error
                }
            };
        }
    }

    public clearQueue(): void {
        this.messageQueue = [];
        this.isProcessing = false;
    }

    public getQueueLength(): number {
        return this.messageQueue.length;
    }

    public isCurrentlyProcessing(): boolean {
        return this.isProcessing;
    }
}