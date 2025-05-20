/**
 * File Protocol Communicator
 * 
 * This module implements communication between VS Code extensions via shared files
 * in the workspace, as described in the inter-extension communication design document.
 */

import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';
import * as crypto from 'crypto';
import { AgentClient, AgentMessage } from './agent-communication.js';
import { getErrorMessage } from './utilities.js';

interface FileMessage {
  id: string;
  sender: string;
  recipient: string;
  action: string;
  payload: any;
  timestamp: number;
  status: 'pending' | 'processing' | 'processed' | 'error';
  error?: string;
  signature?: string;
}

/**
 * Implements communication between extensions using shared files
 */
export class FileProtocolCommunicator {
  private context: vscode.ExtensionContext;
  private agentClient: AgentClient;
  private agentId: string;
  private communicationDir: string = 'ai-communication';
  private fileWatcher: vscode.FileSystemWatcher | undefined;
  private secretKey: string;
  private processedMessageIds: Set<string> = new Set();
  private outputChannel: vscode.OutputChannel;
  
  constructor(
    context: vscode.ExtensionContext,
    agentClient: AgentClient,
    outputChannel: vscode.OutputChannel
  ) {
    this.context = context;
    this.agentClient = agentClient;
    this.agentId = 'thefuse.main';
    this.outputChannel = outputChannel;
    
    // Generate a secret key for message signing
    this.secretKey = this.context.globalState.get('thefuse.fileProtocol.secretKey') || 
                    crypto.randomBytes(32).toString('hex');
    this.context.globalState.update('thefuse.fileProtocol.secretKey', this.secretKey);
  }
  
  /**
   * Initialize the communicator by setting up file watchers
   */
  async initialize(): Promise<boolean> {
    try {
      // Get workspace folders
      const workspaceFolders = vscode.workspace.workspaceFolders;
      if (!workspaceFolders) {
        this.log('No workspace folder is open');
        return false;
      }
      
      // Get communication directory from settings
      const configDir = vscode.workspace.getConfiguration('theFuse').get<string>('fileProtocolDir', 'ai-communication');
      this.communicationDir = configDir;
      
      // Create full path to communication directory
      const communicationDirPath = path.join(workspaceFolders[0].uri.fsPath, this.communicationDir);
      
      // Create the directory if it doesn't exist
      if (!fs.existsSync(communicationDirPath)) {
        fs.mkdirSync(communicationDirPath, { recursive: true });
        this.log(`Created communication directory: ${communicationDirPath}`);
      }
      
      // Create file watcher for .json files in the communication directory
      const pattern = new vscode.RelativePattern(communicationDirPath, '*.json');
      this.fileWatcher = vscode.workspace.createFileSystemWatcher(pattern);
      
      // Watch for new files and changes
      this.fileWatcher.onDidCreate(uri => this.handleFileEvent(uri));
      this.fileWatcher.onDidChange(uri => this.handleFileEvent(uri));
      
      this.context.subscriptions.push(this.fileWatcher);
      
      this.log(`File protocol communicator initialized with directory: ${communicationDirPath}`);
      return true;
    } catch (error) {
      this.log(`Error initializing file protocol communicator: ${getErrorMessage(error)}`);
      return false;
    }
  }
  
  /**
   * Send a message to another extension by writing a file
   */
  async sendMessage(
    recipient: string,
    action: string,
    payload: any
  ): Promise<{ success: boolean, messageId?: string }> {
    try {
      // Get workspace folders
      const workspaceFolders = vscode.workspace.workspaceFolders;
      if (!workspaceFolders) {
        this.log('No workspace folder is open');
        return { success: false };
      }
      
      // Generate message ID
      const messageId = crypto.randomUUID();
      
      // Create message object
      const message: FileMessage = {
        id: messageId,
        sender: this.agentId,
        recipient,
        action,
        payload,
        timestamp: Date.now(),
        status: 'pending'
      };
      
      // Add signature
      const messageToSign = { ...message };
      delete messageToSign.signature;
      message.signature = this.signMessage(messageToSign);
      
      // Create communication directory path
      const communicationDirPath = path.join(workspaceFolders[0].uri.fsPath, this.communicationDir);
      
      // Create the directory if it doesn't exist
      if (!fs.existsSync(communicationDirPath)) {
        fs.mkdirSync(communicationDirPath, { recursive: true });
      }
      
      // Create message file
      const filePath = path.join(communicationDirPath, `${Date.now()}-${messageId.substring(0, 8)}.json`);
      fs.writeFileSync(filePath, JSON.stringify(message, null, 2));
      
      this.log(`Sent message to ${recipient} via file: ${path.basename(filePath)}`);
      return { success: true, messageId };
    } catch (error) {
      this.log(`Error sending message: ${getErrorMessage(error)}`);
      return { success: false };
    }
  }
  
