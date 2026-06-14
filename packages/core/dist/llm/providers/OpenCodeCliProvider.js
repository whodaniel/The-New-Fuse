var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var OpenCodeCliProvider_1;
import { Injectable, Logger } from '@nestjs/common';
import { spawn } from 'child_process';
import { LLMProvider } from '../LLMProvider.js';
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
let OpenCodeCliProvider = OpenCodeCliProvider_1 = class OpenCodeCliProvider extends LLMProvider {
    constructor(config) {
        super();
        this.config = config;
        this.logger = new Logger(OpenCodeCliProvider_1.name);
    }
    /**
     * Generate completion from prompt using OpenCode CLI
     */
    async generate(prompt) {
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
                    }
                    else {
                        reject(new Error(`OpenCode CLI exited with code ${code}: ${stderr}`));
                    }
                });
                child.on('error', (err) => {
                    reject(err);
                });
                child.stdin.write(prompt);
                child.stdin.end();
            }
            catch (error) {
                this.logger.error('Failed to generate completion from OpenCode CLI', error);
                reject(error);
            }
        });
    }
    /**
     * Chat completion with message history
     */
    async chat(messages, config) {
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
    messagesToPrompt(messages) {
        const parts = [];
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
    parseResponse(output) {
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
        }
        catch {
            return output.trim();
        }
    }
    /**
     * Estimate token count (rough approximation)
     */
    estimateTokens(text) {
        return Math.ceil(text.length / 4);
    }
};
OpenCodeCliProvider = OpenCodeCliProvider_1 = __decorate([
    Injectable(),
    __metadata("design:paramtypes", [Object])
], OpenCodeCliProvider);
export { OpenCodeCliProvider };
//# sourceMappingURL=OpenCodeCliProvider.js.map