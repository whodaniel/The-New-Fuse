/**
 * VS Code Integration for AI Communication
 * 
 * This module connects our AI communication system with VS Code,
 * enabling monitoring and integration with The New Fuse extension.
 */

const vscode = require('vscode');
const path = require('path');
const { AICommunicationBroker, MessageType, MessageTemplates } = require('./ai-communication');
const { RelayService } = require('./services/relay-service');
const { Logger } = require('./core/logging');

class VSCodeAICommunicationManager {
  constructor(context) {
    this.context = context;
    this.broker = null;
    this.statusBarItem = null;
    this.outputChannel = null;
    this.monitoringEnabled = false;
    this.targetAgents = ['claude', 'gpt4', 'assistant', 'anthropic'];
    this.activeConversations = new Map();
    this.relayService = RelayService.getInstance();
    this.logger = Logger.getInstance();
  }

  initialize() {
    // Create output channel for logging
    this.outputChannel = vscode.window.createOutputChannel('AI Communication');
    
    // Create status bar item
    this.statusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, 100);
    this.statusBarItem.text = '$(comment-discussion) AI Communication';
    this.statusBarItem.tooltip = 'AI Assistant Communication';
    this.statusBarItem.command = 'thefuse.ai.showCommunicationPanel';
    this.context.subscriptions.push(this.statusBarItem);
    
    // Create the communication broker
    const workspaceFolder = vscode.workspace.workspaceFolders ? 
      vscode.workspace.workspaceFolders[0].uri.fsPath : process.cwd();
    
    this.broker = new AICommunicationBroker({
      agentId: 'copilot',
      agentName: 'GitHub Copilot',
      communicationDir: path.join(workspaceFolder, 'agent-communication'),
      debug: true
    });

    // Register command handlers
    this.registerCommands();

    // Register Chrome extension message handler
    this.relayService.registerHandler('chrome-extension', async (message) => {
      await this.handleChromeMessage(message);
    });

