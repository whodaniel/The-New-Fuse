/**
 * LLM Orchestrator for VS Code Extensions
 * 
 * This module coordinates multiple AI LLM extensions in VS Code
 * to enable collaborative AI coding capabilities.
 */

import * as vscode from 'vscode';
import * as React from 'react';
import { Logger, getLogger } from './src/core/logging.js';
import { createAgentClient, AgentMessage } from './agent-communication.js';
import { getErrorMessage } from './utilities.js';

// Define the LLM Agent interface
export interface LLMAgent {
  id: string;
  name: string;
  capabilities: string[];
  version: string;
  status: 'active' | 'inactive';
  lastSeen: number;
}

// Define the Agent Task interface
export interface AgentTask {
  id: string;
  agentId: string;
  action: string;
  input: any;
  status: 'pending' | 'running' | 'completed' | 'failed';
  result?: any;
  error?: string;
  startTime: number;
  endTime?: number;
}

// LLM Orchestrator class
export class LLMOrchestrator {
  private context: vscode.ExtensionContext;
  private agentClient: any;
  private registeredAgents: Map<string, LLMAgent> = new Map();
  private activeTasks: Map<string, AgentTask> = new Map();
  private statusBarItem: vscode.StatusBarItem;
  private outputChannel: vscode.OutputChannel; 
  private readonly logger: Logger;
  
  constructor(context: vscode.ExtensionContext) {
    this.context = context;
    this.logger = getLogger('LLMOrchestrator');
    this.outputChannel = vscode.window.createOutputChannel('LLM Orchestrator');
    this.statusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, 100);
    this.statusBarItem.text = "$(hubot) AI Agents";
    this.statusBarItem.tooltip = "Manage AI Agents";
    this.statusBarItem.command = 'llm-orchestrator.showAgents';
    this.statusBarItem.show();
    
