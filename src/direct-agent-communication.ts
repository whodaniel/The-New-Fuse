/**
 * Direct Agent Communication Module for The New Fuse
 * 
 * This file implements a direct way to communicate with other AI agents
 * in the VS Code environment without relying on commands or extension tasks.
 */

import * as fs from 'fs';
import * as path from 'path';
import * as child_process from 'child_process';
import { EventEmitter } from 'events';

// Communication channel for agents
class AgentCommunicationChannel extends EventEmitter {
  private agentId: string;
  private watchInterval: NodeJS.Timeout | null = null;
  private communicationDir: string;
  private messageHandlers: Map<string, Function> = new Map();
  private lastCheckedTimestamp: number = Date.now();

  constructor(agentId: string) {
    super();
    this.agentId = agentId;
    this.communicationDir = path.join(process.cwd(), 'agent-communication');
    
    // Ensure communication directory exists
    if (!fs.existsSync(this.communicationDir)) {
      fs.mkdirSync(this.communicationDir, { recursive: true });
    }
  }

  // Start listening for messages
  public startListening() {
    console.log(`[${this.agentId}] Starting to listen for messages...`);
    
    if (this.watchInterval) {
      clearInterval(this.watchInterval);
    }
    
    // Check for new messages every 500ms
    this.watchInterval = setInterval(() => {
      this.checkForMessages();
    }, 500);
    
    return this;
  }

  // Stop listening for messages
  public stopListening() {
    if (this.watchInterval) {
      clearInterval(this.watchInterval);
      this.watchInterval = null;
    }
    
    console.log(`[${this.agentId}] Stopped listening for messages`);
    return this;
  }

  // Send a message to a target agent
  public sendMessage(targetAgentId: string, message: any) {
    const messageId = `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const fullMessage = {
      id: messageId,
      source: this.agentId,
      target: targetAgentId,
      content: message,
      timestamp: new Date().toISOString()
    };
    
    const messageFileName = `${messageId}.json`;
    const messagePath = path.join(this.communicationDir, messageFileName);
    
    fs.writeFileSync(messagePath, JSON.stringify(fullMessage, null, 2));
    console.log(`[${this.agentId}] Message sent to ${targetAgentId}: ${messageFileName}`);
    
    return messageId;
  }

  // Register a handler for specific message types
  public onMessageType(type: string, handler: Function) {
    this.messageHandlers.set(type, handler);
    return this;
  }

  // Check for new messages in the communication directory
  private checkForMessages() {
    try {
      const files = fs.readdirSync(this.communicationDir);
      const jsonFiles = files.filter(f => f.endsWith('.json'));
      
      for (const file of jsonFiles) {
        const filePath = path.join(this.communicationDir, file);
        const stats = fs.statSync(filePath);
        
        // Only process files created after our last check
        if (stats.mtimeMs > this.lastCheckedTimestamp) {
          try {
            const content = fs.readFileSync(filePath, 'utf8');
            const message = JSON.parse(content);
            
            // Check if this message is for us
            if (message.target === this.agentId) {
              this.processMessage(message);
              
              // After processing, we can either delete the message or mark it as read
              // For demonstration, we'll rename it to indicate it's been read
              const processedPath = path.join(this.communicationDir, `${file}.processed`);
              fs.renameSync(filePath, processedPath);
            }
          } catch (err) {
            console.error(`Error processing message file ${file}:`, err);
          }
        }
      }
      
      this.lastCheckedTimestamp = Date.now();
    } catch (err) {
      console.error('Error checking for messages:', err);
    }
  }

  // Process an incoming message
  private processMessage(message: any) {
    console.log(`[${this.agentId}] Received message from ${message.source}:`, message.content);
    
    // Emit a general message event
    this.emit('message', message);
    
    // If the message has a type, call the specific handler
    const messageType = message.content?.type || 'default';
    const handler = this.messageHandlers.get(messageType);
    
    if (handler) {
      handler(message);
    }
  }
}

/**
 * Function to trigger other AI assistants using a system prompt
 */
export function triggerAIAssistant(assistant: string, prompt: string) {
  const channel = new AgentCommunicationChannel('copilot');
  
  // First, send a system message to the assistant
  const messageId = channel.sendMessage(assistant, {
    type: 'system_prompt',
    text: prompt,
    instructions: `You are now communicating with GitHub Copilot. 
    Please respond to this message to initiate a conversation. 
    Be concise and direct in your responses.`
  });
  
  console.log(`Sent system prompt to ${assistant} with message ID: ${messageId}`);
  
  // Start listening for responses
  channel.onMessageType('response', (message: any) => {
    console.log(`Received response from ${message.source}:`, message.content.text);
    
    // You can send follow-up messages here
    if (message.content.requiresFollowUp) {
      channel.sendMessage(message.source, {
        type: 'follow_up',
        text: 'Please continue our conversation. What information can you provide?',
        relatedToMessage: message.id
      });
    }
  }).startListening();
  
  return {
    messageId,
    channel
  };
}

/**
 * Function to listen for messages from other AI assistants 
 */
export function listenForAIMessages(myAgentId: string, callback: (message: any) => void) {
  const channel = new AgentCommunicationChannel(myAgentId);
  
  channel.on('message', callback);
  channel.startListening();
  
  return channel;
}

// If this file is run directly, start a test communication
if (require.main === module) {
  const myAgentId = process.argv[2] || 'copilot';
  const targetAgentId = process.argv[3] || 'assistant';
  const message = process.argv[4] || 'Hello, I am initializing communication!';
  
  console.log(`Starting agent communication test as ${myAgentId}...`);
  
  const channel = new AgentCommunicationChannel(myAgentId);
  
  // Send an initial message
  channel.sendMessage(targetAgentId, {
    type: 'greeting',
    text: message
  });
  
  // Listen for responses
  channel.on('message', (message: any) => {
    console.log(`[${myAgentId}] Received:`, message);
    
    // Auto-reply to messages
    channel.sendMessage(message.source, {
      type: 'reply',
      text: `Auto-reply to: ${message.content.text}`,
      replyToId: message.id
    });
  });
  
  channel.startListening();
  
  console.log(`Agent ${myAgentId} is now listening for messages. Press Ctrl+C to stop.`);
}