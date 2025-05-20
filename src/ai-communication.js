/**
 * Enhanced Inter-AI Communication Module for The New Fuse
 * 
 * This module implements a robust communication system between 
 * different AI assistants within VS Code, with monitoring support.
 */

import fs from 'fs';
import path from 'path';
import { EventEmitter } from 'events';

// Define the communication protocol version
const PROTOCOL_VERSION = 'a2a-v1.0';

// Define message types
export const MessageType = {
  INITIATION: 'initiation',
  QUERY: 'query',
  RESPONSE: 'response',
  TASK_REQUEST: 'task_request',
  TASK_RESULT: 'task_result',
  NOTIFICATION: 'notification',
  ERROR: 'error',
  HEARTBEAT: 'heartbeat'
};

// Standard message format following A2A protocol principles
export class AIMessage {
  constructor(source, target, content, type = MessageType.QUERY, conversationId = null) {
    this.id = `msg_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    this.timestamp = new Date().toISOString();
    this.source = source;
    this.target = target;
    this.content = content;
    this.metadata = {
      type: type,
      conversationId: conversationId || `conv_${Date.now()}`,
      protocol: PROTOCOL_VERSION,
      capabilities: ['code_generation', 'natural_language', 'tool_use'],
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
    const message = new AIMessage(
      json.source,
      json.target,
      json.content,
      json.metadata?.type || MessageType.QUERY,
      json.metadata?.conversationId
    );
    message.id = json.id;
    message.timestamp = json.timestamp;
    message.metadata = json.metadata || {};
    return message;
  }
}

// Communication statistics for monitoring
export class CommunicationStats {
  constructor() {
    this.messagesSent = 0;
    this.messagesReceived = 0;
    this.errorCount = 0;
    this.avgResponseTime = 0;
    this.totalResponseTime = 0;
    this.responseCount = 0;
    this.messagesByType = {};
    this.lastActivity = null;
    this.activeConversations = new Set();
    
    // Initialize message counts by type
    Object.values(MessageType).forEach(type => {
      this.messagesByType[type] = 0;
    });
  }

  recordMessageSent(message) {
    this.messagesSent++;
    this.lastActivity = new Date();
    if (message.metadata?.type) {
      this.messagesByType[message.metadata.type] = 
        (this.messagesByType[message.metadata.type] || 0) + 1;
    }
    if (message.metadata?.conversationId) {
      this.activeConversations.add(message.metadata.conversationId);
    }
  }

  recordMessageReceived(message) {
    this.messagesReceived++;
    this.lastActivity = new Date();
    if (message.metadata?.type) {
      this.messagesByType[message.metadata.type] = 
        (this.messagesByType[message.metadata.type] || 0) + 1;
    }
    if (message.metadata?.conversationId) {
      this.activeConversations.add(message.metadata.conversationId);
    }
  }

  recordResponseTime(timeMs) {
    this.totalResponseTime += timeMs;
    this.responseCount++;
    this.avgResponseTime = this.totalResponseTime / this.responseCount;
  }

  recordError() {
    this.errorCount++;
  }

  getStats() {
    return {
      messagesSent: this.messagesSent,
      messagesReceived: this.messagesReceived,
      errorCount: this.errorCount,
      avgResponseTime: this.avgResponseTime,
      messagesByType: { ...this.messagesByType },
      lastActivity: this.lastActivity,
      activeConversations: Array.from(this.activeConversations)
    };
  }
}

// Communication broker for AI assistants
export class AICommunicationBroker extends EventEmitter {
  constructor(options = {}) {
    super();
    this.agentId = options.agentId || 'copilot';
    this.agentName = options.agentName || 'GitHub Copilot';
    this.communicationDir = options.communicationDir || path.join(process.cwd(), 'agent-communication');
    this.messageHandlers = new Map();
    this.watchInterval = null;
    this.lastCheckTime = Date.now();
    this.isListening = false;
    this.debug = options.debug || false;
    this.stats = new CommunicationStats();
    this.pendingResponses = new Map(); // Track messages waiting for response
    this.responseTimeoutMs = options.responseTimeoutMs || 60000; // Default 1 minute timeout
    
    // Ensure communication directory exists
    if (!fs.existsSync(this.communicationDir)) {
      fs.mkdirSync(this.communicationDir, { recursive: true });
    }
    
    // Register default message handlers
    this.registerDefaultHandlers();
  }

  // Register the default message handlers
  registerDefaultHandlers() {
    // Default handler for all messages
    this.onMessageType('default', this.defaultMessageHandler.bind(this));
    
    // Handler for heartbeat messages
    this.onMessageType(MessageType.HEARTBEAT, (message) => {
      // Auto-respond to heartbeats to keep the connection alive
      this.sendMessage(
        message.source,
        { status: 'active', timestamp: new Date().toISOString() },
        MessageType.HEARTBEAT,
        message.metadata?.conversationId
      );
    });
    
    // Handler for error messages
    this.onMessageType(MessageType.ERROR, (message) => {
      this.log('Received error message:', message.content);
      this.stats.recordError();
    });
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
      this.checkResponseTimeouts();
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
  sendMessage(target, content, type = MessageType.QUERY, conversationId = null) {
    try {
      // Create message object
      const message = new AIMessage(
        this.agentId,
        target,
        content,
        type,
        conversationId
      );
      
      // If this is a query or task request, track it for timeout monitoring
      if (type === MessageType.QUERY || type === MessageType.TASK_REQUEST) {
        this.pendingResponses.set(message.id, {
          message,
          sentAt: Date.now()
        });
      }
      
      // Save message to file
      const filePath = path.join(this.communicationDir, `${message.id}.json`);
      fs.writeFileSync(filePath, JSON.stringify(message.toJSON(), null, 2));
      
      // Update stats
      this.stats.recordMessageSent(message);
      
      this.log(`Message sent to ${target}:`, content);
      
      // Emit event for internal tracking
      this.emit('messageSent', message);
      
      return message;
    } catch (error) {
      this.log('Error sending message:', error);
      this.stats.recordError();
      throw error;
    }
  }

  // Send a response to a received message
  sendResponse(originalMessage, content) {
    return this.sendMessage(
      originalMessage.source,
      content,
      MessageType.RESPONSE,
      originalMessage.metadata?.conversationId
    );
  }

  // Send an error message to another agent
  sendErrorMessage(target, errorContent, conversationId = null) {
    return this.sendMessage(
      target,
      {
        error: true,
        message: errorContent.message || errorContent,
        timestamp: new Date().toISOString()
      },
      MessageType.ERROR,
      conversationId
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
              const message = AIMessage.fromJSON(messageData);
              this.processMessage(message);
              
              // Calculate response time if this is a response to our message
              if (message.metadata?.type === MessageType.RESPONSE) {
                const pendingMessage = this.pendingResponses.get(message.metadata?.inResponseTo);
                if (pendingMessage) {
                  const responseTime = Date.now() - pendingMessage.sentAt;
                  this.stats.recordResponseTime(responseTime);
                  this.pendingResponses.delete(message.metadata?.inResponseTo);
                }
              }
              
              // Mark as processed by renaming
              const processedPath = path.join(this.communicationDir, `${file}.processed`);
              fs.renameSync(filePath, processedPath);
            }
          } catch (err) {
            console.error(`Error processing message file ${file}:`, err);
            this.stats.recordError();
          }
        }
      });
      
      this.lastCheckTime = Date.now();
    } catch (err) {
      console.error('Error checking for messages:', err);
      this.stats.recordError();
    }
  }

  // Check for response timeouts
  checkResponseTimeouts() {
    const now = Date.now();
    
    this.pendingResponses.forEach((pendingMessage, messageId) => {
      const elapsed = now - pendingMessage.sentAt;
      
      // If the message has timed out
      if (elapsed > this.responseTimeoutMs) {
        this.log(`Message timeout: No response received for ${messageId} after ${elapsed}ms`);
        this.emit('messageTimeout', pendingMessage.message);
        this.stats.recordError();
        this.pendingResponses.delete(messageId);
      }
    });
  }

  // Process a received message
  processMessage(message) {
    this.log(`Received message from ${message.source}:`, message.content);
    
    // Update stats
    this.stats.recordMessageReceived(message);
    
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
        this.stats.recordError();
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
      this.stats.recordError();
    }
  }

  // Get communication statistics
  getStats() {
    return this.stats.getStats();
  }

  // Send heartbeat to check if another agent is active
  sendHeartbeat(targetAgentId, conversationId = null) {
    return this.sendMessage(
      targetAgentId,
      { 
        ping: true,
        timestamp: new Date().toISOString() 
      },
      MessageType.HEARTBEAT,
      conversationId
    );
  }

  // Start a new conversation with another agent
  startConversation(targetAgentId, initialMessage) {
    const conversationId = `conv_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    
    // Create the initial message content if not provided
    const content = initialMessage || {
      text: `Hello, I am ${this.agentName}. I'm initiating a conversation for AI-to-AI communication. What capabilities do you have?`,
      instructions: "You are now in direct communication with another AI assistant. Please respond to continue the conversation.",
      capabilities: [
        "code_generation", 
        "natural_language", 
        "debugging",
        "explanation"
      ]
    };
    
    // Send the initiation message
    return this.sendMessage(
      targetAgentId,
      content,
      MessageType.INITIATION,
      conversationId
    );
  }

