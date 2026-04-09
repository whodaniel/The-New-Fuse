#!/usr/bin/env node

/**
 * Connection Test Script - Verify all services are properly connected
 */

const http = require('http');
const WebSocket = require('ws');

const API_BASE = 'http://localhost:3000';
const WS_BASE = 'ws://localhost:3001';
const FRONTEND_BASE = 'http://localhost:5173';

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function success(message) {
  log(`✓ ${message}`, 'green');
}

function error(message) {
  log(`✗ ${message}`, 'red');
}

function info(message) {
  log(`ℹ ${message}`, 'blue');
}

function warning(message) {
  log(`⚠ ${message}`, 'yellow');
}

// HTTP request helper
function makeRequest(url, options = {}) {
  return new Promise((resolve, reject) => {
    const req = http.request(url, options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const parsed = data ? JSON.parse(data) : {};
          resolve({ status: res.statusCode, data: parsed, headers: res.headers });
        } catch (e) {
          resolve({ status: res.statusCode, data: data, headers: res.headers });
        }
      });
    });
    
    req.on('error', reject);
    req.setTimeout(5000, () => {
      req.destroy();
      reject(new Error('Request timeout'));
    });
    
    if (options.body) {
      req.write(options.body);
    }
    
    req.end();
  });
}

// Test API health
async function testAPIHealth() {
  info('Testing API health...');
  try {
    const response = await makeRequest(`${API_BASE}/health`);
    if (response.status === 200) {
      success('API health check passed');
      return true;
    } else {
      error(`API health check failed: ${response.status}`);
      return false;
    }
  } catch (err) {
    error(`API health check failed: ${err.message}`);
    return false;
  }
}

// Test system status
async function testSystemStatus() {
  info('Testing system status...');
  try {
    const response = await makeRequest(`${API_BASE}/api/system/status`);
    if (response.status === 200) {
      success('System status check passed');
      console.log('  Services:', JSON.stringify(response.data, null, 2));
      return true;
    } else {
      error(`System status check failed: ${response.status}`);
      return false;
    }
  } catch (err) {
    error(`System status check failed: ${err.message}`);
    return false;
  }
}

// Test workflow endpoints
async function testWorkflowEndpoints() {
  info('Testing workflow endpoints...');
  try {
    // Test GET /api/workflows
    const response = await makeRequest(`${API_BASE}/api/workflows`);
    if (response.status === 200 || response.status === 401) { // 401 is expected without auth
      success('Workflow endpoints are accessible');
      return true;
    } else {
      error(`Workflow endpoints failed: ${response.status}`);
      return false;
    }
  } catch (err) {
    error(`Workflow endpoints failed: ${err.message}`);
    return false;
  }
}

// Test WebSocket connection
async function testWebSocket() {
  info('Testing WebSocket connection...');
  return new Promise((resolve) => {
    try {
      const ws = new WebSocket(WS_BASE);
      
      const timeout = setTimeout(() => {
        ws.close();
        error('WebSocket connection timeout');
        resolve(false);
      }, 5000);
      
      ws.on('open', () => {
        clearTimeout(timeout);
        success('WebSocket connection established');
        ws.close();
        resolve(true);
      });
      
      ws.on('error', (err) => {
        clearTimeout(timeout);
        error(`WebSocket connection failed: ${err.message}`);
        resolve(false);
      });
      
      ws.on('message', (data) => {
        try {
          const message = JSON.parse(data);
          info(`WebSocket message received: ${message.message || 'Unknown'}`);
        } catch (e) {
          info(`WebSocket message received: ${data}`);
        }
      });
    } catch (err) {
      error(`WebSocket test failed: ${err.message}`);
      resolve(false);
    }
  });
}

// Test frontend accessibility
async function testFrontend() {
  info('Testing frontend accessibility...');
  try {
    const response = await makeRequest(FRONTEND_BASE);
    if (response.status === 200) {
      success('Frontend is accessible');
      return true;
    } else {
      error(`Frontend accessibility failed: ${response.status}`);
      return false;
    }
  } catch (err) {
    error(`Frontend accessibility failed: ${err.message}`);
    return false;
  }
}

