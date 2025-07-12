/**
 * Local AI Detection Service
 * Detects available local AI CLIs and registers them as Agents
 */
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var LocalAIDetectionService_1;
import { Injectable, Logger } from '@nestjs/common';
import { spawn } from 'child_process';
import { AgentType, CreateAgentDto, AgentCapability } from '@the-new-fuse/types';
let LocalAIDetectionService = LocalAIDetectionService_1 = class LocalAIDetectionService {
    logger = new Logger(LocalAIDetectionService_1.name);
    supportedProviders = [
        {
            name: 'Claude Code CLI',
            command: 'claude',
            checkCommand: ['claude', '--version'],
            description: 'Anthropic Claude Code CLI - Local AI assistant',
            capabilities: [
                AgentCapability.CHAT,
                AgentCapability.CODE_GENERATION,
                AgentCapability.FILE_MANAGEMENT,
                AgentCapability.DATA_ANALYSIS,
                AgentCapability.AUTOMATION
            ]
        },
        {
            name: 'Gemini CLI',
            command: 'gemini',
            checkCommand: ['gemini', '--version'],
            description: 'Google Gemini CLI - Local AI assistant',
            capabilities: [
                AgentCapability.CHAT,
                AgentCapability.CODE_GENERATION,
                AgentCapability.DATA_ANALYSIS
            ]
        },
        {
            name: 'Ollama',
            command: 'ollama',
            checkCommand: ['ollama', 'list'],
            description: 'Ollama - Local LLM runner',
            capabilities: [
                AgentCapability.CHAT,
                AgentCapability.CODE_GENERATION
            ],
            apiEndpoint: 'http://localhost:11434'
        },
        {
            name: 'LM Studio',
            command: 'lms',
            checkCommand: ['curl', '-s', 'http://localhost:1234/v1/models'],
            description: 'LM Studio - Local AI interface',
            capabilities: [
                AgentCapability.CHAT,
                AgentCapability.CODE_GENERATION
            ],
            apiEndpoint: 'http://localhost:1234'
        },
        {
            name: 'GPT4All',
            command: 'gpt4all',
            checkCommand: ['gpt4all', '--version'],
            description: 'GPT4All - Local GPT models',
            capabilities: [
                AgentCapability.CHAT,
                AgentCapability.CODE_GENERATION
            ]
        },
        {
            name: 'LocalAI',
            command: 'local-ai',
            checkCommand: ['curl', '-s', 'http://localhost:8080/v1/models'],
            description: 'LocalAI - Open source local AI',
            capabilities: [
                AgentCapability.CHAT,
                AgentCapability.CODE_GENERATION,
                AgentCapability.API_INTEGRATION
            ],
            apiEndpoint: 'http://localhost:8080'
        }
    ];
    async detectAvailableAIs() {
        this.logger.log('🔍 Detecting available local AI providers...');
        const availableProviders = [];
        for (const provider of this.supportedProviders) {
            try {
                const isAvailable = await this.checkProviderAvailability(provider);
                if (isAvailable) {
                    this.logger.log(`✅ Found: ${provider.name}`);
                    availableProviders.push(provider);
                }
                else {
                    this.logger.debug(`❌ Not found: ${provider.name}`);
                }
            }
            catch (error) {
                this.logger.debug(`❌ Error checking ${provider.name}: ${error instanceof Error ? error.message : String(error)}`);
            }
        }
        this.logger.log(`🎯 Detected ${availableProviders.length} local AI providers`);
        return availableProviders;
    }
    async checkProviderAvailability(provider) {
        return new Promise((resolve) => {
            const [command, ...args] = provider.checkCommand;
            const process = spawn(command, args, {
                stdio: 'pipe',
                timeout: 5000
            });
            let hasResponded = false;
            process.on('close', (code) => {
                if (!hasResponded) {
                    hasResponded = true;
                    // For network-based checks (curl), success is code 0
                    // For CLI tools, they might return different codes but still be available
                    if (provider.checkCommand[0] === 'curl') {
                        resolve(code === 0);
                    }
                    else {
                        resolve(code !== null && code < 2);
                    }
                }
            });
            process.on('error', () => {
                if (!hasResponded) {
                    hasResponded = true;
                    resolve(false);
                }
            });
            // Timeout fallback
            setTimeout(() => {
                if (!hasResponded) {
                    hasResponded = true;
                    process.kill();
                    resolve(false);
                }
            }, 5000);
        });
    }
    createAgentFromProvider(provider, userId) {
        return new CreateAgentDto({
            name: provider.name,
            type: AgentType.ASSISTANT,
            description: provider.description,
            systemPrompt: `You are ${provider.name}, a local AI assistant. You have access to ${provider.capabilities.join(', ')} capabilities.`,
            capabilities: provider.capabilities.map(cap => ({
                name: cap,
                description: `${cap} capability provided by ${provider.name}`,
                parameters: {
                    provider: provider.name,
                    command: provider.command,
                    apiEndpoint: provider.apiEndpoint
                }
            })),
            configuration: {
                provider: provider.name,
                command: provider.command,
                apiEndpoint: provider.apiEndpoint,
                localAI: true,
                autoDetected: true
            },
            metadata: {
                detectedAt: new Date(),
                providerType: 'local',
                version: 'auto-detected'
            },
            provider: provider.name
        });
    }
    async detectAndCreateAgents(userId) {
        const availableProviders = await this.detectAvailableAIs();
        return availableProviders.map(provider => this.createAgentFromProvider(provider, userId));
    }
    async createDefaultSystemAgents() {
        this.logger.log('🚀 Creating default system agents for detected local AIs...');
        return this.detectAndCreateAgents('system');
    }
    async refreshAgentProviders(userId) {
        this.logger.log(`🔄 Refreshing local AI agents for user: ${userId}`);
        return this.detectAndCreateAgents(userId);
    }
};
LocalAIDetectionService = LocalAIDetectionService_1 = __decorate([
    Injectable()
], LocalAIDetectionService);
export { LocalAIDetectionService };
