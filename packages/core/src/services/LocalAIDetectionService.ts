/**
 * Local AI Detection Service
 * Detects available local AI CLIs and registers them as Agents
 */

import { Injectable, Logger } from '@nestjs/common';
import { spawn } from 'child_process';
import { AgentType, CreateAgentDto, AgentCapability } from '@the-new-fuse/types';

export interface LocalAIProvider {
  name: string;
  command: string;
  checkCommand: string[];
  description: string;
  capabilities: AgentCapability[];
  defaultModel?: string;
  apiEndpoint?: string;
}

@Injectable()
export class LocalAIDetectionService {
  private readonly logger = new Logger(LocalAIDetectionService.name);

  private readonly supportedProviders: LocalAIProvider[] = [
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

  async detectAvailableAIs(): Promise<LocalAIProvider[]> {
    this.logger.log('🔍 Detecting available local AI providers...');
    const availableProviders: LocalAIProvider[] = [];

    for (const provider of this.supportedProviders) {
      try {
        const isAvailable = await this.checkProviderAvailability(provider);
        if (isAvailable) {
          this.logger.log(`✅ Found: ${provider.name}`);
          availableProviders.push(provider);
        } else {
          this.logger.debug(`❌ Not found: ${provider.name}`);
        }
      } catch (error) {
        this.logger.debug(`❌ Error checking ${provider.name}: ${error instanceof Error ? error.message : String(error)}`);
      }
    }

    this.logger.log(`🎯 Detected ${availableProviders.length} local AI providers`);
    return availableProviders;
  }

  async checkProviderAvailability(provider: LocalAIProvider): Promise<boolean> {
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
          } else {
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

  createAgentFromProvider(provider: LocalAIProvider, _userId: string): CreateAgentDto {
    return {
      name: provider.name,
      type: AgentType.ASSISTANT,
      description: provider.description,
      systemPrompt: `You are ${provider.name}, a local AI assistant. You have access to ${provider.capabilities.join(', ')} capabilities.`,
      capabilities: provider.capabilities,
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
      }
    };
  }

  async detectAndCreateAgents(userId: string): Promise<CreateAgentDto[]> {
    const availableProviders = await this.detectAvailableAIs();
    return availableProviders.map(provider => this.createAgentFromProvider(provider, userId));
  }

  async createDefaultSystemAgents(): Promise<CreateAgentDto[]> {
    this.logger.log('🚀 Creating default system agents for detected local AIs...');
    return this.detectAndCreateAgents('system');
  }

  async refreshAgentProviders(userId: string): Promise<CreateAgentDto[]> {
    this.logger.log(`🔄 Refreshing local AI agents for user: ${userId}`);
    return this.detectAndCreateAgents(userId);
  }
}