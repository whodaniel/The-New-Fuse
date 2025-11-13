// Test script for WebSocket rate limiting
const WebSocket = require('ws');

// Configuration
const WS_HOST = 'localhost';
const WS_PORT = 3710;
const WS_URL = `ws://${WS_HOST}:${WS_PORT}`;
const MESSAGE_COUNT = 120; // Send more messages than the default limit (100)
const MESSAGE_DELAY = 10; // Delay between messages in milliseconds

// Test rate limiting
async function testRateLimiting() {
  console.log('Testing WebSocket rate limiting...');
  
  return new Promise((resolve) => {
    const ws = new WebSocket(WS_URL, {
      rejectUnauthorized: false // Allow self-signed certificates
    });
    
    let messagesSent = 0;
    let messagesReceived = 0;
    let warnings = 0;
    let errors = 0;
    let rateLimited = false;
    
    ws.on('open', () => {
      console.log('Connected to WebSocket server');
      
      // Send authentication message
      const authMessage = {
        type: 'AUTH',
        token: 'test-token'
      };
      
      ws.send(JSON.stringify(authMessage));
      console.log('Sent authentication message');
      
      // Start sending messages after a delay
      setTimeout(() => {
        console.log(`Sending ${MESSAGE_COUNT} messages with ${MESSAGE_DELAY}ms delay...`);
        sendMessages();
      }, 1000);
    });
    
    // Send messages at a rapid rate to trigger rate limiting
    function sendMessages() {
      if (messagesSent >= MESSAGE_COUNT || rateLimited) {
        console.log('Finished sending messages');
        
        // Wait for a while to receive any remaining responses
        setTimeout(() => {
          ws.close();
          
          console.log('\nTest Results:');
          console.log(`Messages sent: ${messagesSent}`);
          console.log(`Messages received: ${messagesReceived}`);
          console.log(`Warnings received: ${warnings}`);
          console.log(`Errors received: ${errors}`);
          console.log(`Rate limited: ${rateLimited ? 'Yes' : 'No'}`);
          
          resolve();
        }, 2000);
        
        return;
      }
      
      // Send a test message
      const message = {
        type: 'TEST',
        id: messagesSent + 1,
        data: `Test message ${messagesSent + 1}`,
        timestamp: Date.now()
      };
      
      try {
        ws.send(JSON.stringify(message));
        messagesSent++;
        
        // Log progress
        if (messagesSent % 10 === 0) {
          console.log(`Sent ${messagesSent} messages...`);
        }
        
        // Schedule the next message
        setTimeout(sendMessages, MESSAGE_DELAY);
      } catch (error) {
        console.error('Error sending message:', error);
        ws.close();
        resolve();
      }
    }
    
    ws.on('message', (data) => {
      try {
        const message = JSON.parse(data);
        messagesReceived++;
        
        // Check for rate limit warnings or errors
        if (message.type === 'WARNING') {
          warnings++;
          console.log(`Warning received: ${message.message}`);
        } else if (message.type === 'ERROR') {
          errors++;
          console.log(`Error received: ${message.message}`);
          
          // Check if this is a rate limit error
          if (message.message.includes('Rate limit exceeded')) {
            rateLimited = true;
            console.log('Rate limit triggered!');
          }
        } else if (message.type === 'SYSTEM') {
          console.log('System message:', message.message);
          
          // Check for rate limit info in welcome message
          if (message.rateLimit && message.rateLimit.enabled) {
            console.log('Rate limiting is enabled:');
            console.log(`- Max messages: ${message.rateLimit.maxMessages}`);
            console.log(`- Window: ${message.rateLimit.windowMs}ms`);
            console.log(`- Remaining: ${message.rateLimit.remaining}`);
          }
        }
      } catch (error) {
        console.error('Error parsing message:', error);
      }
    });
    
    ws.on('error', (error) => {
      console.error('WebSocket error:', error.message);
      resolve();
    });
    
    ws.on('close', () => {
      console.log('Connection closed');
      resolve();
    });
  });
}

// Run the test
testRateLimiting().then(() => {
  console.log('Test completed');
});