    // Initialize communication
    this.initialize();
  }
  
  private async initialize() {
    try {
      // Create agent client for this orchestrator
      this.agentClient = createAgentClient(this.context, 'llm-orchestrator', this.outputChannel);
      
      // Register this orchestrator
      await this.agentClient.register(
        'LLM Orchestrator',
        ['orchestration', 'llm-coordination', 'workflow-execution'],
        '1.0.0'
      );
      
      // Load registered agents from storage
      const savedAgents = this.context.globalState.get<LLMAgent[]>('llm-orchestrator.agents', []);
      savedAgents.forEach(agent => {
        this.registeredAgents.set(agent.id, agent);
      });
      
      // Subscribe to messages
      await this.agentClient.subscribe(this.handleMessage.bind(this));
      
      // Register commands
      this.registerCommands();
      
      // Discover available LLM agents in VS Code
      this.discoverLLMAgents();
      
      this.logger.info('LLM Orchestrator initialized');
    } catch (error) {
      this.logger.error('Failed to initialize LLM Orchestrator:', error);
      throw error;
    }
  }
  
  private registerCommands() {
    // Register command to show registered agents
    this.context.subscriptions.push(
      vscode.commands.registerCommand('llm-orchestrator.showAgents', () => {
        this.showAgentsMenu();
      })
    );
    
    // Register command to discover agents
    this.context.subscriptions.push(
      vscode.commands.registerCommand('llm-orchestrator.discoverAgents', () => {
        this.discoverLLMAgents();
      })
    );
    
    // Register command to execute agent action
    this.context.subscriptions.push(
      vscode.commands.registerCommand('llm-orchestrator.executeAgent', async (agentId: string, action: string, input: any) => {
        return this.executeAgentAction(agentId, action, input);
      })
    );
    
    // Register command to create collaborative task
    this.context.subscriptions.push(
      vscode.commands.registerCommand('llm-orchestrator.createCollaborativeTask', () => {
        this.startCollaborativeTask();
      })
    );
  }

  private async handleMessage(message: AgentMessage): Promise<void> {
    this.logger.info(`Received message: ${message.action} from ${message.sender}`);
    
    try {
      switch (message.action) {
        case 'register':
          if (message.payload?.agent) {
            await this.registerAgent(message.payload.agent);
          }
          break;
          
        case 'taskStatus':
          if (message.payload?.taskId) {
            await this.updateTaskStatus(
              message.payload.taskId,
              message.payload.status,
              message.payload.result,
              message.payload.error
            );
          }
          break;
          
        case 'requestAssistance':
          await this.handleAssistanceRequest(message.sender, message.payload);
          break;
          
        default:
          this.logger.warn(`Unknown action: ${message.action}`);
      }
    } catch (error) {
      this.logger.error(`Error handling message:`, error);
      // Could add error handling/recovery here
    }
  }
  
  private async discoverLLMAgents() {
    try {
      this.logger.info('Discovering LLM agents...');
      // Implementation would go here
      // This is a placeholder for the actual agent discovery logic
    } catch (error) {
      this.logger.error('Failed to discover LLM agents:', error);
      throw error;
    }
  }

  private async registerAgent(agent: LLMAgent): Promise<boolean> {
    try {
      if (this.registeredAgents.has(agent.id)) {
        this.logger.info(`Agent ${agent.id} already registered`);
        return false;
      }

      this.registeredAgents.set(agent.id, agent);
      await this.context.globalState.update(
        'llm-orchestrator.agents',
        Array.from(this.registeredAgents.values())
      );

      this.logger.info(`Registered agent: ${agent.name} (${agent.id})`);
      return true;
    } catch (error) {
      this.logger.error(`Failed to register agent ${agent.id}:`, error);
      throw error;
    }
  }

  private async executeAgentAction(agentId: string, action: string, input: any): Promise<any> {
    try {
      this.logger.info(`Executing action ${action} for agent ${agentId}`);
      const agent = this.registeredAgents.get(agentId);
      
      if (!agent) {
        throw new Error(`Agent ${agentId} not found`);
      }

      const taskId = `task-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
      const task: AgentTask = {
        id: taskId,
        agentId,
        action,
        input,
        status: 'pending',
        startTime: Date.now()
      };

      this.activeTasks.set(taskId, task);
      
      // Implementation would go here
      // This is a placeholder for actual execution logic
      
      return {
        taskId,
        status: 'pending'
      };
    } catch (error) {
      this.logger.error(`Failed to execute action ${action} for agent ${agentId}:`, error);
      throw error;
    }
  }

  private async updateTaskStatus(
    taskId: string,
    status: 'pending' | 'running' | 'completed' | 'failed',
    result?: any,
    error?: string
  ): Promise<void> {
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
      } else {
        task.error = error;
      }
    }
  }
  
  private async handleAssistanceRequest(
    senderId: string,
    payload: { task: string, context: any }
  ): Promise<void> {
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
      const result = await this.executeAgentAction(
        selectedAgent.id,
        'assist',
        {
          task: payload.task,
          context: payload.context,
          requesterId: senderId
        }
      );
      
      // Send the result back to the requester
      await this.agentClient.sendMessage(senderId, 'assistanceResponse', {
        success: true,
        agentId: selectedAgent.id,
        result
      });
    } catch (error) {
      await this.agentClient.sendMessage(senderId, 'assistanceResponse', {
        success: false,
        agentId: selectedAgent.id,
        error: error.message
      });
    }
  }
  
  private async showAgentsMenu() {
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
  
  private async showAgentActions(agent: LLMAgent) {
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
    
    if (!selected) return;
    
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
  
  private async executeCodeGeneration(agent: LLMAgent) {
    const prompt = await vscode.window.showInputBox({
      prompt: 'What code would you like to generate?',
      placeHolder: 'e.g., A function to calculate Fibonacci numbers'
    });
    
    if (!prompt) return;
    
    try {
      vscode.window.withProgress({
        location: vscode.ProgressLocation.Notification,
        title: `${agent.name} is generating code...`,
        cancellable: false
      }, async (_progress) => {
        const result = await this.executeAgentAction(agent.id, 'generateCode', { prompt });
        
        // Create a new document with the result
        const document = await vscode.workspace.openTextDocument({
          content: typeof result === 'string' ? result : JSON.stringify(result, null, 2),
          language: 'javascript' // Default to JavaScript, could be improved
        });
        
        await vscode.window.showTextDocument(document);
      });
    } catch (error) {
      vscode.window.showErrorMessage(`Error: ${getErrorMessage(error)}`);
    }
  }
  
  private async executeCodeExplanation(agent: LLMAgent) {
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
      }, async (_progress) => {
        const result = await this.executeAgentAction(agent.id, 'explainCode', { 
          code: text,
          language: editor.document.languageId
        });
        
        // Show the explanation in a webview
        const panel = vscode.window.createWebviewPanel(
          'codeExplanation',
          'Code Explanation',
          vscode.ViewColumn.Beside,
          {}
        );
        
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
    } catch (error) {
      vscode.window.showErrorMessage(`Error: ${getErrorMessage(error)}`);
    }
  }
  
  private async executeCodeRefactoring(agent: LLMAgent) {
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
    
    if (!instructions) return;
    
    try {
      vscode.window.withProgress({
        location: vscode.ProgressLocation.Notification,
        title: `${agent.name} is refactoring code...`,
        cancellable: false
      }, async (_progress) => {
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
              const fullRange = new vscode.Range(
                0, 0,
                editor.document.lineCount - 1,
                editor.document.lineAt(editor.document.lineCount - 1).range.end.character
              );
              editBuilder.replace(fullRange, result);
            } else {
              // Replace only the selection
              editBuilder.replace(selection, result);
            }
          });
        }
      });
    } catch (error) {
      vscode.window.showErrorMessage(`Error: ${getErrorMessage(error)}`);
    }
  }
  
  private async executeAskQuestion(agent: LLMAgent) {
    const question = await vscode.window.showInputBox({
      prompt: 'What would you like to ask?',
      placeHolder: 'e.g., How do I implement X? What is the difference between Y and Z?'
    });
    
    if (!question) return;
    
    // Get current file context
    const editor = vscode.window.activeTextEditor;
    const fileContext = editor ? editor.document.getText() : undefined;
    
    try {
      vscode.window.withProgress({
        location: vscode.ProgressLocation.Notification,
        title: `${agent.name} is thinking...`,
        cancellable: false
      }, async (_progress) => {
        const result = await this.executeAgentAction(agent.id, 'askQuestion', { 
          question,
          fileContext,
          language: editor?.document.languageId
        });
        
        // Show the answer in a webview
        const panel = vscode.window.createWebviewPanel(
          'agentAnswer',
          'AI Answer',
          vscode.ViewColumn.Beside,
          {}
        );
        
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
    } catch (error) {
      vscode.window.showErrorMessage(`Error: ${getErrorMessage(error)}`);
    }
  }
  
  private async unregisterAgent(agentId: string) {
    if (this.registeredAgents.has(agentId)) {
      this.registeredAgents.delete(agentId);
      
      // Update storage
      await this.context.globalState.update(
        'llm-orchestrator.agents', 
        Array.from(this.registeredAgents.values())
      );
      
      this.statusBarItem.text = `$(hubot) AI Agents (${this.registeredAgents.size})`;
      vscode.window.showInformationMessage(`Agent unregistered successfully.`);
    }
  }
  
  private async startCollaborativeTask() {
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
    
    if (!selectedTask) return;
    
    // Implementation for collaborative tasks would be added here
    // This would involve coordinating multiple agents to work together
    vscode.window.showInformationMessage(`Collaborative task ${selectedTask.label} started.`);
    
    // In a real implementation, we'd orchestrate a workflow between multiple agents
  }
  
  private log(message: string) {
    const timestamp = new Date().toISOString();
    this.outputChannel.appendLine(`[${timestamp}] ${message}`);
    this.logger.info(message);
  }

  // Dispose of resources
  dispose() {
    this.logger.info('Disposing LLM Orchestrator');
    this.statusBarItem.dispose();
    this.outputChannel.dispose();
  }

  // Execute a workflow step with proper error handling
  private async executeStep(
    step: { id: string; action: string; input: any },
    _context: any,
    _results: Map<string, any>
  ): Promise<{ success: boolean; error?: string; result?: any }> {
    try {
      this.logger.info(`Executing step ${step.id}`);
      
      // Implementation would go here
      // This is a placeholder for the actual step execution logic
      
      return {
        success: true,
        result: {}
      };
    } catch (error) {
      this.logger.error(`Error executing step ${step.id}:`, error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error during step execution'
      };
    }
  }
}

// Example React component for the Orchestrator UI
export const OrchestratorUI: React.FC<{ orchestrator: LLMOrchestrator }> = ({ _orchestrator }) => {
  // Component state and logic would go here
  return <div>LLM Orchestrator UI</div>;
};

// Export factory function
export function createLLMOrchestrator(context: vscode.ExtensionContext): LLMOrchestrator {
  return new LLMOrchestrator(context);
}