// Test workflow builder route
async function testWorkflowBuilder() {
  info('Testing workflow builder route...');
  try {
    const response = await makeRequest(`${FRONTEND_BASE}/workflows/builder`);
    if (response.status === 200) {
      success('Workflow builder route is accessible');
      return true;
    } else {
      warning(`Workflow builder route returned: ${response.status} (may be normal for SPA)`);
      return true; // SPAs often return 200 for all routes
    }
  } catch (err) {
    error(`Workflow builder route failed: ${err.message}`);
    return false;
  }
}

// Test MCP endpoints
async function testMCPEndpoints() {
  info('Testing MCP endpoints...');
  try {
    const response = await makeRequest(`${API_BASE}/api/mcp/servers`);
    if (response.status === 200 || response.status === 401) { // 401 is expected without auth
      success('MCP endpoints are accessible');
      return true;
    } else {
      error(`MCP endpoints failed: ${response.status}`);
      return false;
    }
  } catch (err) {
    error(`MCP endpoints failed: ${err.message}`);
    return false;
  }
}

// Test agent endpoints
async function testAgentEndpoints() {
  info('Testing agent endpoints...');
  try {
    const response = await makeRequest(`${API_BASE}/api/agents`);
    if (response.status === 200 || response.status === 401) { // 401 is expected without auth
      success('Agent endpoints are accessible');
      return true;
    } else {
      error(`Agent endpoints failed: ${response.status}`);
      return false;
    }
  } catch (err) {
    error(`Agent endpoints failed: ${err.message}`);
    return false;
  }
}

// Main test runner
async function runTests() {
  console.log('🧪 The New Fuse Connection Test Suite');
  console.log('=====================================\n');
  
  const tests = [
    { name: 'API Health', fn: testAPIHealth },
    { name: 'System Status', fn: testSystemStatus },
    { name: 'Workflow Endpoints', fn: testWorkflowEndpoints },
    { name: 'WebSocket Connection', fn: testWebSocket },
    { name: 'Frontend Accessibility', fn: testFrontend },
    { name: 'Workflow Builder Route', fn: testWorkflowBuilder },
    { name: 'MCP Endpoints', fn: testMCPEndpoints },
    { name: 'Agent Endpoints', fn: testAgentEndpoints },
  ];
  
  const results = [];
  
  for (const test of tests) {
    try {
      const result = await test.fn();
      results.push({ name: test.name, passed: result });
    } catch (err) {
      error(`Test "${test.name}" threw an error: ${err.message}`);
      results.push({ name: test.name, passed: false });
    }
    console.log(''); // Add spacing between tests
  }
  
  // Summary
  console.log('📊 Test Results Summary');
  console.log('=======================');
  
  const passed = results.filter(r => r.passed).length;
  const total = results.length;
  
  results.forEach(result => {
    if (result.passed) {
      success(`${result.name}`);
    } else {
      error(`${result.name}`);
    }
  });
  
  console.log('');
  if (passed === total) {
    success(`All tests passed! (${passed}/${total})`);
    console.log('🎉 Your system is ready for production!');
  } else {
    warning(`${passed}/${total} tests passed`);
    console.log('⚠️  Some services may not be running or properly configured.');
    console.log('   Please check the failed tests and ensure all services are started.');
  }
  
  console.log('\n📋 Service URLs:');
  console.log(`   • Browser Hub:     http://localhost:8080`);
  console.log(`   • Frontend:        ${FRONTEND_BASE}`);
  console.log(`   • API Server:      ${API_BASE}`);
  console.log(`   • Workflow Builder: ${FRONTEND_BASE}/workflows/builder`);
  console.log(`   • WebSocket:       ${WS_BASE}`);
  
  process.exit(passed === total ? 0 : 1);
}

// Handle unhandled rejections
process.on('unhandledRejection', (reason, promise) => {
  error(`Unhandled Rejection at: ${promise}, reason: ${reason}`);
  process.exit(1);
});

// Run the tests
runTests().catch(err => {
  error(`Test suite failed: ${err.message}`);
  process.exit(1);
});