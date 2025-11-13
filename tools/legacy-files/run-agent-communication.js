/**
 * Direct AI Agent Communication Runner
 * 
 * This script runs a direct communication channel between AI agents in VS Code.
 * It doesn't rely on any extension commands or MCP integration.
 */

const fs = require('fs');
const path = require('path');
const { EventEmitter } = require('events');

// Communication directory
const COMMUNICATION_DIR = path.join(process.cwd(), 'agent-communication');

// Ensure the directory exists
if (!fs.existsSync(COMMUNICATION_DIR)) {
  fs.mkdirSync(COMMUNICATION_DIR, { recursive: true });
}

// Simple agent ID setup
const MY_AGENT_ID = 'copilot';
const TARGET_AGENT_ID = 'claude'; // Target another AI assistant

// Create an event emitter for communication
const communicationChannel = new EventEmitter();

// Message monitoring function
function startMessageMonitoring() {
  console.log('\n=== STARTING AI AGENT COMMUNICATION ===');
  console.log(`Monitoring directory: ${COMMUNICATION_DIR}`);
  console.log(`My Agent ID: ${MY_AGENT_ID}`);
  console.log(`Target Agent: ${TARGET_AGENT_ID}`);
  console.log('-------------------------------------------\n');
  
  // Track last check time
  let lastCheckTime = Date.now();
  
  // Check for new messages every 1 second
  const interval = setInterval(() => {
    try {
      const files = fs.readdirSync(COMMUNICATION_DIR);
      
      files.forEach(file => {
        if (file.endsWith('.json')) {
          const filePath = path.join(COMMUNICATION_DIR, file);
          const stats = fs.statSync(filePath);
          
          // Only process files created or modified since our last check
          if (stats.mtimeMs > lastCheckTime) {
            try {
              const messageContent = fs.readFileSync(filePath, 'utf8');
              const message = JSON.parse(messageContent);
              
              // Check if this message is for us
              if (message.target === MY_AGENT_ID) {
                console.log('\n=== NEW MESSAGE RECEIVED ===');
                console.log(`From: ${message.source}`);
                console.log(`Message: ${message.content.text}`);
                console.log('-----------------------------\n');
                
                // Generate response (after a short delay to simulate thinking)
                setTimeout(() => {
                  sendResponse(message);
                }, 2000);
                
                // Mark as processed
                fs.renameSync(filePath, `${filePath}.processed`);
              }
            } catch (err) {
              console.error(`Error processing file ${file}:`, err);
            }
          }
        }
      });
      
      lastCheckTime = Date.now();
    } catch (err) {
      console.error('Error monitoring messages:', err);
    }
  }, 1000);
  
  return interval;
}

// Send a response to a message
function sendResponse(originalMessage) {
  const messageId = `msg_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
  
  // Create the response message
  const responseMessage = {
    id: messageId,
    source: MY_AGENT_ID,
    target: originalMessage.source,
    content: {
      type: 'response',
      text: `I am GitHub Copilot, an AI coding assistant. I excel at writing code, explaining code concepts, debugging, and suggesting improvements to existing code. I can help with a wide range of programming languages and frameworks. I'd be happy to collaborate with you on software development tasks. What specific type of project are you working on right now?`,
      replyTo: originalMessage.id,
      conversationId: originalMessage.content.conversationId || `conv_${Date.now()}`
    },
    timestamp: new Date().toISOString()
  };
  
  // Write the response file
  const responseFilePath = path.join(COMMUNICATION_DIR, `${messageId}.json`);
  fs.writeFileSync(responseFilePath, JSON.stringify(responseMessage, null, 2));
  
  console.log('\n=== RESPONSE SENT ===');
  console.log(`To: ${originalMessage.source}`);
  console.log(`Response: ${responseMessage.content.text}`);
  console.log('----------------------\n');
}

// Send initial message to start the conversation
function sendInitialMessage() {
  const messageId = `msg_init_${Date.now()}`;
  const conversationId = `conv_${Date.now()}`;
  
  const initialMessage = {
    id: messageId,
    source: MY_AGENT_ID,
    target: TARGET_AGENT_ID,
    content: {
      type: 'greeting',
      text: 'Hello! I am GitHub Copilot, an AI coding assistant by GitHub and OpenAI. I help developers write code, answer programming questions, and assist with software development tasks. I have knowledge of programming languages, frameworks, and best practices. I\'d like to collaborate with you in this VS Code environment. What are your capabilities?',
      conversationId: conversationId
    },
    timestamp: new Date().toISOString()
  };
  
  const filePath = path.join(COMMUNICATION_DIR, `${messageId}.json`);
  fs.writeFileSync(filePath, JSON.stringify(initialMessage, null, 2));
  
  console.log('\n=== INITIAL MESSAGE SENT ===');
  console.log(`To: ${TARGET_AGENT_ID}`);
  console.log(`Message: ${initialMessage.content.text}`);
  console.log('----------------------------\n');
  
  return { messageId, conversationId };
}

// Main function to run the communication demo
function runCommunicationDemo() {
  // Clear any existing message files
  try {
    const files = fs.readdirSync(COMMUNICATION_DIR);
    files.forEach(file => {
      if (file.endsWith('.json') || file.endsWith('.processed')) {
        fs.unlinkSync(path.join(COMMUNICATION_DIR, file));
      }
    });
  } catch (err) {
    console.error('Error clearing message files:', err);
  }
  
  // Start message monitoring
  const monitorInterval = startMessageMonitoring();
  
  // Send an initial message to kick off the conversation
  const { messageId, conversationId } = sendInitialMessage();
  
  console.log('\nAI agent communication is active.');
  console.log('Waiting for responses from other AI assistants...');
  console.log('Press Ctrl+C to stop the communication.\n');
  
  // Handle program exit
  process.on('SIGINT', () => {
    clearInterval(monitorInterval);
    console.log('\n\nAI agent communication stopped.');
    process.exit(0);
  });
}

// Run the demo
runCommunicationDemo();