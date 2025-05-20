"use strict";
/**
 * Simplified LLM Orchestrator
 */
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
exports.LLMOrchestrator = void 0;
exports.createLLMOrchestrator = createLLMOrchestrator;
const vscode = __importStar(require("vscode"));
class LLMOrchestrator {
    constructor(context) {
        this.registeredAgents = [];
        this.context = context;
        this.statusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, 100);
        this.statusBarItem.text = "$(hubot) AI Agents";
        this.statusBarItem.tooltip = "Manage AI Agents";
        this.statusBarItem.command = 'llm-orchestrator.showAgents';
        this.statusBarItem.show();
        // Register commands
        this.registerCommands();
    }
    registerCommands() {
        // Register command to show registered agents
        this.context.subscriptions.push(vscode.commands.registerCommand('llm-orchestrator.showAgents', () => {
            this.showAgentsMenu();
        }));
        // Register command to discover agents
        this.context.subscriptions.push(vscode.commands.registerCommand('llm-orchestrator.discoverAgents', () => {
            this.discoverLLMAgents();
        }));
    }
    async discoverLLMAgents() {
        // This is a placeholder for actually discovering agents
        this.registeredAgents = [
            {
                id: 'copilot.agent',
                name: 'GitHub Copilot',
                description: 'AI code assistant powered by OpenAI',
                capabilities: ['code-generation', 'code-completion']
            },
            {
                id: 'claude.agent',
                name: 'Claude',
                description: 'Anthropic\'s Claude assistant',
                capabilities: ['text-generation', 'code-explanation']
            }
        ];
        vscode.window.showInformationMessage(`Discovered ${this.registeredAgents.length} AI agents.`);
        this.statusBarItem.text = `$(hubot) AI Agents (${this.registeredAgents.length})`;
    }
    async showAgentsMenu() {
        if (this.registeredAgents.length === 0) {
            vscode.window.showInformationMessage('No AI agents registered. Discover agents first.');
            return;
        }
        const items = this.registeredAgents.map(agent => ({
            label: agent.name,
            description: agent.description,
            detail: `ID: ${agent.id} | Capabilities: ${agent.capabilities.join(', ')}`,
            agent
        }));
        vscode.window.showQuickPick(items, {
            placeHolder: 'Select an AI agent to use',
            title: 'Available AI Agents'
        });
    }
    // Get registered agents
    getRegisteredAgents() {
        return this.registeredAgents;
    }
    // Dispose of resources
    dispose() {
        this.statusBarItem.dispose();
    }
}
exports.LLMOrchestrator = LLMOrchestrator;
// Export factory function
function createLLMOrchestrator(context) {
    return new LLMOrchestrator(context);
}
//# sourceMappingURL=llm-orchestrator-simple.js.map