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
exports.OllamaProvider = void 0;
const vscode = __importStar(require("vscode"));
const logging_1 = require("../src/core/logging");
class OllamaProvider {
    constructor() {
        this.id = 'ollama';
        this.name = 'Ollama';
        this.logger = logging_1.Logger.getInstance();
        this.modelName = vscode.workspace.getConfiguration('theFuse').get('ollamaModel', 'llama2');
        this.endpoint = vscode.workspace.getConfiguration('theFuse').get('ollamaEndpoint', 'http://localhost:11434');
    }
    async generate(prompt, options) {
        try {
            const response = await fetch(`${this.endpoint}/api/generate`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    model: this.modelName,
                    prompt: options?.systemPrompt ? `${options.systemPrompt}\n\n${prompt}` : prompt,
                    stream: false,
                    options: {
                        temperature: options?.temperature ?? 0.7,
                        num_predict: options?.maxTokens,
                        stop: options?.stopSequences
                    }
                })
            });
            if (!response.ok) {
                throw new Error(`Ollama API error: ${response.statusText}`);
            }
            const data = await response.json();
            return {
                text: data.response,
                items: [{
                        insertText: data.response
                    }]
            };
        }
        catch (error) {
            this.logger.log(logging_1.LogLevel.ERROR, 'Ollama generation error:', error);
            throw error;
        }
    }
    async configure() {
        const endpoint = await vscode.window.showInputBox({
            prompt: 'Enter your Ollama endpoint URL',
            value: this.endpoint,
            placeHolder: 'http://localhost:11434'
        });
        if (endpoint) {
            await vscode.workspace.getConfiguration('theFuse').update('ollamaEndpoint', endpoint, true);
            this.endpoint = endpoint;
        }
    }
    async getAvailableModels() {
        try {
            const response = await fetch(`${this.endpoint}/api/tags`);
            if (!response.ok) {
                throw new Error(`Failed to fetch models: ${response.statusText}`);
            }
            const data = await response.json();
            return data.models?.map((model) => model.name) || ['llama2'];
        }
        catch (error) {
            this.logger.log(logging_1.LogLevel.ERROR, 'Failed to fetch Ollama models:', error);
            return ['llama2'];
        }
    }
    async setModel(model) {
        this.modelName = model;
        await vscode.workspace.getConfiguration('theFuse').update('ollamaModel', model, true);
    }
    async pullModel(modelName) {
        try {
            const response = await fetch(`${this.endpoint}/api/pull`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    name: modelName
                })
            });
            if (!response.ok) {
                throw new Error(`Failed to pull model: ${response.statusText}`);
            }
            this.logger.log(logging_1.LogLevel.INFO, `Successfully pulled model: ${modelName}`);
        }
        catch (error) {
            this.logger.log(logging_1.LogLevel.ERROR, `Failed to pull model ${modelName}:`, error);
            throw error;
        }
    }
}
exports.OllamaProvider = OllamaProvider;
//# sourceMappingURL=OllamaProvider.js.map