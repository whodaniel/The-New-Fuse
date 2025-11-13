// Test script for WebSocket message compression
const WebSocket = require('ws');
const zlib = require('zlib');

// Configuration
const WS_HOST = 'localhost';
const WS_PORT = 3710;
const WS_URL = `ws://${WS_HOST}:${WS_PORT}`;

// Test data sizes
const TEST_SIZES = [
  100,      // 100 bytes
  1000,     // 1 KB
  10000,    // 10 KB
  100000,   // 100 KB
  1000000   // 1 MB
];

// Generate test data of specified size
function generateTestData(size) {
  let data = '';
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  
  for (let i = 0; i < size; i++) {
    data += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  
  return data;
}

// Measure compression ratio
function measureCompression(data) {
  const original = Buffer.from(data);
  const compressed = zlib.deflateSync(original);
  
  return {
    originalSize: original.length,
    compressedSize: compressed.length,
    ratio: compressed.length / original.length,
    savings: 1 - (compressed.length / original.length)
  };
}

// Test compression with different data sizes
async function testCompression() {
  console.log('Testing WebSocket message compression...');
  console.log('----------------------------------------');
  
  for (const size of TEST_SIZES) {
    const testData = generateTestData(size);
    const metrics = measureCompression(testData);
    
    console.log(`Data size: ${size} bytes`);
    console.log(`Compressed size: ${metrics.compressedSize} bytes`);
    console.log(`Compression ratio: ${metrics.ratio.toFixed(2)}`);
    console.log(`Space savings: ${(metrics.savings * 100).toFixed(2)}%`);
    console.log('----------------------------------------');
  }
  
  // Connect to WebSocket server and test real-world compression
  await testWebSocketCompression();
}

// Test WebSocket compression with real connection
async function testWebSocketCompression() {
  console.log('\nTesting WebSocket compression with server connection...');
  
  return new Promise((resolve) => {
    const ws = new WebSocket(WS_URL, {
      perMessageDeflate: true,
      rejectUnauthorized: false
    });
    
    ws.on('open', () => {
      console.log('Connected to WebSocket server');
      
      // Send authentication message
      const authMessage = {
        type: 'AUTH',
        token: 'test-token'
      };
      
      ws.send(JSON.stringify(authMessage));
      console.log('Sent authentication message');
      
      // Wait for authentication response
      setTimeout(() => {
        // Test with medium-sized message
        const testData = generateTestData(50000);
        const metrics = measureCompression(testData);
        
        console.log(`Sending test message (${testData.length} bytes)...`);
        
        const startTime = Date.now();
        ws.send(JSON.stringify({
          type: 'TEST_COMPRESSION',
          data: testData
        }));
        
        console.log(`Message sent in ${Date.now() - startTime}ms`);
        console.log(`Expected compression savings: ${(metrics.savings * 100).toFixed(2)}%`);
        
        // Close connection after a delay
        setTimeout(() => {
          ws.close();
          resolve();
        }, 1000);
      }, 1000);
    });
    
    ws.on('message', (data) => {
      try {
        const message = JSON.parse(data);
        console.log('Received message:', message.type);
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

// Run the tests
testCompression().then(() => {
  console.log('Tests completed');
});
