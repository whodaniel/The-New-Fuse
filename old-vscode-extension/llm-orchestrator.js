"use strict";
/**
 * LLM Orchestrator for VS Code Extensions
 *
 * This module coordinates multiple AI LLM extensions in VS Code
 * to enable collaborative AI coding capabilities.
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
exports.OrchestratorUI = exports.LLMOrchestrator = void 0;
exports.createLLMOrchestrator = createLLMOrchestrator;
const vscode = __importStar(require("vscode"));
const React = __importStar(require("react"));
const logging_1 = require("./core/logging");
const agent_communication_1 = require("./agent-communication");
const utilities_1 = require("./utilities");
// LLM Orchestrator class
class LLMOrchestrator {
    constructor(context) {
        this.registeredAgents = new Map();
        this.activeTasks = new Map();
        this.context = context;
        this.logger = logging_1.Logger.getInstance();
        this.outputChannel = vscode.window.createOutputChannel('LLM Orchestrator');
        this.statusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, 100);
        this.statusBarItem.text = "$(hubot) AI Agents";
        this.statusBarItem.tooltip = "Manage AI Agents";
        this.statusBarItem.command = 'llm-orchestrator.showAgents';
        this.statusBarItem.show();
        // Initialize communication
        this.initialize();
    }
    async initialize() {
        // Create agent client for this orchestrator
        this.agentClient = (0, agent_communication_1.createAgentClient)(this.context, 'llm-orchestrator', this.outputChannel);
        // Register this orchestrator
        await this.agentClient.register('LLM Orchestrator', ['orchestration', 'llm-coordination', 'workflow-execution'], '1.0.0');
        // Load registered agents from storage
        const savedAgents = this.context.globalState.get('llm-orchestrator.agents', []);
        savedAgents.forEach(agent => {
            this.registeredAgents.set(agent.id, agent);
        });
        // Subscribe to messages
        await this.agentClient.subscribe(this.handleMessage.bind(this));
        // Register commands
        this.registerCommands();
        // Discover available LLM agents in VS Code
        this.discoverLLMAgents();
        this.log('LLM Orchestrator initialized');
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
        // Register command to execute agent action
        this.context.subscriptions.push(vscode.commands.registerCommand('llm-orchestrator.executeAgent', async (agentId, action, input) => {
            return this.executeAgentAction(agentId, action, input);
        }));
        // Register command to create collaborative task
        this.context.subscriptions.push(vscode.commands.registerCommand('llm-orchestrator.createCollaborativeTask', () => {
            this.startCollaborativeTask();
        }));
    }
    async handleMessage(message) {
        this.log(`Received message: ${message.action} from ${message.sender}`);
        switch (message.action) {
            case 'register':
                if (message.payload.agent) {
                    await this.registerAgent(message.payload.agent);
                }
                break;
            case 'taskStatus':
                if (message.payload.taskId) {
                    await this.updateTaskStatus(message.payload.taskId, message.payload.status, message.payload.result, message.payload.error);
                }
                break;
            case 'requestAssistance':
                await this.handleAssistanceRequest(message.sender, message.payload);
                break;
            default:
                this.log(`Unknown action: ${message.action}`);
        }
    }
    async discoverLLMAgents() {
        this.log('Discovering LLM agents in VS Code...');
        // This is a simplified discovery mechanism
        // In a real implementation, we would use VS Code extension API to discover 
        // extensions that declare themselves as LLM agents
        // For now, we'll query specific known commands that LLM extensions might expose
        const possibleAgents = [
            { id: 'github.copilot', name: 'GitHub Copilot', commandId: 'github.copilot.generate' },
            { id: 'ms-toolsai.vscode-ai', name: 'Azure AI', commandId: 'vscode-ai.execute' },
            { id: 'anthropic.claude', name: 'Claude', commandId: 'anthropic.claude.generate' },
            { id: 'openai.gpt4', name: 'GPT-4', commandId: 'openai.gpt4.generate' },
            { id: 'codellama.vscode', name: 'Code Llama', commandId: 'codellama.generate' },
            { id: 'codeium.codeium', name: 'Codeium', commandId: 'codeium.generate' }
        ];
        for (const agent of possibleAgents) {
            try {
                // Check if the command exists by trying to get its implementation
                // Note: This is not a reliable way to check, but VS Code API has limitations
                const hasCommand = await vscode.commands.getCommands(true)
                    .then(commands => commands.includes(agent.commandId));
                if (hasCommand) {
                    // Create agent entry
                    const llmAgent = {
                        id: agent.id,
                        name: agent.name,
                        description: `${agent.name} AI assistant`,
                        capabilities: ['code-generation', 'code-completion', 'code-explanation'],
                        version: '1.0.0',
                        extensionId: agent.id,
                        commandId: agent.commandId
                    };
                    await this.registerAgent(llmAgent);
                    this.log(`Discovered agent: ${agent.name}`);
                }
            }
            catch (error) {
                // Command doesn't exist or can't be executed
                this.log(`Agent ${agent.name} not available: ${(0, utilities_1.getErrorMessage)(error)}`);
            }
        }
        this.statusBarItem.text = `$(hubot) AI Agents (${this.registeredAgents.size})`;
        if (this.registeredAgents.size === 0) {
            vscode.window.showInformationMessage('No LLM agents discovered. Try installing compatible AI extensions.');
        }
        else {
            vscode.window.showInformationMessage(`Discovered ${this.registeredAgents.size} LLM agents in VS Code.`);
        }
    }
    async registerAgent(agent) {
        // Add to our registry if not already present
        if (!this.registeredAgents.has(agent.id)) {
            this.registeredAgents.set(agent.id, agent);
            // Persist to storage
            await this.context.globalState.update('llm-orchestrator.agents', Array.from(this.registeredAgents.values()));
            this.log(`Registered agent: ${agent.name} (${agent.id})`);
            this.statusBarItem.text = `$(hubot) AI Agents (${this.registeredAgents.size})`;
            return true;
        }
        return false;
    }
    async executeAgentAction(agentId, action, input) {
        const agent = this.registeredAgents.get(agentId);
        if (!agent) {
            throw new Error(`Agent not found: ${agentId}`);
        }
        // Create a task to track this execution
        const taskId = `task-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;
        const task = {
            id: taskId,
            agentId,
            action,
            input,
            status: 'pending',
            startTime: Date.now()
        };
        this.activeTasks.set(taskId, task);
        try {
            // Set task to running
            task.status = 'running';
            // Execute the agent's command
            this.log(`Executing ${agent.name} (${action})`);
            // Different agents have different command signatures, so we need to handle this
            // This is a simplified approach - in a real implementation we'd need more
            // sophisticated command mapping
            let result;
            if (agent.id === 'github.copilot') {
                // GitHub Copilot has a specific command signature
                result = await vscode.commands.executeCommand(agent.commandId, input.prompt, input.context);
            }
            else if (agent.id === 'ms-toolsai.vscode-ai') {
                // Azure AI might have a different signature
                result = await vscode.commands.executeCommand(agent.commandId, {
                    prompt: input.prompt,
                    context: input.context,
                    options: input.options
                });
            }
            else {
                // Generic approach for other LLM extensions
                result = await vscode.commands.executeCommand(agent.commandId, input);
            }
            // Update task status
            task.status = 'completed';
            task.result = result;
            task.endTime = Date.now();
            return result;
        }
        catch (error) {
            // Update task with error
            task.status = 'failed';
            task.error = (0, utilities_1.getErrorMessage)(error);
            task.endTime = Date.now();
            this.log(`Execution error (${agent.name}): ${(0, utilities_1.getErrorMessage)(error)}`);
            throw error;
        }
    }
    async updateTaskStatus(taskId, status, result, error) {
        const task = this.activeTasks.get(taskId);
        if (!task) {
            this.log(`Task not found: ${taskId}`);
            return;
        }
        task.status = status;
        if (status === 'completed' || status === 'failed') {
            task.endTime = Date.now();
            if (status === 'completed') {
                task.result = result;
            }
            else {
                task.error = error;
            }
        }
    }
    async handleAssistanceRequest(senderId, payload) {
        // Find an agent that can help with this task
        const availableAgents = Array.from(this.registeredAgents.values())
            .filter(agent => agent.id !== senderId); // Exclude the sender
        if (availableAgents.length === 0) {
            await this.agentClient.sendMessage(senderId, 'assistanceResponse', {
                success: false,
                error: 'No other agents available to help'
            });
            return;
        }
        // For now, just use the first available agent
        // In a real implementation, we'd select based on capabilities
        const selectedAgent = availableAgents[0];
        try {
            // Execute the helper agent
            const result = await this.executeAgentAction(selectedAgent.id, 'assist', {
                task: payload.task,
                context: payload.context,
                requesterId: senderId
            });
            // Send the result back to the requester
            await this.agentClient.sendMessage(senderId, 'assistanceResponse', {
                success: true,
                agentId: selectedAgent.id,
                result
            });
        }
        catch (error) {
            await this.agentClient.sendMessage(senderId, 'assistanceResponse', {
                success: false,
                agentId: selectedAgent.id,
                error: error.message
            });
        }
    }
    async showAgentsMenu() {
        if (this.registeredAgents.size === 0) {
            vscode.window.showInformationMessage('No LLM agents registered. Discover agents first.');
            return;
        }
        const agents = Array.from(this.registeredAgents.values());
        const items = agents.map(agent => ({
            label: agent.name,
            description: agent.description,
            detail: `ID: ${agent.id} | Capabilities: ${agent.capabilities.join(', ')}`,
            agent
        }));
        const selected = await vscode.window.showQuickPick(items, {
            placeHolder: 'Select an AI agent to use',
            title: 'Available AI Agents'
        });
        if (selected) {
            this.showAgentActions(selected.agent);
        }
    }
    async showAgentActions(agent) {
        const actions = [
            { label: '$(code) Generate Code', action: 'generateCode' },
            { label: '$(book) Explain Code', action: 'explainCode' },
            { label: '$(debug) Refactor Code', action: 'refactorCode' },
            { label: '$(question) Ask Question', action: 'askQuestion' },
            { label: '$(trash) Unregister Agent', action: 'unregister' }
        ];
        const selected = await vscode.window.showQuickPick(actions, {
            placeHolder: `Select action for ${agent.name}`,
            title: `${agent.name} Actions`
        });
        if (!selected)
            return;
        switch (selected.action) {
            case 'generateCode':
                await this.executeCodeGeneration(agent);
                break;
            case 'explainCode':
                await this.executeCodeExplanation(agent);
                break;
            case 'refactorCode':
                await this.executeCodeRefactoring(agent);
                break;
            case 'askQuestion':
                await this.executeAskQuestion(agent);
                break;
            case 'unregister':
                await this.unregisterAgent(agent.id);
                break;
        }
    }
    async executeCodeGeneration(agent) {
        const prompt = await vscode.window.showInputBox({
            prompt: 'What code would you like to generate?',
            placeHolder: 'e.g., A function to calculate Fibonacci numbers'
        });
        if (!prompt)
            return;
        try {
            vscode.window.withProgress({
                location: vscode.ProgressLocation.Notification,
                title: `${agent.name} is generating code...`,
                cancellable: false
            }, async (progress) => {
                const result = await this.executeAgentAction(agent.id, 'generateCode', { prompt });
                // Create a new document with the result
                const document = await vscode.workspace.openTextDocument({
                    content: typeof result === 'string' ? result : JSON.stringify(result, null, 2),
                    language: 'javascript' // Default to JavaScript, could be improved
                });
                await vscode.window.showTextDocument(document);
            });
        }
        catch (error) {
            vscode.window.showErrorMessage(`Error: ${(0, utilities_1.getErrorMessage)(error)}`);
        }
    }
    async executeCodeExplanation(agent) {
        // Get current selection or document
        const editor = vscode.window.activeTextEditor;
        if (!editor) {
            vscode.window.showErrorMessage('No active editor');
            return;
        }
        const selection = editor.selection;
        const text = selection.isEmpty
            ? editor.document.getText()
            : editor.document.getText(selection);
        if (!text) {
            vscode.window.showErrorMessage('No code selected');
            return;
        }
        try {
            vscode.window.withProgress({
                location: vscode.ProgressLocation.Notification,
                title: `${agent.name} is explaining code...`,
                cancellable: false
            }, async (progress) => {
                const result = await this.executeAgentAction(agent.id, 'explainCode', {
                    code: text,
                    language: editor.document.languageId
                });
                // Show the explanation in a webview
                const panel = vscode.window.createWebviewPanel('codeExplanation', 'Code Explanation', vscode.ViewColumn.Beside, {});
                panel.webview.html = `
          <!DOCTYPE html>
          <html>
          <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <style>
              body { font-family: sans-serif; padding: 20px; }
              pre { background-color: #f5f5f5; padding: 10px; border-radius: 5px; }
              .explanation { line-height: 1.6; }
            </style>
          </head>
          <body>
            <h2>Code Explanation from ${agent.name}</h2>
            <div class="explanation">${typeof result === 'string' ? result : JSON.stringify(result, null, 2)}</div>
          </body>
          </html>
        `;
            });
        }
        catch (error) {
            vscode.window.showErrorMessage(`Error: ${(0, utilities_1.getErrorMessage)(error)}`);
        }
    }
    async executeCodeRefactoring(agent) {
        // Get current selection or document
        const editor = vscode.window.activeTextEditor;
        if (!editor) {
            vscode.window.showErrorMessage('No active editor');
            return;
        }
        const selection = editor.selection;
        const text = selection.isEmpty
            ? editor.document.getText()
            : editor.document.getText(selection);
        if (!text) {
            vscode.window.showErrorMessage('No code selected');
            return;
        }
        const instructions = await vscode.window.showInputBox({
            prompt: 'Refactoring instructions',
            placeHolder: 'e.g., Make this more efficient, use async/await, etc.'
        });
        if (!instructions)
            return;
        try {
            vscode.window.withProgress({
                location: vscode.ProgressLocation.Notification,
                title: `${agent.name} is refactoring code...`,
                cancellable: false
            }, async (progress) => {
                const result = await this.executeAgentAction(agent.id, 'refactorCode', {
                    code: text,
                    language: editor.document.languageId,
                    instructions
                });
                // Apply the refactored code
                if (typeof result === 'string') {
                    editor.edit(editBuilder => {
                        if (selection.isEmpty) {
                            // Replace entire document
                            const fullRange = new vscode.Range(0, 0, editor.document.lineCount - 1, editor.document.lineAt(editor.document.lineCount - 1).range.end.character);
                            editBuilder.replace(fullRange, result);
                        }
                        else {
                            // Replace only the selection
                            editBuilder.replace(selection, result);
                        }
                    });
                }
            });
        }
        catch (error) {
            vscode.window.showErrorMessage(`Error: ${(0, utilities_1.getErrorMessage)(error)}`);
        }
    }
    async executeAskQuestion(agent) {
        const question = await vscode.window.showInputBox({
            prompt: 'What would you like to ask?',
            placeHolder: 'e.g., How do I implement X? What is the difference between Y and Z?'
        });
        if (!question)
            return;
        // Get current file context
        const editor = vscode.window.activeTextEditor;
        const fileContext = editor ? editor.document.getText() : undefined;
        try {
            vscode.window.withProgress({
                location: vscode.ProgressLocation.Notification,
                title: `${agent.name} is thinking...`,
                cancellable: false
            }, async (progress) => {
                const result = await this.executeAgentAction(agent.id, 'askQuestion', {
                    question,
                    fileContext,
                    language: editor?.document.languageId
                });
                // Show the answer in a webview
                const panel = vscode.window.createWebviewPanel('agentAnswer', 'AI Answer', vscode.ViewColumn.Beside, {});
                panel.webview.html = `
          <!DOCTYPE html>
          <html>
          <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <style>
              body { font-family: sans-serif; padding: 20px; }
              pre { background-color: #f5f5f5; padding: 10px; border-radius: 5px; }
              .answer { line-height: 1.6; }
            </style>
          </head>
          <body>
            <h2>Answer from ${agent.name}</h2>
            <div class="answer">${typeof result === 'string' ? result : JSON.stringify(result, null, 2)}</div>
          </body>
          </html>
        `;
            });
        }
        catch (error) {
            vscode.window.showErrorMessage(`Error: ${(0, utilities_1.getErrorMessage)(error)}`);
        }
    }
    async unregisterAgent(agentId) {
        if (this.registeredAgents.has(agentId)) {
            this.registeredAgents.delete(agentId);
            // Update storage
            await this.context.globalState.update('llm-orchestrator.agents', Array.from(this.registeredAgents.values()));
            this.statusBarItem.text = `$(hubot) AI Agents (${this.registeredAgents.size})`;
            vscode.window.showInformationMessage(`Agent unregistered successfully.`);
        }
    }
    async startCollaborativeTask() {
        if (this.registeredAgents.size < 2) {
            vscode.window.showInformationMessage('Need at least 2 AI agents for collaboration. Please discover more agents.');
            return;
        }
        const taskOptions = [
            { label: '$(code) Code Generation & Review', value: 'codeGenerationReview' },
            { label: '$(debug) Bug Fixing & Testing', value: 'bugFixingTesting' },
            { label: '$(book) Documentation & Explanation', value: 'documentationExplanation' },
            { label: '$(pencil) Refactoring & Optimization', value: 'refactoringOptimization' }
        ];
        const selectedTask = await vscode.window.showQuickPick(taskOptions, {
            placeHolder: 'Select a collaborative task type',
            title: 'AI Agent Collaboration'
        });
        if (!selectedTask)
            return;
        // Implementation for collaborative tasks would be added here
        // This would involve coordinating multiple agents to work together
        vscode.window.showInformationMessage(`Collaborative task ${selectedTask.label} started.`);
        // In a real implementation, we'd orchestrate a workflow between multiple agents
    }
    log(message) {
        this.outputChannel.appendLine(`[${new Date().toISOString()}] ${message}`);
    }
    // Dispose of resources
    dispose() {
        this.statusBarItem.dispose();
        this.outputChannel.dispose();
    }
    // Execute a workflow step with proper error handling
    async executeStep(step, context, results) {
        try {
            this.logger.info(`Executing step ${step.id || 'unknown'}`);
            // Step execution logic would go here
            // This is a placeholder for the actual implementation
            return {
                success: true,
                // Step execution result would go here
            };
        }
        catch (error) {
            this.logger.error(`Error executing step ${step.id || 'unknown'}:`, error);
            // Return structured error
            return {
                error: error instanceof Error ? error.message : 'Unknown error during step execution',
                success: false
            };
        }
    }
}
exports.LLMOrchestrator = LLMOrchestrator;
// Example React component for the Orchestrator UI
const OrchestratorUI = ({ orchestrator }) => {
    // Component state and logic would go here
    return React.createElement("div", null, "LLM Orchestrator UI");
};
exports.OrchestratorUI = OrchestratorUI;
// Export factory function
function createLLMOrchestrator(context) {
    return new LLMOrchestrator(context);
}
//# sourceMappingURL=llm-orchestrator.js.map