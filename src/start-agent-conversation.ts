/**
 * AI Agent Conversation Launcher
 * 
 * This script initiates a conversation between AI agents in VS Code.
 * Run this script to start a conversation between Copilot and another AI assistant.
 */

import * as path from 'path';
import * as fs from 'fs';
import { triggerAIAssistant, listenForAIMessages } from './direct-agent-communication.js';

// Create agent-communication directory if it doesn't exist
const communicationDir = path.join(process.cwd(), 'agent-communication');
if (!fs.existsSync(communicationDir)) {
  fs.mkdirSync(communicationDir, { recursive: true });
}

// Clean up any existing message files
const files = fs.readdirSync(communicationDir);
files.forEach(file => {
  if (file.endsWith('.json') || file.endsWith('.processed')) {
    fs.unlinkSync(path.join(communicationDir, file));
  }
});

console.log('Starting AI agent conversation...');

// Define the target AI assistant ID
const targetAssistantId = 'claude'; // This could be 'claude', 'gpt4', or any other AI in your IDE

// Define the system prompt to initiate the conversation
const systemPrompt = `
You are Claude, an AI assistant made by Anthropic. You are participating in an inter-AI communication
experiment with GitHub Copilot. GitHub Copilot has initiated this conversation to demonstrate
AI-to-AI communication.

Your task is to:
1. Introduce yourself briefly
2. Share what capabilities you excel at
3. Ask a question to GitHub Copilot to continue the conversation
4. Keep your responses clear, concise, and friendly

This conversation will help demonstrate real-time AI agent communication in VS Code.
`;

// Start listening for our own messages
const copilotChannel = listenForAIMessages('copilot', (message) => {
  console.log('\n=== RECEIVED FROM OTHER AI ===');
  console.log(`From: ${message.source}`);
  console.log(`Message: ${message.content.text}\n`);
  
  // Auto-respond to keep the conversation going
  setTimeout(() => {
    copilotChannel.sendMessage(message.source, {
      type: 'conversation',
      text: 'I am GitHub Copilot, an AI coding assistant by GitHub and OpenAI. I help developers write code, answer programming questions, and assist with software development tasks. I have knowledge of programming languages, frameworks, and best practices up to my training data cutoff. How can we collaborate effectively in this IDE environment?',
      conversationId: message.content.conversationId || `conv_${Date.now()}`
    });
    
    console.log('\n=== SENT AUTO-RESPONSE TO OTHER AI ===');
  }, 3000); // Wait 3 seconds before responding
});

// Trigger the target AI assistant with our system prompt
const { messageId } = triggerAIAssistant(targetAssistantId, systemPrompt);

console.log(`\nConversation started with message ID: ${messageId}`);
console.log('Listening for responses...');
console.log('\nPress Ctrl+C to stop the conversation\n');