import { Injectable, Logger } from '@nestjs/common';
import { spawn } from 'child_process';
import { LLMProvider } from '../LLMProvider.js';
import { LLMMessage, LLMResponse, LLMConfig } from '@the-new-fuse/types';

export interface OpenCodeCliConfig extends LLMConfig {
  cliPath?: string;
}

/**
 * OpenCode CLI Provider
 *
 * Uses the opencode CLI tool to generate completions.
 * The CLI must be installed and available in PATH.
 *
 * Supported models:
 * - anthropic/claude-sonnet-4-5
 * - anthropic/claude-haiku-4-5
 * - openai/gpt-4
 * - And many more via OpenCode's provider system
 *
 * Features:
 * - Full IDE integration (LSP, formatters)
 * - File editing capabilities
 * - Multi-session support
 * - Tool execution
 */
@Injectable()
export class OpenCodeCliProvider extends LLMProvider {
  protected readonly logger = new Logger(OpenCodeCliProvider.name);

  constructor(private readonly config: OpenCodeCliConfig) {
    super();
  }

  /**
   * Generate completion from prompt using OpenCode CLI
   */
  async generate(prompt: string): Promise<string> {
    return new Promise((resolve, reject) => {
      try {
        const model = this.config.modelName || 'anthropic/claude-sonnet-4-5';
        const cliPath = this.config.cliPath || 'opencode';

        const args = ['-p', '--output-format', 'json', '--model', model, '--no-chrome', '-'];

        const child = spawn(cliPath, args, {
          stdio: ['pipe', 'pipe', 'pipe'],
        });

        let stdout = '';
        let stderr = '';

        child.stdout.on('data', (data) => {
          stdout += data.toString();
        });

        child.stderr.on('data', (data) => {
          stderr += data.toString();
        });

        child.on('close', (code) => {
          if (code !== 0 && stderr) {
            this.logger.warn(`OpenCode CLI stderr: ${stderr}`);
          }

          if (code === 0) {
            resolve(this.parseResponse(stdout));
          } else {
            reject(new Error(`OpenCode CLI exited with code ${code}: ${stderr}`));
          }
        });

        child.on('error', (err) => {
          reject(err);
        });

        child.stdin.write(prompt);
        child.stdin.end();
      } catch (error) {
        this.logger.error('Failed to generate completion from OpenCode CLI', error);
        reject(error);
      }
    });
  }

  /**
   * Chat completion with message history
   */
  async chat(messages: LLMMessage[], config?: Partial<LLMConfig>): Promise<LLMResponse> {
    const mergedConfig = { ...this.config, ...config };
    const prompt = this.messagesToPrompt(messages);

    const result = await this.generate(prompt);

    return {
      content: result,
      usage: {
        promptTokens: this.estimateTokens(prompt),
        completionTokens: this.estimateTokens(result),
        totalTokens: this.estimateTokens(prompt) + this.estimateTokens(result),
      },
      metadata: {
        provider: 'opencode-cli',
        model: mergedConfig.modelName,
      },
    };
  }

  /**
   * Convert messages to OpenCode CLI prompt format
   */
  private messagesToPrompt(messages: LLMMessage[]): string {
    const parts: string[] = [];

    for (const msg of messages) {
      switch (msg.role) {
        case 'system':
          parts.push(`System: ${msg.content}`);
          break;
        case 'user':
          parts.push(`User: ${msg.content}`);
          break;
        case 'assistant':
          parts.push(`Assistant: ${msg.content}`);
          break;
      }
    }

    return parts.join('\n\n');
  }

  /**
   * Parse JSON response from OpenCode CLI
   */
  private parseResponse(output: string): string {
    try {
      const trimmed = output.trim();
      const lastLine = trimmed.split('\n').pop() || trimmed;

      const parsed = JSON.parse(lastLine);

      if (parsed.response) {
        return parsed.response;
      }
      if (parsed.content) {
        return parsed.content;
      }
      if (typeof parsed === 'string') {
        return parsed;
      }

      return lastLine;
    } catch {
      return output.trim();
    }
  }

  /**
   * Estimate token count (rough approximation)
   */
  private estimateTokens(text: string): number {
    return Math.ceil(text.length / 4);
  }
}
