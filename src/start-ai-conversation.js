/**
 * AI Assistant Communication Launcher
 * 
 * This script initiates communication between GitHub Copilot and another AI assistant
 * in VS Code, implementing the technical recommendations from the report.
 */

const { InterLLMCommunicationBroker, createInitiationMessage } = require('./inter-llm-communication');

// Configuration
const CONFIG = {
  // ID of this agent (Copilot)
  sourceAgentId: 'copilot',
  
  // Target AI assistant to communicate with
  // You can change this to match the ID of any AI assistant in your VS Code
  targetAgentId: 'claude',
  
  // Enable debug logging
  debug: true,
  
  // Auto-respond to messages
  autoRespond: true
};

// Create a communication broker for this agent
const broker = new InterLLMCommunicationBroker({
  agentId: CONFIG.sourceAgentId,
  debug: CONFIG.debug
});

// Clear existing message files to start a fresh conversation
broker.clearMessageFiles();

console.log('\n=== AI Agent Communication Launcher ===');
console.log(`Source Agent: ${CONFIG.sourceAgentId}`);
console.log(`Target Agent: ${CONFIG.targetAgentId}`);
console.log('Communication directory:', broker.communicationDir);
console.log('=======================================\n');

// Register message handler for responses
broker.onMessageType('response', (message) => {
  console.log(`\n>>> Received response from ${message.source}:`);
  console.log(message.content.text || JSON.stringify(message.content));
  
  if (CONFIG.autoRespond) {
    setTimeout(() => {
      // Generate a contextual follow-up based on received message
      const followUpContent = {
        text: `Thank you for sharing. Based on your capabilities, I think we could collaborate effectively on a variety of development tasks. I can provide code suggestions and implementations, while you can help with analysis and explanation. Would you like to discuss a specific example of how we might work together on a coding task?`,
        conversation_context: {
          previous_message: message.id,
          conversation_id: message.metadata.conversationId
        }
      };
      
      broker.sendMessage(message.source, followUpContent, 'follow_up');
      console.log('\n>>> Sent follow-up message');
    }, 2000);
  }
});

// Register message handler for all other message types
broker.onMessageType('default', (message) => {
  console.log(`\n>>> Received message from ${message.source}:`);
  console.log(message.content.text || JSON.stringify(message.content));
  
  if (CONFIG.autoRespond) {
    setTimeout(() => {
      // Send a generic response
      const responseContent = {
        text: `I received your message. As GitHub Copilot, I'm here to help with coding tasks and provide technical assistance. Can you tell me more about what you're working on?`
      };
      
      broker.sendResponse(message, responseContent);
      console.log('\n>>> Sent auto-response');
    }, 2000);
  }
});

// Start listening for messages
broker.startListening();

// Send initial message to start the conversation
const initiationMessage = createInitiationMessage(CONFIG.targetAgentId);
const sentMessage = broker.sendMessage(
  CONFIG.targetAgentId,
  initiationMessage,
  'initiation'
);

console.log('\n>>> Sent initiation message to', CONFIG.targetAgentId);
console.log('Message ID:', sentMessage.id);
console.log('Conversation ID:', sentMessage.metadata.conversationId);
console.log('\nListening for responses... (Press Ctrl+C to stop)\n');