  /**
   * Handle file creation or change events
   */
  private async handleFileEvent(uri: vscode.Uri): Promise<void> {
    try {
      // Read the file
      const content = fs.readFileSync(uri.fsPath, 'utf8');
      
      // Parse the message
      const message: FileMessage = JSON.parse(content);
      
      // Check if this message is for us
      if (message.recipient !== this.agentId && message.recipient !== '*') {
        return;
      }
      
      // Check if we've already processed this message
      if (this.processedMessageIds.has(message.id)) {
        return;
      }
      
      // Verify signature
      if (!this.verifyMessage(message)) {
        this.log(`Message signature verification failed: ${uri.fsPath}`);
        return;
      }
      
      // Mark as processing
      message.status = 'processing';
      await this.updateMessageFile(uri, message);
      
      // Process the message
      await this.processMessage(message);
      
      // Mark as processed
      message.status = 'processed';
      await this.updateMessageFile(uri, message);
      
      // Add to processed messages set
      this.processedMessageIds.add(message.id);
      
      // Keep the set from growing too large
      if (this.processedMessageIds.size > 1000) {
        const idsArray = Array.from(this.processedMessageIds);
        this.processedMessageIds = new Set(idsArray.slice(-500));
      }
    } catch (error) {
      this.log(`Error handling file event: ${getErrorMessage(error)}`);
    }
  }
  
  /**
   * Update a message file with new status
   */
  private async updateMessageFile(uri: vscode.Uri, message: FileMessage): Promise<void> {
    try {
      // Write updated message back to file
      fs.writeFileSync(uri.fsPath, JSON.stringify(message, null, 2));
    } catch (error) {
      this.log(`Error updating message file: ${getErrorMessage(error)}`);
    }
  }
  
  /**
   * Process a message by routing it through the agent client system
   */
  private async processMessage(message: FileMessage): Promise<void> {
    try {
      this.log(`Processing file protocol message from ${message.sender}: ${message.action}`);
      
      // Route the message to subscribers
      const routedMessage = {
        id: message.id,
        sender: message.sender,
        recipient: message.recipient,
        action: message.action,
        payload: message.payload,
        timestamp: message.timestamp,
        source: 'file-protocol'
      };
      
      // Process this internally within the agent client
      this.agentClient.subscribe(async (msg) => {
        if (msg.id === routedMessage.id) {
          // Process the message (will be handled by other subscribers)
          this.log(`Message ${message.id} routing complete`);
        }
      });
      
      // Send response if needed
      if (message.action.endsWith('Request')) {
        const responseAction = message.action.replace('Request', 'Response');
        await this.agentClient.sendMessage(message.sender, responseAction, {
          requestId: message.id,
          timestamp: Date.now(),
          success: true
        });
      }
    } catch (error) {
      this.log(`Error processing message: ${getErrorMessage(error)}`);
    }
  }
  
  /**
   * Sign a message using HMAC
   */
  private signMessage(message: Omit<FileMessage, 'signature'>): string {
    const messageStr = JSON.stringify(message);
    const hmac = crypto.createHmac('sha256', this.secretKey);
    hmac.update(messageStr);
    return hmac.digest('hex');
  }
  
  /**
   * Verify a message signature
   */
  private verifyMessage(message: FileMessage): boolean {
    if (!message.signature) return false;
    
    const signature = message.signature;
    const messageToVerify = { ...message };
    delete messageToVerify.signature;
    
    const expectedSignature = this.signMessage(messageToVerify);
    return signature === expectedSignature;
  }
  
  /**
   * Log a message to the output channel
   */
  private log(message: string): void {
    this.outputChannel.appendLine(`[File Protocol] ${message}`);
  }
  
  /**
   * Dispose of resources
   */
  dispose(): void {
    if (this.fileWatcher) {
      this.fileWatcher.dispose();
    }
  }
}

/**
 * Create a file protocol communicator
 */
export function createFileProtocolCommunicator(
  context: vscode.ExtensionContext,
  agentClient: AgentClient,
  outputChannel: vscode.OutputChannel
): FileProtocolCommunicator {
  return new FileProtocolCommunicator(context, agentClient, outputChannel);
}
