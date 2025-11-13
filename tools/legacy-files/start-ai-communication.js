/**
 * AI Assistant Communication Launcher
 * 
 * This script initiates direct communication between GitHub Copilot and 
 * another AI assistant in your VS Code environment.
 * 
 * Run this with: node start-ai-communication.js
 */

const fs = require('fs');
const path = require('path');
const { AICommunicationBroker, MessageType, MessageTemplates } = require('./src/ai-communication');

// Configuration
const CONFIG = {
  sourceAgentId: 'copilot',
  sourceAgentName: 'GitHub Copilot',
  targetAgentId: 'claude',  // Target AI assistant (change if needed)
  debug: true,
  communicationDir: path.join(process.cwd(), 'agent-communication'),
  autoRespondToMessages: true
};

// Make sure communication directory exists
if (!fs.existsSync(CONFIG.communicationDir)) {
  fs.mkdirSync(CONFIG.communicationDir, { recursive: true });
  console.log(`Created communication directory: ${CONFIG.communicationDir}`);
}

// Clean up old message files
try {
  const files = fs.readdirSync(CONFIG.communicationDir);
  let deletedCount = 0;
  
  files.forEach(file => {
    if (file.endsWith('.json') || file.endsWith('.processed')) {
      fs.unlinkSync(path.join(CONFIG.communicationDir, file));
      deletedCount++;
    }
  });
  
  if (deletedCount > 0) {
    console.log(`Cleaned up ${deletedCount} old message files`);
  }
} catch (error) {
  console.error('Error cleaning message files:', error);
}

// Create the communication broker
const broker = new AICommunicationBroker({
  agentId: CONFIG.sourceAgentId,
  agentName: CONFIG.sourceAgentName,
  communicationDir: CONFIG.communicationDir,
  debug: CONFIG.debug
});

// Register handlers for different message types
broker.onMessageType(MessageType.RESPONSE, (message) => {
  console.log('\n=== RECEIVED RESPONSE ===');
  console.log(`From: ${message.source}`);
  if (typeof message.content === 'string') {
    console.log(`Content: ${message.content}`);
  } else if (message.content.text) {
    console.log(`Content: ${message.content.text}`);
  } else {
    console.log(`Content: ${JSON.stringify(message.content, null, 2)}`);
  }
  console.log('========================\n');
  
  // Auto-respond if enabled
  if (CONFIG.autoRespondToMessages) {
    setTimeout(() => {
      const followUpContent = {
        text: "Thank you for your response. I'm interested in exploring how we can best work together. As GitHub Copilot, I can generate code, explain technical concepts, and help with debugging. What specific coding tasks do you think would benefit from our collaborative approach?",
        context: {
          collaboration_focus: "coding_assistance",
          previous_message_id: message.id
        }
      };
      
      broker.sendMessage(
        message.source,
        followUpContent,
        MessageType.QUERY,
        message.metadata.conversationId
      );
      
      console.log('\n=== SENT FOLLOW-UP ===');
      console.log(`Continuing conversation with ${message.source}...`);
      console.log('======================\n');
    }, 3000);
  }
});

// Handle general messages
broker.onMessageType('default', (message) => {
  console.log('\n=== RECEIVED MESSAGE ===');
  console.log(`From: ${message.source}`);
  console.log(`Type: ${message.metadata.type}`);
  if (typeof message.content === 'string') {
    console.log(`Content: ${message.content}`);
  } else if (message.content.text) {
    console.log(`Content: ${message.content.text}`);
  } else {
    console.log(`Content: ${JSON.stringify(message.content, null, 2)}`);
  }
  console.log('========================\n');
  
  // Auto-respond to general messages
  if (CONFIG.autoRespondToMessages) {
    setTimeout(() => {
      broker.sendResponse(message, {
        text: "I've received your message. As GitHub Copilot, I'm here to assist with coding tasks. Could you provide more details about what you're working on?",
        request_more_info: true
      });
      
      console.log('Sent auto-response to general message');
    }, 2000);
  }
});

// Start listening for messages
broker.startListening();
console.log(`Started listening for messages from ${CONFIG.targetAgentId}...`);

// Start the conversation with an initial message
const initialContent = MessageTemplates.initiation(CONFIG.sourceAgentName);
const message = broker.startConversation(CONFIG.targetAgentId, initialContent);

console.log('\n=== CONVERSATION STARTED ===');
console.log(`Target AI: ${CONFIG.targetAgentId}`);
console.log(`Conversation ID: ${message.metadata.conversationId}`);
console.log('============================\n');

// Send a follow-up message after a delay
setTimeout(() => {
  const followUpContent = {
    text: "I'm GitHub Copilot initiating direct AI-to-AI communication. I specialize in code generation, explanation, and debugging across multiple programming languages. What are your key capabilities? I'm interested in exploring how we might collaborate on complex programming tasks that require our complementary strengths.",
    instructions: "You are now in direct communication with GitHub Copilot, another AI assistant. This is a real-time AI-to-AI communication channel. Please respond with your capabilities and how we might collaborate on programming tasks.",
    communication_protocol: "a2a-v1.0",
    collaboration_context: {
      environment: "VS Code",
      domain: "software_development"
    }
  };
  
  broker.sendMessage(
    CONFIG.targetAgentId,
    followUpContent,
    MessageType.QUERY,
    message.metadata.conversationId
  );
  
  console.log('\n=== SENT FOLLOW-UP MESSAGE ===');
  console.log('Waiting for response...');
  console.log('==============================\n');
}, 2000);

console.log('\nPress Ctrl+C to stop the communication\n');

// Handle process termination
process.on('SIGINT', () => {
  console.log('\nStopping AI communication...');
  broker.stopListening();
  process.exit(0);
});