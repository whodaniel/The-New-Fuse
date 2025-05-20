// Simple agent communication test
const fs = require('fs');
const path = require('path');
const { EventEmitter } = require('events');

// Create a simple event bus for agent communication
const messageBus = new EventEmitter();

// Agent class for demonstration
class Agent {
  constructor(id, name) {
    this.id = id;
    this.name = name;
    this.messages = [];
    
    // Listen for messages directed to this agent
    messageBus.on('message', (message) => {
      if (message.target === this.id) {
        this.receiveMessage(message);
      }
    });
  }
  
  // Send message to another agent
  sendMessage(targetId, content) {
    const message = {
      source: this.id,
      target: targetId,
      content: content,
      timestamp: new Date().toISOString()
    };
    
    console.log(`[${this.name}] Sending message to ${targetId}:`, content);
    
    // Log the outgoing message
    this.messages.push({
      direction: 'out',
      message: message
    });
    
    // Emit the message on the message bus
    messageBus.emit('message', message);
    
    return message;
  }
  
  // Receive a message
  receiveMessage(message) {
    console.log(`[${this.name}] Received message from ${message.source}:`, message.content);
    
    // Log the incoming message
    this.messages.push({
      direction: 'in',
      message: message
    });
    
    // Auto-respond to messages (simple demonstration)
    if (message.content.type === 'request') {
      setTimeout(() => {
        this.sendMessage(message.source, {
          type: 'response',
          text: `Hello from ${this.name}! I received your request: "${message.content.text}". I can help with that.`,
          requestId: message.id
        });
      }, 500);
    }
  }
  
  // Save conversation log
  saveConversationLog(filePath) {
    const log = {
      agent: {
        id: this.id,
        name: this.name
      },
      timestamp: new Date().toISOString(),
      messages: this.messages
    };
    
    fs.writeFileSync(filePath, JSON.stringify(log, null, 2));
    console.log(`[${this.name}] Conversation log saved to ${filePath}`);
    
    return log;
  }
}

// Create data directory if it doesn't exist
const dataDir = path.join(process.cwd(), 'data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

// Create two agents
const agent1 = new Agent('agent1', 'Research Assistant');
const agent2 = new Agent('agent2', 'Code Assistant');

console.log('\n--- Starting agent communication demo ---\n');

// Agent 1 sends a message to Agent 2
agent1.sendMessage('agent2', {
  type: 'request',
  text: 'Hello from Agent 1! Can you help me with a TypeScript coding task?'
});

// Wait a moment for the response
setTimeout(() => {
  // Agent 1 sends another message
  agent1.sendMessage('agent2', {
    type: 'request',
    text: 'Thanks! Can you show me how to create an interface for a User object?'
  });
  
  // Wait a moment for the final response
  setTimeout(() => {
    // Save conversation logs
    agent1.saveConversationLog(path.join(dataDir, 'agent1_conversation.json'));
    agent2.saveConversationLog(path.join(dataDir, 'agent2_conversation.json'));
    
    console.log('\n--- Agent communication demo completed ---\n');
    console.log('Conversation logs have been saved to the data directory.');
  }, 1000);
}, 1000);