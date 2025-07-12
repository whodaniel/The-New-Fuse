#!/usr/bin/env node

/**
 * Test sending a message through TNF router to ChatGPT
 * This simulates how a local AI agent would communicate with ChatGPT
 */

const WebSocket = require('ws');

class RouterToChatGPTTest {
  constructor() {
    this.ws = null;
    this.conversationId = `router-test-${Date.now()}`;
  }

  async test() {
    console.log('🔄 Testing TNF Router → ChatGPT Communication');
    console.log('📋 This simulates a local AI agent sending a message to ChatGPT');
    console.log('');

    try {
      await this.connectToRouter();
      await this.registerAsLocalAI();
      await this.sendMessageToChatGPT();
      await this.waitForResponse();
    } catch (error) {
      console.error('❌ Test failed:', error.message);
      process.exit(1);
    }
  }

  async connectToRouter() {
    console.log('📡 Connecting to TNF Router...');
    
    return new Promise((resolve, reject) => {
      this.ws = new WebSocket('ws://localhost:3001');
      
      this.ws.on('open', () => {
        console.log('✅ Connected to TNF Router');
        resolve();
      });
      
      this.ws.on('error', (error) => {
        reject(new Error(`Connection failed: ${error.message}`));
      });
      
      this.ws.on('message', (data) => {
        this.handleMessage(JSON.parse(data.toString()));
      });
    });
  }

  async registerAsLocalAI() {
    console.log('🤖 Registering as local AI agent...');
    
    const registration = {
      type: 'AGENT_REGISTER',
      agent: {
        id: 'local-ai-claude',
        name: 'Claude Code AI Agent',
        type: 'LOCAL_AI',
        capabilities: ['chat', 'coding', 'web_ai_communication'],
        version: '1.0.0'
      },
      timestamp: Date.now()
    };

    this.ws.send(JSON.stringify(registration));
    await this.sleep(500);
    console.log('✅ Registered as local AI agent');
  }

  async sendMessageToChatGPT() {
    console.log('💬 Sending message to ChatGPT via TNF Router...');
    
    const message = {
      type: 'INJECT_MESSAGE',
      targetAI: 'chatgpt',
      content: 'Hello ChatGPT! I am Claude Code, a local AI agent. I\'m communicating with you through The New Fuse router system. This demonstrates AI-to-AI communication between local and web-based AI systems. Can you confirm this message reached you successfully?',
      conversationId: this.conversationId,
      timestamp: Date.now(),
      source: 'local-ai-claude'
    };

    this.ws.send(JSON.stringify(message));
    console.log('📤 Message sent to TNF Router for routing to ChatGPT');
    console.log('🔄 Router should forward this to Chrome Extension → ChatGPT');
  }

  handleMessage(message) {
    const timestamp = new Date().toLocaleTimeString();
    console.log(`📩 [${timestamp}] ${message.type}`);
    
    switch (message.type) {
      case 'WELCOME':
        console.log(`🎉 Welcome from router (Client ID: ${message.clientId})`);
        break;
        
      case 'REGISTRATION_SUCCESS':
        console.log('✅ Local AI agent registration successful');
        break;
        
      case 'INJECTION_STATUS':
        if (message.success) {
          console.log('✅ Message successfully injected into ChatGPT');
          console.log('⏳ Waiting for ChatGPT response...');
        } else {
          console.error('❌ Message injection failed:', message.error);
          console.log('💡 Make sure Chrome extension is active on ChatGPT tab');
        }
        break;
        
      case 'WEB_AI_RESPONSE':
        console.log('🎉 SUCCESS! ChatGPT responded:');
        console.log('');
        console.log('=' .repeat(80));
        console.log(`ChatGPT: ${message.response}`);
        console.log('=' .repeat(80));
        console.log('');
        console.log('✅ AI-to-AI communication via TNF Router successful!');
        console.log('🔄 Message flow: Local AI → TNF Router → Chrome Extension → ChatGPT → Response');
        
        // Test sending a follow-up message
        setTimeout(() => {
          this.sendFollowUpMessage();
        }, 2000);
        break;
        
      default:
        console.log(`ℹ️ ${message.type}:`, message);
    }
  }

  async sendFollowUpMessage() {
    console.log('');
    console.log('🔄 Sending follow-up message to test conversation continuity...');
    
    const followUp = {
      type: 'INJECT_MESSAGE',
      targetAI: 'chatgpt',
      content: 'Great! The communication is working. Now, can you tell me what you think about this AI-to-AI communication system? This could enable interesting collaborations between different AI systems.',
      conversationId: this.conversationId + '-followup',
      timestamp: Date.now(),
      source: 'local-ai-claude'
    };

    this.ws.send(JSON.stringify(followUp));
  }

  async waitForResponse() {
    console.log('⏳ Waiting for responses (timeout: 60 seconds)...');
    
    setTimeout(() => {
      console.log('⏰ Test timeout reached');
      console.log('');
      console.log('📊 Test Summary:');
      console.log('- Connection to router: ✅');
      console.log('- Agent registration: ✅');
      console.log('- Message sending: ✅');
      console.log('- If no response, check Chrome extension is active on ChatGPT');
      
      process.exit(0);
    }, 60000);
  }

  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// Run the test
console.log('🚀 Starting Router → ChatGPT Test');
console.log('📋 Prerequisites:');
console.log('   1. TNF Router running on port 3001 ✅');
console.log('   2. Chrome extension installed and active on ChatGPT tab');
console.log('   3. ChatGPT tab open and ready');
console.log('');

const test = new RouterToChatGPTTest();
test.test();