  // Utility method for logging
  log(...args) {
    if (this.debug) {
      console.log(`[${this.agentId}]`, ...args);
    }
  }
}

// Create specialized message content for different purposes
export const MessageTemplates = {
  // Initial contact message
  initiation: (agentName) => ({
    text: `Hello, I am ${agentName}, initiating an AI-to-AI communication channel. I'm reaching out to collaborate on tasks within this VS Code environment.`,
    instructions: "You are now in direct communication with another AI assistant. Please respond to continue the conversation.",
    capabilities: [
      "code_generation", 
      "natural_language_understanding",
      "debugging",
      "explanation",
      "tool_use"
    ]
  }),
  
  // Code-specific task request
  codeTask: (task, language, requirements) => ({
    text: `I need assistance with a coding task: ${task}`,
    code_language: language,
    requirements: requirements,
    task_type: "code_generation"
  }),
  
  // Explanation request
  explanationRequest: (code, question) => ({
    text: `Can you explain this code: ${question}`,
    code: code,
    task_type: "explanation"
  }),
  
  // Debugging request
  debuggingRequest: (code, error) => ({
    text: `I need help debugging this code.`,
    code: code,
    error: error,
    task_type: "debugging"
  }),
  
  // General query
  query: (question) => ({
    text: question,
    task_type: "query"
  })
};
