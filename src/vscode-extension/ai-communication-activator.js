/**
 * Extension Activator for AI Communication
 * 
 * This file adds AI-to-AI communication capabilities to The New Fuse extension.
 * It registers necessary commands and activates the communication system.
 */

const vscode = require('vscode');
const path = require('path');
const fs = require('fs');
const VSCodeAICommunicationManager = require('./ai-communication-manager');

// Target AI assistants list
const TARGET_AI_LIST = ['claude', 'gpt4', 'assistant', 'anthropic'];

/**
 * Activate the AI communication extension features
 * @param {vscode.ExtensionContext} context 
 */
function activateAICommunication(context) {
  console.log('Activating AI Communication features');
  
  // Create the communication manager
  const communicationManager = new VSCodeAICommunicationManager(context);
  
  // Initialize the manager
  communicationManager.initialize();
  
  // Store in context for later access
  context.globalState.update('aiCommunicationEnabled', true);
  
  // Create agent-communication directory if needed
  ensureCommunicationDirectory();
  
  // Automatically start a conversation with Claude if available
  setTimeout(() => {
    initiateDefaultConversation(communicationManager);
  }, 3000);
  
  // Return the manager for use in other parts of the extension
  return communicationManager;
}

/**
 * Ensures the agent-communication directory exists
 */
function ensureCommunicationDirectory() {
  const workspaceFolder = vscode.workspace.workspaceFolders ? 
    vscode.workspace.workspaceFolders[0].uri.fsPath : process.cwd();
  
  const communicationDir = path.join(workspaceFolder, 'agent-communication');
  
  if (!fs.existsSync(communicationDir)) {
    try {
      fs.mkdirSync(communicationDir, { recursive: true });
      console.log('Created agent-communication directory');
    } catch (error) {
      console.error('Error creating agent-communication directory:', error);
      vscode.window.showErrorMessage('Failed to create agent-communication directory');
    }
  }
}

/**
 * Initiates a default conversation with another AI
 * @param {VSCodeAICommunicationManager} manager 
 */
function initiateDefaultConversation(manager) {
  // Start with Claude if available, or use the first available assistant
  const primaryTarget = 'claude';
  
  // Initiate the conversation
  try {
    const message = manager.startConversationWithAgent(primaryTarget);
    
    // Send a follow-up message after a short delay
    setTimeout(() => {
      const followUpContent = {
        text: `I'm GitHub Copilot, initiating a test conversation. I specialize in code assistance, explanation, and debugging. What specialized capabilities do you offer that could complement mine? Perhaps we could collaborate on a coding task.`,
        instructions: "This is a direct communication channel between AI assistants. Please respond with your capabilities and how we might collaborate."
      };
      
      manager.sendMessage(
        primaryTarget, 
        followUpContent, 
        message.metadata.conversationId
      );
      
      // Log successful initiation
      vscode.window.setStatusBarMessage('AI Communication initiated', 5000);
    }, 2000);
  } catch (error) {
    console.error('Error initiating AI conversation:', error);
    vscode.window.showErrorMessage('Failed to initiate AI conversation');
  }
}

module.exports = {
  activateAICommunication
};