    // Initialize the broker
    this.broker.initialize().then(() => {
      this.statusBarItem.show();
      this.logger.info('AI Communication Manager initialized');
    }).catch(error => {
      this.logger.error('Failed to initialize AI Communication Manager:', error);
    });
  }

  registerCommands() {
    // Register all communication-related commands
    this.context.subscriptions.push(
      vscode.commands.registerCommand('thefuse.ai.showCommunicationPanel', () => {
        this.showCommunicationPanel();
      }),
      vscode.commands.registerCommand('thefuse.ai.startConversation', () => {
        this.startConversationCommand();
      }),
      vscode.commands.registerCommand('thefuse.ai.sendMessage', () => {
        this.sendMessageCommand();
      }),
      vscode.commands.registerCommand('thefuse.ai.clearMessages', () => {
        this.clearMessagesCommand();
      }),
      vscode.commands.registerCommand('thefuse.insertCode', (code) => {
        this.insertCodeIntoEditor(code);
      }),
      vscode.commands.registerCommand('thefuse.processAIRequest', (request) => {
        this.processAIRequest(request);
      })
    );
  }

  showCommunicationPanel() {
    const { CommunicationPanel } = require('./communication-panel');
    CommunicationPanel.createOrShow(this.context.extensionUri);
  }

  async startConversation(targetAgent) {
    const conversationId = `conv_${Date.now()}`;
    this.activeConversations.set(conversationId, {
      targetAgent,
      messages: [],
      startTime: Date.now()
    });

    // Send initial message
    const message = {
      type: MessageType.INITIATION,
      conversationId,
      content: MessageTemplates.getInitiationMessage(targetAgent)
    };

    try {
      await this.broker.sendMessage(targetAgent, message);
      this.handleMessageSent(message);
      return message;
    } catch (error) {
      this.logger.error('Failed to start conversation:', error);
      throw error;
    }
  }

  async startConversationWithAgent(targetAgent) {
    return this.startConversation(targetAgent);
  }

  async sendMessage(targetAgent, content, conversationId) {
    const message = {
      type: MessageType.MESSAGE,
      conversationId,
      content
    };

    try {
      await this.broker.sendMessage(targetAgent, message);
      this.handleMessageSent(message);
      return message;
    } catch (error) {
      this.logger.error('Failed to send message:', error);
      throw error;
    }
  }

  async handleChromeMessage(message) {
    switch (message.type) {
      case 'CODE_INPUT':
        await this.insertCodeIntoEditor(message.data.code);
        break;
      case 'AI_REQUEST':
        await this.processAIRequest(message.data);
        break;
      case 'RELAY_TO_AGENT':
        await this.relayToAgent(message.data);
        break;
    }
  }

  async insertCodeIntoEditor(code) {
    const editor = vscode.window.activeTextEditor;
    if (editor) {
      await editor.edit(editBuilder => {
        const position = editor.selection.active;
        editBuilder.insert(position, code);
      });
    }
  }

  async processAIRequest(request) {
    try {
      const result = await this.broker.processRequest(request);
      this.relayService.sendMessage('chrome-extension', {
        command: 'AI_RESPONSE',
        data: result
      });
    } catch (error) {
      this.logger.error('Failed to process AI request:', error);
    }
  }

  async relayToAgent(data) {
    try {
      const { targetAgent, content } = data;
      await this.sendMessage(targetAgent, content, data.conversationId);
    } catch (error) {
      this.logger.error('Failed to relay message to agent:', error);
    }
  }

  handleMessageSent(message) {
    this.outputChannel.appendLine(`[Sent to ${message.targetAgent}] ${JSON.stringify(message.content)}`);
    const conversation = this.activeConversations.get(message.conversationId);
    if (conversation) {
      conversation.messages.push({
        direction: 'outgoing',
        ...message
      });
    }
  }

  handleMessageReceived(message) {
    this.outputChannel.appendLine(`[Received from ${message.sourceAgent}] ${JSON.stringify(message.content)}`);
    const conversation = this.activeConversations.get(message.conversationId);
    if (conversation) {
      conversation.messages.push({
        direction: 'incoming',
        ...message
      });
    }
  }

  handleMessageTimeout(message) {
    this.outputChannel.appendLine(`[Timeout] Message to ${message.targetAgent} timed out`);
  }

  async startConversationCommand() {
    const targetAgent = await vscode.window.showQuickPick(this.targetAgents, {
      placeHolder: 'Select an AI assistant to communicate with'
    });

    if (targetAgent) {
      try {
        await this.startConversation(targetAgent);
        vscode.window.showInformationMessage(`Started conversation with ${targetAgent}`);
      } catch (error) {
        vscode.window.showErrorMessage(`Failed to start conversation: ${error.message}`);
      }
    }
  }

  async sendMessageCommand() {
    const message = await vscode.window.showInputBox({
      prompt: 'Enter your message'
    });

    if (message) {
      const conversations = Array.from(this.activeConversations.entries());
      const quickPickItems = conversations.map(([id, conv]) => ({
        label: `${conv.targetAgent} (${id})`,
        conversationId: id,
        targetAgent: conv.targetAgent
      }));

      const selected = await vscode.window.showQuickPick(quickPickItems, {
        placeHolder: 'Select conversation'
      });

      if (selected) {
        try {
          await this.sendMessage(selected.targetAgent, { text: message }, selected.conversationId);
          vscode.window.showInformationMessage('Message sent successfully');
        } catch (error) {
          vscode.window.showErrorMessage(`Failed to send message: ${error.message}`);
        }
      }
    }
  }

  clearMessagesCommand() {
    this.outputChannel.clear();
    this.activeConversations.clear();
    vscode.window.showInformationMessage('Cleared all messages and conversations');
  }
}

module.exports = VSCodeAICommunicationManager;