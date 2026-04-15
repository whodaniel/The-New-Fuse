/**
 * Test script for The New Fuse API endpoints
 * Run this with: node test-api.js
 */
const http = require('http');

// Helper function to make HTTP requests
function makeRequest(path, method = 'GET', data = null) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'localhost',
      port: 3001,
      path,
      method,
      headers: {
        'Content-Type': 'application/json'
      }
    };

    const req = http.request(options, (res) => {
      let responseData = '';
      
      res.on('data', (chunk) => {
        responseData += chunk;
      });
      
      res.on('end', () => {
        try {
          const parsedData = JSON.parse(responseData);
          console.log(`✓ ${method} ${path} - Status: ${res.statusCode}`);
          resolve(parsedData);
        } catch (error) {
          console.log(`✗ ${method} ${path} - Error parsing response: ${responseData}`);
          reject(error);
        }
      });
    });
    
    req.on('error', (error) => {
      console.log(`✗ ${method} ${path} - ${error.message}`);
      reject(error);
    });
    
    if (data) {
      req.write(JSON.stringify(data));
    }
    
    req.end();
  });
}

// Run test suite
async function runTests() {
  console.log('=== Testing The New Fuse API ===');
  
  try {
    // Test root endpoint
    await makeRequest('/');
    
    // Test agents list endpoint
    await makeRequest('/api/agents');
    
    // Test agent detail endpoint
    await makeRequest('/api/agents/1');
    
    // Test auth endpoints
    await makeRequest('/api/auth/me');
    
    console.log('\n✅ All tests completed successfully!');
  } catch (error) {
    console.log('\n❌ Some tests failed');
    console.error(error);
  }
}

runTests();
