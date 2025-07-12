#!/usr/bin/env node

/**
 * TNF AI Bridge Test Tool
 * Simple test to verify extension functionality
 */

const WebSocket = require('ws');

class ExtensionTester {
  constructor() {
    this.ws = null;
    this.port = 3001;
  }

  async test() {
    console.log('🧪 Testing TNF AI Bridge Extension...');
    
    try {
      await this.connectToRelay();
      await this.testMessageInjection();
      await this.cleanup();
      console.log('✅ All tests passed!');
    } catch (error) {
      console.error('❌ Test failed:', error.message);
      process.exit(1);
    }
  }

  async connectToRelay() {
    console.log('📡 Connecting to TNF relay...');
    
    return new Promise((resolve, reject) => {
      this.ws = new WebSocket(`ws://localhost:${this.port}`);
      
      this.ws.on('open', () => {
        console.log('✅ Connected to TNF relay');
        resolve();
      });
      
      this.ws.on('error', (error) => {
        console.error('❌ Failed to connect to TNF relay:', error.message);
        reject(new Error('TNF relay not running or not accessible'));
      });
      
      this.ws.on('message', (data) => {
        const message = JSON.parse(data.toString());
        console.log('📩 Received from relay:', message.type);
      });
    });
  }

  async testMessageInjection() {
    console.log('💬 Testing message injection...');
    
    const testMessage = {
      type: 'INJECT_MESSAGE',
      targetAI: 'chatgpt',
      content: 'Hello from TNF AI Bridge test!',
      conversationId: `test-${Date.now()}`,
      timestamp: Date.now()
    };
    
    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error('Message injection test timed out'));
      }, 10000);
      
      this.ws.send(JSON.stringify(testMessage));
      
      const messageHandler = (data) => {
        const response = JSON.parse(data.toString());
        
        if (response.type === 'INJECTION_STATUS') {
          clearTimeout(timeout);
          this.ws.off('message', messageHandler);
          
          if (response.success) {
            console.log('✅ Message injection successful');
            resolve();
          } else {
            reject(new Error('Message injection failed'));
          }
        }
      };
      
      this.ws.on('message', messageHandler);
      
      console.log('📤 Test message sent, waiting for response...');
    });
  }

  async cleanup() {
    if (this.ws) {
      this.ws.close();
      console.log('🧹 Cleaned up connections');
    }
  }
}

// Run the test
const tester = new ExtensionTester();
tester.test();