import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '../config/ConfigService';
import { spawn } from 'child_process';
import { Agent } from '@the-new-fuse/types';

interface LocalAIConfiguration {
  localAI?: boolean;
  provider?: string;
  command?: string;
  defaultModel?: string;
  autoDetected?: boolean;
  systemAgent?: boolean;
}

export interface LLMResponse {
  content: string;
  provider: string;
  model?: string;
  usage?: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
}

@Injectable()
export class AgentLLMService {
  private readonly logger = new Logger(AgentLLMService.name);

  constructor(private readonly configService: ConfigService) {}

  async processMessage(message: string, agent?: Agent): Promise<string> {
    if (!message || message.trim() === '') {
      throw new Error('Message cannot be empty');
    }
    
    const config = agent?.configuration as LocalAIConfiguration;
    if (config?.localAI) {
      return this.processLocalAIMessage(message, agent);
    }
    
    // Fallback to default processing
    return `Processed: ${message}`;
  }

  async getAgentResponse(prompt: string, agent?: Agent): Promise<LLMResponse> {
    if (!prompt || prompt.trim() === '') {
      throw new Error('Prompt cannot be empty');
    }
    
    const config = agent?.configuration as LocalAIConfiguration;
    if (config?.localAI) {
      return this.getLocalAIResponse(prompt, agent);
    }
    
    // Fallback response
    return {
      content: `Agent response to: ${prompt}`,
      provider: 'default'
    };
  }

  private async processLocalAIMessage(message: string, agent: Agent): Promise<string> {
    const config = agent.configuration as LocalAIConfiguration;
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
    } catch (error) {
      this.logger.error(`❌ Error processing with ${provider}: ${(error as Error).message}`);
      throw new Error(`Failed to process message with ${provider}: ${(error as Error).message}`);
    }
  }

  private async getLocalAIResponse(prompt: string, agent: Agent): Promise<LLMResponse> {
    const response = await this.processLocalAIMessage(prompt, agent);
    const config = agent.configuration as LocalAIConfiguration;
    
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

  private async executeClaudeCodeCLI(message: string, agent: Agent): Promise<string> {
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
        } else {
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

  private async executeGeminiCLI(message: string, agent: Agent): Promise<string> {
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
        } else {
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

  private async executeOllama(message: string, agent: Agent): Promise<string> {
    const config = agent.configuration as LocalAIConfiguration;
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
        } else {
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

  private async executeGenericCommand(message: string, agent: Agent): Promise<string> {
    const config = agent.configuration as LocalAIConfiguration;
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
        } else {
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
  async getAvailableLocalAIAgents(userId: string): Promise<Agent[]> {
    // This would integrate with AgentService to get local AI agents
    // For now, return empty array as placeholder
    return [];
  }

  /**
   * Test connectivity to a local AI agent
   */
  async testLocalAIAgent(agent: Agent): Promise<boolean> {
    try {
      const testMessage = "Hello, this is a connectivity test.";
      const response = await this.processLocalAIMessage(testMessage, agent);
      return response.length > 0;
    } catch (error) {
      this.logger.error(`❌ Local AI agent test failed: ${(error as Error).message}`);
      return false;
    }
  }
}