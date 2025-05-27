import * as vscode from 'vscode';
import { AgentClient } from './agent-communication.js';
import { LMAPIBridge } from './lm-api-bridge.js';

/**
 * Interface for an AI agent registration
 */
export interface AIAgentRegistration {
  id: string;
  name: string;
  capabilities: string[];
  version: string;
  provider?: string;
  apiType?: string;
  lastSeen: number;
  active: boolean;
}

/**
 * Interface for a communication log entry
 */
export interface CommunicationLogEntry {
  timestamp: number;
  sender: string;
  recipient: string;
  action: string;
  direction: 'outgoing' | 'incoming';
  successful: boolean;
  error?: string;
}

/**
 * Central hub for coordinating AI agent communication
 */
export class InterAIHub {
  private context: vscode.ExtensionContext;
  private agentClient: AgentClient;
  private lmBridge: LMAPIBridge;
  private outputChannel: vscode.OutputChannel;
  private statusBarItem: vscode.StatusBarItem;
  private communicationLog: CommunicationLogEntry[] = [];
  private agentStatusListeners: ((agents: AIAgentRegistration[]) => void)[] = [];

  constructor(context: vscode.ExtensionContext, agentClient: AgentClient, lmBridge: LMAPIBridge) {
    this.context = context;
    this.agentClient = agentClient;
    this.lmBridge = lmBridge;
    this.outputChannel = vscode.window.createOutputChannel('Inter-AI Hub');
    
    // Status bar item to show connected agents
    this.statusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, 10);
    this.statusBarItem.text = "$(plug) AI Agents: Initializing...";
    this.statusBarItem.tooltip = "Click to view connected AI agents";
    this.statusBarItem.command = 'thefuse.showConnectedAgents';
    this.statusBarItem.show();
    
    // Register commands
    this.registerCommands();
    
    // Start monitoring for agent updates
    this.startAgentMonitoring();
    
