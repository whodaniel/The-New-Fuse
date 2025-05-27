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
exports.OpenAIProvider = void 0;
const vscode = __importStar(require("vscode"));
const logging_1 = require("../src/core/logging");
class OpenAIProvider {
    constructor() {
        this.id = 'openai';
        this.name = 'OpenAI';
        this.logger = logging_1.Logger.getInstance();
        this.modelName = vscode.workspace.getConfiguration('theFuse').get('openAIModel', 'gpt-4');
        this.apiKey = vscode.workspace.getConfiguration('theFuse').get('openAIAPIKey', '');
    }
    async generate(prompt, options) {
        if (!this.apiKey) {
            throw new Error('OpenAI API key not configured');
        }
        try {
            const response = await fetch('https://api.openai.com/v1/chat/completions', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.apiKey}`
                },
                body: JSON.stringify({
                    model: this.modelName,
                    messages: [
                        ...(options?.systemPrompt ? [{ role: 'system', content: options.systemPrompt }] : []),
                        { role: 'user', content: prompt }
                    ],
                    temperature: options?.temperature ?? 0.7,
                    max_tokens: options?.maxTokens,
                    stop: options?.stopSequences
                })
            });
            if (!response.ok) {
                throw new Error(`OpenAI API error: ${response.statusText}`);
            }
            const data = await response.json();
            return {
                text: data.choices[0].message.content,
                items: [{
                        insertText: data.choices[0].message.content
                    }]
            };
        }
        catch (error) {
            this.logger.log(logging_1.LogLevel.ERROR, 'OpenAI generation error:', error);
            throw error;
        }
    }
    async configure() {
        const apiKey = await vscode.window.showInputBox({
            prompt: 'Enter your OpenAI API key',
            password: true
        });
        if (apiKey) {
            await vscode.workspace.getConfiguration('theFuse').update('openAIAPIKey', apiKey, true);
            this.apiKey = apiKey;
        }
    }
    async getAvailableModels() {
        return ['gpt-4', 'gpt-3.5-turbo'];
    }
    async setModel(model) {
        this.modelName = model;
        await vscode.workspace.getConfiguration('theFuse').update('openAIModel', model, true);
    }
}
exports.OpenAIProvider = OpenAIProvider;
//# sourceMappingURL=OpenAIProvider.js.map