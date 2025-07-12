var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var AgentLLMService_1;
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '../config/ConfigService';
import { spawn } from 'child_process';
let AgentLLMService = AgentLLMService_1 = class AgentLLMService {
    configService;
    logger = new Logger(AgentLLMService_1.name);
    constructor(configService) {
        this.configService = configService;
    }
    async processMessage(message, agent) {
        if (!message || message.trim() === '') {
            throw new Error('Message cannot be empty');
        }
        const config = agent?.configuration;
        if (config?.localAI) {
            return this.processLocalAIMessage(message, agent);
        }
        // Fallback to default processing
        return `Processed: ${message}`;
    }
    async getAgentResponse(prompt, agent) {
        if (!prompt || prompt.trim() === '') {
            throw new Error('Prompt cannot be empty');
        }
        const config = agent?.configuration;
        if (config?.localAI) {
            return this.getLocalAIResponse(prompt, agent);
        }
        // Fallback response
        return {
            content: `Agent response to: ${prompt}`,
            provider: 'default'
        };
    }
    async processLocalAIMessage(message, agent) {
        const config = agent.configuration;
        const provider = config?.provider;
        const command = config?.command;
        if (!command) {
            throw new Error(`No command configured for local AI provider: ${provider}`);
        }
        this.logger.log(`🤖 Processing message with ${provider}`);
        try {
            // Handle different local AI providers
            switch (provider) {
                case 'Claude Code CLI':
                    return this.executeClaudeCodeCLI(message, agent);
                case 'Gemini CLI':
                    return this.executeGeminiCLI(message, agent);
                case 'Ollama':
                    return this.executeOllama(message, agent);
                default:
                    return this.executeGenericCommand(message, agent);
            }
        }
        catch (error) {
            this.logger.error(`❌ Error processing with ${provider}: ${error.message}`);
            throw new Error(`Failed to process message with ${provider}: ${error.message}`);
        }
    }
    async getLocalAIResponse(prompt, agent) {
        const response = await this.processLocalAIMessage(prompt, agent);
        const config = agent.configuration;
        return {
            content: response,
            provider: config?.provider || 'unknown',
            model: config?.defaultModel,
            usage: {
                promptTokens: prompt.length,
                completionTokens: response.length,
                totalTokens: prompt.length + response.length
            }
        };
    }
    async executeClaudeCodeCLI(message, agent) {
        return new Promise((resolve, reject) => {
            const process = spawn('claude', ['--model', 'claude-3-5-sonnet-20241022'], {
                stdio: 'pipe'
            });
            let output = '';
            let error = '';
            process.stdout.on('data', (data) => {
                output += data.toString();
            });
            process.stderr.on('data', (data) => {
                error += data.toString();
            });
            process.on('close', (code) => {
                if (code === 0) {
                    resolve(output.trim());
                }
                else {
                    reject(new Error(`Claude Code CLI exited with code ${code}: ${error}`));
                }
            });
            process.on('error', (err) => {
                reject(new Error(`Failed to start Claude Code CLI: ${err.message}`));
            });
            // Send the message to Claude
            process.stdin.write(message);
            process.stdin.end();
        });
    }
    async executeGeminiCLI(message, agent) {
        return new Promise((resolve, reject) => {
            const process = spawn('gemini', ['chat'], {
                stdio: 'pipe'
            });
            let output = '';
            let error = '';
            process.stdout.on('data', (data) => {
                output += data.toString();
            });
            process.stderr.on('data', (data) => {
                error += data.toString();
            });
            process.on('close', (code) => {
                if (code === 0) {
                    resolve(output.trim());
                }
                else {
                    reject(new Error(`Gemini CLI exited with code ${code}: ${error}`));
                }
            });
            process.on('error', (err) => {
                reject(new Error(`Failed to start Gemini CLI: ${err.message}`));
            });
            // Send the message to Gemini
            process.stdin.write(message);
            process.stdin.end();
        });
    }
    async executeOllama(message, agent) {
        const config = agent.configuration;
        const model = config?.defaultModel || 'llama2';
        return new Promise((resolve, reject) => {
            const process = spawn('ollama', ['run', model], {
                stdio: 'pipe'
            });
            let output = '';
            let error = '';
            process.stdout.on('data', (data) => {
                output += data.toString();
            });
            process.stderr.on('data', (data) => {
                error += data.toString();
            });
            process.on('close', (code) => {
                if (code === 0) {
                    resolve(output.trim());
                }
                else {
                    reject(new Error(`Ollama exited with code ${code}: ${error}`));
                }
            });
            process.on('error', (err) => {
                reject(new Error(`Failed to start Ollama: ${err.message}`));
            });
            // Send the message to Ollama
            process.stdin.write(message + '\n');
            process.stdin.end();
        });
    }
    async executeGenericCommand(message, agent) {
        const config = agent.configuration;
        const command = config?.command;
        return new Promise((resolve, reject) => {
            const process = spawn(command, [], {
                stdio: 'pipe'
            });
            let output = '';
            let error = '';
            process.stdout.on('data', (data) => {
                output += data.toString();
            });
            process.stderr.on('data', (data) => {
                error += data.toString();
            });
            process.on('close', (code) => {
                if (code === 0) {
                    resolve(output.trim() || 'No response from AI provider');
                }
                else {
                    reject(new Error(`${command} exited with code ${code}: ${error}`));
                }
            });
            process.on('error', (err) => {
                reject(new Error(`Failed to start ${command}: ${err.message}`));
            });
            // Send the message
            process.stdin.write(message);
            process.stdin.end();
        });
    }
    /**
     * Get available local AI agents for a user
     */
    async getAvailableLocalAIAgents(userId) {
        // This would integrate with AgentService to get local AI agents
        // For now, return empty array as placeholder
        return [];
    }
    /**
     * Test connectivity to a local AI agent
     */
    async testLocalAIAgent(agent) {
        try {
            const testMessage = "Hello, this is a connectivity test.";
            const response = await this.processLocalAIMessage(testMessage, agent);
            return response.length > 0;
        }
        catch (error) {
            this.logger.error(`❌ Local AI agent test failed: ${error.message}`);
            return false;
        }
    }
};
AgentLLMService = AgentLLMService_1 = __decorate([
    Injectable(),
    __metadata("design:paramtypes", [ConfigService])
], AgentLLMService);
export { AgentLLMService };