    // Subscribe to message events
    this.subscribeToMessages();
  }
  
  /**
   * Register commands related to the Inter-AI Hub
   */
  private registerCommands() {
    // Command to show connected agents
    this.context.subscriptions.push(
      vscode.commands.registerCommand('thefuse.showConnectedAgents', () => {
        this.showConnectedAgents();
      })
    );
    
    // Command to view communication log
    this.context.subscriptions.push(
      vscode.commands.registerCommand('thefuse.viewCommunicationLog', () => {
        this.showCommunicationLog();
      })
    );
    
    // Command to test connection with an agent
    this.context.subscriptions.push(
      vscode.commands.registerCommand('thefuse.testAgentConnection', async (agentId?: string) => {
        return this.testAgentConnection(agentId);
      })
    );
    
    // Command to send a custom message
    this.context.subscriptions.push(
      vscode.commands.registerCommand('thefuse.sendCustomMessage', async (recipient?: string, action?: string, payload?: any) => {
        return this.sendCustomMessage(recipient, action, payload);
      })
    );
  }
  
  /**
   * Start monitoring for agent updates
   */
  private startAgentMonitoring() {
    // Check agents every 30 seconds
    setInterval(() => this.updateAgentStatus(), 30000);
    
    // Do an initial update
    this.updateAgentStatus();
  }
  
  /**
   * Subscribe to message events
   */
  private subscribeToMessages() {
    this.agentClient.subscribe(async (message: any) => {
      // Log the message
      this.logCommunication({
        timestamp: Date.now(),
        sender: message.sender,
        recipient: message.recipient,
        action: message.action,
        direction: 'incoming',
        successful: true
      });
      
      // Process the message
      await this.processIncomingMessage(message);
    });
  }
  
  /**
   * Process an incoming message
   */
  private async processIncomingMessage(message: any) {
    // Handle ping/pong messages
    if (message.action === 'ping') {
      await this.agentClient.sendMessage(message.sender, 'pong', {
        requestId: message.id,
        timestamp: Date.now()
      });
    }
    
    // Handle capability requests
    if (message.action === 'getCapabilities') {
      await this.agentClient.sendMessage(message.sender, 'capabilities', {
        requestId: message.id,
        capabilities: ['inter-ai-communication', 'orchestration', 'messaging']
      });
    }
  }
  
  /**
   * Update agent status
   */
  private async updateAgentStatus() {
    try {
      // Get registered agents
      const agents = await this.agentClient.getRegisteredAgents();
      
      // Update status bar with count
      const activeAgents = agents.filter((agent: AIAgentRegistration) => agent.active !== false);
      this.statusBarItem.text = `$(plug) AI Agents: ${activeAgents.length}`;
      
      // Notify listeners
      this.notifyAgentStatusListeners(agents);
      
      this.log(`Updated agent status. ${activeAgents.length} active agents.`);
    } catch (error: any) {
      this.log(`Error updating agent status: ${error.message}`);
    }
  }
  
  /**
   * Show connected agents in a quick pick
   */
  private async showConnectedAgents() {
    try {
      const agents = await this.agentClient.getRegisteredAgents();
      
      // Check if we have any agents
      if (!agents || agents.length === 0) {
        vscode.window.showInformationMessage('No AI agents connected. Try discovering agents first.');
        return;
      }
      
      // Create quick pick items
      const items = (agents as AIAgentRegistration[]).map((agent: AIAgentRegistration) => ({
        label: agent.name || agent.id,
        description: agent.capabilities ? agent.capabilities.join(', ') : 'No capabilities',
        detail: `ID: ${agent.id} | Version: ${agent.version || 'unknown'} | Active: ${agent.active !== false ? 'Yes' : 'No'}`,
        agent
      }));
      
      // Show quick pick
      const selected = await vscode.window.showQuickPick(items as any, {
        placeHolder: 'Select an AI agent to interact with',
        matchOnDescription: true,
        matchOnDetail: true
      });
      
      if (selected) {
        await this.showAgentActions((selected as any).agent);
      }
    } catch (error: any) {
      this.log(`Error showing connected agents: ${error.message}`);
      vscode.window.showErrorMessage(`Error retrieving connected agents: ${error.message}`);
    }
  }
  
  /**
   * Show actions for a specific agent
   */
  private async showAgentActions(agent: AIAgentRegistration) {
    const actions = [
      {
        label: '$(zap) Test Connection',
        description: 'Ping the agent to test connection',
        action: 'test'
      },
      {
        label: '$(comment-discussion) Send Custom Message',
        description: 'Send a custom message to this agent',
        action: 'message'
      },
      {
        label: '$(info) View Capabilities',
        description: 'View detailed capabilities',
        action: 'capabilities'
      }
    ];
    
    const selected = await vscode.window.showQuickPick(actions, {
      placeHolder: `Select an action for ${agent.name || agent.id}`
    });
    
    if (!selected) return;
    
    switch (selected.action) {
      case 'test':
        await this.testAgentConnection(agent.id);
        break;
      case 'message':
        await this.sendCustomMessage(agent.id);
        break;
      case 'capabilities':
        await this.showAgentCapabilities(agent);
        break;
    }
  }
  
  /**
   * Test connection with an agent
   */
  private async testAgentConnection(agentId?: string) {
    try {
      // If no agent ID provided, ask for one
      if (!agentId) {
        const agents = await this.agentClient.getRegisteredAgents();
        const items = (agents as AIAgentRegistration[]).map((agent: AIAgentRegistration) => ({
          label: agent.name || agent.id,
          description: agent.id,
          id: agent.id
        }));
        
        const selected = await vscode.window.showQuickPick(items as any, {
          placeHolder: 'Select an agent to test connection with'
        });
        
        if (!selected) return false;
        
        agentId = (selected as any).id;
      }
      
      // Send a ping message
      this.log(`Testing connection with agent ${agentId}...`);
      const startTime = Date.now();
      
      // Log the outgoing message
      this.logCommunication({
        timestamp: startTime,
        sender: 'thefuse.main',
        recipient: agentId || '',
        action: 'ping',
        direction: 'outgoing',
        successful: true
      });
      
      // Send the ping message
      const success = await this.agentClient.sendMessage(agentId || '', 'ping', {
        timestamp: startTime
      });
      
      if (success) {
        const endTime = Date.now();
        const responseTime = endTime - startTime;
        vscode.window.showInformationMessage(`Successfully connected to ${agentId} (${responseTime}ms)`);
        return true;
      } else {
        vscode.window.showErrorMessage(`Failed to connect to ${agentId}`);
        return false;
      }
    } catch (error: any) {
      this.log(`Error testing connection: ${error.message}`);
      vscode.window.showErrorMessage(`Error testing connection: ${error.message}`);
      return false;
    }
  }
  
  /**
   * Send a custom message to an agent
   */
  private async sendCustomMessage(recipient?: string, action?: string, payload?: any) {
    try {
      // If no recipient provided, ask for one
      if (!recipient) {
        const agents = await this.agentClient.getRegisteredAgents();
        const items = (agents as AIAgentRegistration[]).map((agent: AIAgentRegistration) => ({
          label: agent.name || agent.id,
          description: agent.id,
          id: agent.id
        }));
        
        const selected = await vscode.window.showQuickPick(items as any, {
          placeHolder: 'Select a recipient agent'
        });
        
        if (!selected) return false;
        
        recipient = (selected as any).id;
      }
      
      // If no action provided, ask for one
      if (!action) {
        action = await vscode.window.showInputBox({
          prompt: 'Enter action name',
          placeHolder: 'e.g., generateText, analyzeCode'
        });
        
        if (!action) return false;
      }
      
      // If no payload provided, ask for one
      if (!payload) {
        const payloadInput = await vscode.window.showInputBox({
          prompt: 'Enter payload (JSON)',
          placeHolder: '{"prompt": "Hello world"}'
        });
        
        if (!payloadInput) return false;
        
        try {
          payload = JSON.parse(payloadInput);
        } catch (error) {
          vscode.window.showErrorMessage('Invalid JSON payload');
          return false;
        }
      }
      
      // Log the outgoing message
      this.logCommunication({
        timestamp: Date.now(),
        sender: 'thefuse.main',
        recipient: recipient as string,
        action,
        direction: 'outgoing',
        successful: true
      });
      
      // Send the message
      const success = await this.agentClient.sendMessage(recipient || '', action || '', payload);
      
      if (success) {
        vscode.window.showInformationMessage(`Message sent to ${recipient}`);
        return true;
      } else {
        vscode.window.showErrorMessage(`Failed to send message to ${recipient}`);
        return false;
      }
    } catch (error: any) {
      this.log(`Error sending custom message: ${error.message}`);
      vscode.window.showErrorMessage(`Error sending message: ${error.message}`);
      return false;
    }
  }
  
  /**
   * Show agent capabilities
   */
  private async showAgentCapabilities(agent: AIAgentRegistration) {
    const capabilitiesContent = `# ${agent.name || agent.id} Capabilities

ID: ${agent.id}
Version: ${agent.version || 'unknown'}
Provider: ${agent.provider || 'unknown'}
API Type: ${agent.apiType || 'unknown'}
Last Seen: ${new Date(agent.lastSeen).toLocaleString()}
Active: ${agent.active !== false ? 'Yes' : 'No'}

## Capabilities
${agent.capabilities ? agent.capabilities.map(cap => `- ${cap}`).join('\n') : 'No capabilities reported'}
`;
    
    // Show in editor
    const doc = await vscode.workspace.openTextDocument({
      content: capabilitiesContent,
      language: 'markdown'
    });
    await vscode.window.showTextDocument(doc);
  }
  
  /**
   * Show communication log
   */
  private async showCommunicationLog() {
    if (this.communicationLog.length === 0) {
      vscode.window.showInformationMessage('No communication logged yet');
      return;
    }
    
    // Format log entries
    const logContent = this.communicationLog.map(entry => {
      const timestamp = new Date(entry.timestamp).toLocaleString();
      const direction = entry.direction === 'outgoing' ? '→' : '←';
      const status = entry.successful ? '✓' : '✗';
      return `[${timestamp}] ${status} ${entry.sender} ${direction} ${entry.recipient}: ${entry.action}`;
    }).join('\n');
    
    // Show in editor
    const doc = await vscode.workspace.openTextDocument({
      content: logContent,
      language: 'plaintext'
    });
    await vscode.window.showTextDocument(doc);
  }
  
  /**
   * Log a communication entry
   */
  private logCommunication(entry: CommunicationLogEntry) {
    // Add to log
    this.communicationLog.push(entry);
    
    // Truncate log if it gets too long
    if (this.communicationLog.length > 1000) {
      this.communicationLog = this.communicationLog.slice(-500);
    }
    
    // Log to output channel
    const timestamp = new Date(entry.timestamp).toLocaleString();
    const direction = entry.direction === 'outgoing' ? '→' : '←';
    this.log(`${timestamp} ${entry.sender} ${direction} ${entry.recipient}: ${entry.action}`);
  }
  
  /**
   * Add a listener for agent status changes
   */
  public onAgentStatusChanged(listener: (agents: AIAgentRegistration[]) => void): vscode.Disposable {
    this.agentStatusListeners.push(listener);
    
    return {
      dispose: () => {
        const index = this.agentStatusListeners.indexOf(listener);
        if (index !== -1) {
          this.agentStatusListeners.splice(index, 1);
        }
      }
    };
  }
  
  /**
   * Notify listeners of agent status change
   */
  private notifyAgentStatusListeners(agents: AIAgentRegistration[]) {
    for (const listener of this.agentStatusListeners) {
      listener(agents);
    }
  }
  
  /**
   * Log a message to the output channel
   */
  private log(message: string) {
    this.outputChannel.appendLine(`[${new Date().toISOString()}] ${message}`);
  }
  
  /**
   * Dispose of resources
   */
  public dispose() {
    this.statusBarItem.dispose();
    this.outputChannel.dispose();
  }
}

// Export factory function
export function createInterAIHub(
  context: vscode.ExtensionContext,
  agentClient: AgentClient,
  lmBridge: any // Changed type to 'any' to be compatible with both implementations
): InterAIHub {
  return new InterAIHub(context, agentClient, lmBridge as LMAPIBridge);
}
