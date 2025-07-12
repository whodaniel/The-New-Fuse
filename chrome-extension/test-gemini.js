#!/usr/bin/env node

/**
 * Test TNF AI Bridge with Gemini
 */

const WebSocket = require('ws');

class GeminiTester {
  constructor() {
    this.ws = null;
    this.conversationId = `gemini-test-${Date.now()}`;
  }

  async test() {
    console.log('🔄 Testing TNF AI Bridge with Gemini');
    console.log('📋 Prerequisites: Gemini tab open with extension loaded');
    console.log('');

    try {
      await this.connectToRelay();
      await this.registerAsAgent();
      await this.sendToGemini();
      await this.waitForResponse();
    } catch (error) {
      console.error('❌ Test failed:', error.message);
      process.exit(1);
    }
  }

  async connectToRelay() {
    console.log('📡 Connecting to TNF Relay...');
    
    return new Promise((resolve, reject) => {
      this.ws = new WebSocket('ws://localhost:3001');
      
      this.ws.on('open', () => {
        console.log('✅ Connected to TNF Relay');
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

  async registerAsAgent() {
    console.log('🤖 Registering as test agent...');
    
    const registration = {
      type: 'AGENT_REGISTER',
      agent: {
        id: 'gemini-tester',
        name: 'Gemini Test Agent',
        type: 'TEST_AGENT',
        capabilities: ['gemini_testing'],
        version: '1.0.0'
      },
      timestamp: Date.now()
    };

    this.ws.send(JSON.stringify(registration));
    await this.sleep(500);
  }

  async sendToGemini() {
    console.log('💬 Sending test message to Gemini...');
    
    const message = {
      type: 'INJECT_MESSAGE',
      targetAI: 'gemini',
      content: 'Hello Gemini! This is a test message from The New Fuse AI Bridge system. Can you confirm you received this message and respond with a simple acknowledgment?',
      conversationId: this.conversationId,
      timestamp: Date.now()
    };

    this.ws.send(JSON.stringify(message));
    console.log('📤 Message sent to Gemini via TNF Relay');
  }

  handleMessage(message) {
    const timestamp = new Date().toLocaleTimeString();
    console.log(`📩 [${timestamp}] ${message.type}`);
    
    switch (message.type) {
      case 'WELCOME':
        console.log(`🎉 Welcome (Client ID: ${message.clientId})`);
        break;
        
      case 'REGISTRATION_SUCCESS':
        console.log('✅ Agent registration successful');
        break;
        
      case 'INJECTION_STATUS':
        if (message.success) {
          console.log('✅ Message successfully injected into Gemini');
          console.log('⏳ Waiting for Gemini response...');
        } else {
          console.error('❌ Message injection failed:', message.error);
          console.log('💡 Check:');
          console.log('   - Gemini tab is open');
          console.log('   - Extension is loaded and active');
          console.log('   - Page is ready for input');
        }
        break;
        
      case 'WEB_AI_RESPONSE':
        console.log('🎉 SUCCESS! Gemini responded:');
        console.log('');
        console.log('=' .repeat(80));
        console.log(`Gemini: ${message.response}`);
        console.log('=' .repeat(80));
        console.log('');
        console.log('✅ Gemini AI-to-AI communication successful!');
        process.exit(0);
        break;
        
      default:
        console.log(`ℹ️ ${message.type}`);
    }
  }

  async waitForResponse() {
    console.log('⏳ Waiting for Gemini response (timeout: 30 seconds)...');
    
    setTimeout(() => {
      console.log('⏰ Timeout reached');
      console.log('');
      console.log('📊 Troubleshooting:');
      console.log('1. Make sure Gemini tab is open: https://gemini.google.com');
      console.log('2. Reload the extension in chrome://extensions/');
      console.log('3. Check browser console for errors');
      console.log('4. Verify TNF Relay is running on port 3001');
      process.exit(1);
    }, 30000);
  }

  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

const tester = new GeminiTester();
tester.test();