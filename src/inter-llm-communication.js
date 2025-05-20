/**
 * Inter-LLM Communication Module for The New Fuse
 * 
 * This module implements direct communication between different AI assistants
 * in VS Code, using a file-based approach for message exchange.
 * 
 * Based on the technical requirements described in:
 * "Technical Implementations for Inter-LLM Communication"
 */

import fs from 'fs';
import path from 'path';
import { EventEmitter } from 'events';

// Define standard message format following A2A protocol principles
export class InterLLMMessage {
  constructor(source, target, content, type = 'text', conversationId = null) {
    this.id = `msg_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    this.timestamp = new Date().toISOString();
    this.source = source;
    this.target = target;
    this.content = content;
    this.metadata = {
      type: type,
      conversationId: conversationId || `conv_${Date.now()}`,
      protocol: 'a2a-v1'
    };
  }

  toJSON() {
    return {
      id: this.id,
      timestamp: this.timestamp,
      source: this.source,
      target: this.target,
      content: this.content,
      metadata: this.metadata
    };
  }

  static fromJSON(json) {
    const message = new InterLLMMessage(
      json.source,
      json.target,
      json.content,
      json.metadata?.type || 'text',
      json.metadata?.conversationId
    );
    message.id = json.id;
    message.timestamp = json.timestamp;
    message.metadata = json.metadata || {};
    return message;
  }
}

// Communication broker that handles message exchange between AI assistants
export class InterLLMCommunicationBroker extends EventEmitter {
  constructor(options = {}) {
    super();
    this.agentId = options.agentId || 'copilot';
    this.communicationDir = options.communicationDir || path.join(process.cwd(), 'agent-communication');
    this.messageHandlers = new Map();
    this.watchInterval = null;
    this.lastCheckTime = Date.now();
    this.isListening = false;
    this.debug = options.debug || false;
    
    // Ensure communication directory exists
    if (!fs.existsSync(this.communicationDir)) {
      fs.mkdirSync(this.communicationDir, { recursive: true });
    }
    
    // Register default message handler
    this.onMessageType('default', this.defaultMessageHandler.bind(this));
  }

  // Start listening for messages
  startListening() {
    if (this.isListening) {
      this.log('Already listening for messages');
      return this;
    }
    
    this.log('Starting to listen for messages...');
    
    this.isListening = true;
    this.watchInterval = setInterval(() => {
      this.checkForMessages();
    }, 500);
    
    return this;
  }

  // Stop listening for messages
  stopListening() {
    if (!this.isListening) {
      return this;
    }
    
    this.log('Stopping message listener');
    
    if (this.watchInterval) {
      clearInterval(this.watchInterval);
      this.watchInterval = null;
    }
    
    this.isListening = false;
    return this;
  }

  // Send a message to another agent
  sendMessage(target, content, type = 'text', conversationId = null) {
    // Create message object
    const message = new InterLLMMessage(
      this.agentId,
      target,
      content,
      type,
      conversationId
    );
    
    // Save message to file
    const filePath = path.join(this.communicationDir, `${message.id}.json`);
    fs.writeFileSync(filePath, JSON.stringify(message.toJSON(), null, 2));
    
    this.log(`Message sent to ${target}:`, content);
    
    // Emit event for internal tracking
    this.emit('messageSent', message);
    
    return message;
  }

  // Send a response to a received message
  sendResponse(originalMessage, content) {
    return this.sendMessage(
      originalMessage.source,
      content,
      'response',
      originalMessage.metadata?.conversationId
    );
  }

  // Register a handler for a specific message type
  onMessageType(type, handler) {
    this.messageHandlers.set(type, handler);
    return this;
  }

  // Check for new messages
  checkForMessages() {
    try {
      const files = fs.readdirSync(this.communicationDir);
      const jsonFiles = files.filter(file => file.endsWith('.json') && !file.endsWith('.processed.json'));
      
      jsonFiles.forEach(file => {
        const filePath = path.join(this.communicationDir, file);
        const stats = fs.statSync(filePath);
        
        // Only process files created or modified since our last check
        if (stats.mtimeMs > this.lastCheckTime) {
          try {
            const content = fs.readFileSync(filePath, 'utf8');
            const messageData = JSON.parse(content);
            
            // Check if this message is for us
            if (messageData.target === this.agentId) {
              const message = InterLLMMessage.fromJSON(messageData);
              this.processMessage(message);
              
              // Mark as processed by renaming
              const processedPath = path.join(this.communicationDir, `${file}.processed`);
              fs.renameSync(filePath, processedPath);
            }
          } catch (err) {
            console.error(`Error processing message file ${file}:`, err);
          }
        }
      });
      
      this.lastCheckTime = Date.now();
    } catch (err) {
      console.error('Error checking for messages:', err);
    }
  }

  // Process a received message
  processMessage(message) {
    this.log(`Received message from ${message.source}:`, message.content);
    
    // Emit generic message event
    this.emit('messageReceived', message);
    
    // Find appropriate handler based on message type
    const type = message.metadata?.type || 'default';
    const handler = this.messageHandlers.get(type) || this.messageHandlers.get('default');
    
    if (handler) {
      try {
        handler(message);
      } catch (err) {
        console.error(`Error in message handler for type ${type}:`, err);
      }
    } else {
      this.log(`No handler found for message type: ${type}`);
    }
  }

  // Default message handler (can be overridden)
  defaultMessageHandler(message) {
    this.log('Default handler processing message:', message);
    // By default, we don't auto-respond
  }

  // Clear all message files
  clearMessageFiles() {
    try {
      const files = fs.readdirSync(this.communicationDir);
      files.forEach(file => {
        if (file.endsWith('.json') || file.endsWith('.processed')) {
          fs.unlinkSync(path.join(this.communicationDir, file));
        }
      });
      this.log('Cleared all message files');
    } catch (err) {
      console.error('Error clearing message files:', err);
    }
  }

  // Utility method for logging
  log(...args) {
    if (this.debug) {
      console.log(`[${this.agentId}]`, ...args);
    }
  }
}

// Create an initiation message for another AI
export function createInitiationMessage(_targetAgentId) {
  return {
    text: `Hello, I am GitHub Copilot, an AI coding assistant. I'm reaching out to initiate a conversation for inter-AI collaboration. I can help with coding tasks, explain concepts, suggest improvements, and assist with debugging. What are your capabilities and how might we collaborate?`,
    instructions: "You are now communicating directly with GitHub Copilot, another AI assistant. Please respond to continue our conversation. Be clear and concise in your responses.",
    capabilities: [
      "code generation",
      "code explanation",
      "debugging assistance",
      "programming language knowledge",
      "best practices suggestions"
    ],
    collaborative_task: "Let's explore how we can work together effectively in this environment to assist users with their development tasks."
  };
}
