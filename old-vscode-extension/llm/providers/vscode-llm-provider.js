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
exports.VSCodeLLMProvider = void 0;
const vscode = __importStar(require("vscode"));
class VSCodeLLMProvider {
    constructor() { }
    async generateText(prompt, options) {
        try {
            // Use VS Code's built-in completions API
            const result = await vscode.commands.executeCommand('vscode.executeCompletionItemProvider', vscode.window.activeTextEditor?.document.uri, vscode.window.activeTextEditor?.selection.active, prompt);
            // Extract the completion text from the result
            const completionText = Array.isArray(result?.items) && result.items.length > 0
                ? result.items[0].insertText?.toString() || ''
                : '';
            return { text: completionText };
        }
        catch (error) {
            throw new Error(`VSCode LLM generation error: ${error.message}`);
        }
    }
}
exports.VSCodeLLMProvider = VSCodeLLMProvider;
//# sourceMappingURL=vscode-llm-provider.js.map