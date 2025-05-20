"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.AnthropicProvider = void 0;
const vscode = __importStar(require("vscode"));
const logging_1 = require("../src/core/logging");
class AnthropicProvider {
    constructor() {
        this.id = 'anthropic';
        this.name = 'Anthropic';
        this.logger = logging_1.Logger.getInstance();
        this.modelName = vscode.workspace.getConfiguration('theFuse').get('anthropicModel', 'claude-2');
        this.apiKey = vscode.workspace.getConfiguration('theFuse').get('anthropicApiKey', '');
    }
    async generate(prompt, options) {
        if (!this.apiKey) {
            throw new Error('Anthropic API key not configured');
        }
        try {
            const response = await fetch('https://api.anthropic.com/v1/messages', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'x-api-key': this.apiKey,
                    'anthropic-version': '2023-06-01'
                },
                body: JSON.stringify({
                    model: this.modelName,
                    messages: [
                        ...(options?.systemPrompt ? [{ role: 'system', content: options.systemPrompt }] : []),
                        { role: 'user', content: prompt }
                    ],
                    max_tokens: options?.maxTokens || 1000,
                    temperature: options?.temperature ?? 0.7,
                    stop_sequences: options?.stopSequences
                })
            });
            if (!response.ok) {
                throw new Error(`Anthropic API error: ${response.statusText}`);
            }
            const data = await response.json();
            return {
                text: data.content[0].text,
                items: [{
                        insertText: data.content[0].text
                    }]
            };
        }
        catch (error) {
            this.logger.log(logging_1.LogLevel.ERROR, 'Anthropic generation error:', error);
            throw error;
        }
    }
    async configure() {
        const apiKey = await vscode.window.showInputBox({
            prompt: 'Enter your Anthropic API key',
            password: true
        });
        if (apiKey) {
            await vscode.workspace.getConfiguration('theFuse').update('anthropicApiKey', apiKey, true);
            this.apiKey = apiKey;
        }
    }
    async getAvailableModels() {
        return ['claude-2', 'claude-instant-1'];
    }
    async setModel(model) {
        this.modelName = model;
        await vscode.workspace.getConfiguration('theFuse').update('anthropicModel', model, true);
    }
}
exports.AnthropicProvider = AnthropicProvider;
//# sourceMappingURL=AnthropicProvider.js.map