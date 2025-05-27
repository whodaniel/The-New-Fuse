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
exports.AICoderIntegration = exports.AICoderRole = void 0;
const vscode = __importStar(require("vscode"));
const logging_1 = require("./src/core/logging");
const ai_coder_1 = require("./src/types/ai-coder");
Object.defineProperty(exports, "AICoderRole", { enumerable: true, get: function () { return ai_coder_1.AICoderRole; } });
const agent_communication_1 = require("./agent-communication");
class AICoderIntegration {
    constructor(context, lmProvider) {
        this.extensionContext = context;
        this.lmProvider = lmProvider;
        this.logger = logging_1.Logger.getInstance();
        this.agentClient = agent_communication_1.AgentClient.getInstance();
        this.registerCommands();
    }
    registerCommands() {
        this.extensionContext.subscriptions.push(vscode.commands.registerCommand('thefuse.ai.consult', async () => {
            const editor = vscode.window.activeTextEditor;
            if (!editor) {
                vscode.window.showWarningMessage('Please open a file first');
                return;
            }
            const role = await vscode.window.showQuickPick(Object.values(ai_coder_1.AICoderRole), { placeHolder: 'Select AI role' });
            if (!role)
                return;
            const task = await vscode.window.showInputBox({
                placeHolder: 'What would you like the AI to help with?'
            });
            if (!task)
                return;
            const context = {
                fileUri: editor.document.uri,
                selection: editor.selection,
                workspaceFolder: vscode.workspace.getWorkspaceFolder(editor.document.uri),
                languageId: editor.document.languageId
            };
            return this.consultAICoder(role, task, context);
        }));
        this.extensionContext.subscriptions.push(vscode.commands.registerCommand('thefuse.ai.analyze', async () => {
            const editor = vscode.window.activeTextEditor;
            if (!editor) {
                vscode.window.showWarningMessage('Please open a file first');
                return;
            }
            const role = ai_coder_1.AICoderRole.Reviewer;
            const task = 'Analyze code and provide feedback';
            const context = {
                fileUri: editor.document.uri,
                workspaceFolder: vscode.workspace.getWorkspaceFolder(editor.document.uri),
                languageId: editor.document.languageId
            };
            return this.consultAICoder(role, task, context);
        }));
        // Listen for agent messages
        this.agentClient.subscribe(async (message) => {
            if (message.type === 'ai-consultation-request') {
                const { role, task, context } = message.payload;
                const result = await this.consultAICoder(role, task, context);
                await this.agentClient.sendMessage({
                    type: 'ai-consultation-response',
                    sender: 'ai-coder',
                    recipient: message.sender,
                    payload: result
                });
            }
        });
    }
    getSystemPrompt(role, task, context) {
        let prompt = `You are an AI ${role} assistant. ${task}\n\n`;
        if (context) {
            if (context.languageId) {
                prompt += `Language: ${context.languageId}\n`;
            }
            if (context.metadata) {
                prompt += `Additional context: ${JSON.stringify(context.metadata)}\n`;
            }
        }
        return prompt;
    }
    async consultAICoder(role, task, context) {
        try {
            this.logger.log(logging_1.LogLevel.INFO, `Consulting AI Coder`, { role, task });
            const systemPrompt = this.getSystemPrompt(role, task, context);
            const result = await this.lmProvider.generate(task, {
                systemPrompt,
                temperature: 0.3,
                maxTokens: 2000
            });
            return {
                response: result.text,
                suggestions: result.items?.map(item => ({
                    text: item.insertText || ''
                }))
            };
        }
        catch (error) {
            this.logger.log(logging_1.LogLevel.ERROR, 'AI Coder consultation failed:', error);
            throw error;
        }
    }
}
exports.AICoderIntegration = AICoderIntegration;
//# sourceMappingURL=ai-coder-integration.js.map