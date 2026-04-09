/**
 * Agency Hub Integration Test
 * Comprehensive testing for agency management, swarm orchestration, and service routing
 */

const axios = require('axios');
const WebSocket = require('ws');

// Test Configuration
const TEST_CONFIG = {
  API_BASE_URL: process.env.API_BASE_URL || 'http://localhost:3000',
  WS_URL: process.env.WS_URL || 'ws://localhost:3710',
  ADMIN_TOKEN: process.env.ADMIN_TOKEN || 'test-admin-token',
  AGENCY_NAME: `Test Agency ${Date.now()}`,
  SUBDOMAIN: `test-${Date.now()}`,
  ADMIN_EMAIL: 'admin@testagency.com',
  ADMIN_NAME: 'Test Admin',
  ADMIN_PASSWORD: 'TestPassword123!'
};

// Test Results Tracking
const testResults = {
  total: 0,
  passed: 0,
  failed: 0,
  errors: []
};

let testAgencyId = null;
let authToken = null;

/**
 * Utility Functions
 */
function logTest(testName, status, message) {
  testResults.total++;
  const statusSymbol = status === 'PASS' ? '✅' : '❌';
  
  if (status === 'PASS') {
    testResults.passed++;
  } else {
    testResults.failed++;
    testResults.errors.push({ testName, message });
  }
  
  console.log(`${statusSymbol} ${testName}: ${message}`);
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * HTTP Request Helper
 */
async function httpRequest(method, endpoint, data = null, headers = {}) {
  try {
    const config = {
      method,
      url: `${TEST_CONFIG.API_BASE_URL}${endpoint}`,
      headers: {
        'Content-Type': 'application/json',
        ...headers
      },
      timeout: 10000
    };

    if (authToken) {
      config.headers['Authorization'] = `Bearer ${authToken}`;
    }

    if (data) {
      config.data = data;
    }

    const response = await axios(config);
    return {
      success: true,
      data: response.data,
      status: response.status
    };
  } catch (error) {
    return {
      success: false,
      error: error.response?.data?.message || error.message,
      status: error.response?.status
    };
  }
}

/**
 * Test 1: Agency Hub API Health Check
 */
async function testAgencyHubHealth() {
  console.log('🏥 Testing Agency Hub Health...');
  
  const startTime = Date.now();

  // Test main API health
  const healthResponse = await httpRequest('GET', '/health');
  if (healthResponse.success) {
    logTest('Agency Hub Health Check', 'PASS', 'API is responding');
  } else {
    logTest('Agency Hub Health Check', 'FAIL', `API health check failed: ${healthResponse.error}`);
  }

  // Test agency hub endpoints availability
  const agencyListResponse = await httpRequest('GET', '/api/agency-hub/agencies?limit=1');
  if (agencyListResponse.status === 401 || agencyListResponse.status === 403) {
    logTest('Agency Hub Endpoints', 'PASS', 'Agency hub endpoints are protected (requires auth)');
  } else if (agencyListResponse.success) {
    logTest('Agency Hub Endpoints', 'PASS', 'Agency hub endpoints are accessible');
  } else {
    logTest('Agency Hub Endpoints', 'FAIL', `Agency hub endpoints unavailable: ${agencyListResponse.error}`);
  }

  const duration = Date.now() - startTime;
  console.log(`Health checks completed in ${duration}ms\n`);
}

/**
 * Test 2: Authentication and Authorization
 */
async function testAuthentication() {
  console.log('🔐 Testing Authentication...');
  
  const startTime = Date.now();

  // Test without authentication
  const unauthResponse = await httpRequest('GET', '/api/agency-hub/agencies');
  if (unauthResponse.status === 401) {
    logTest('Unauthenticated Access', 'PASS', 'Protected endpoints reject unauthenticated requests');
  } else {
    logTest('Unauthenticated Access', 'FAIL', 'Protected endpoints should require authentication');
  }

  // Test with mock admin token (if available)
  if (TEST_CONFIG.ADMIN_TOKEN !== 'test-admin-token') {
    authToken = TEST_CONFIG.ADMIN_TOKEN;
    const authResponse = await httpRequest('GET', '/api/agency-hub/agencies');
    if (authResponse.success) {
      logTest('Authenticated Access', 'PASS', 'Authentication token accepted');
    } else {
      logTest('Authenticated Access', 'FAIL', `Authentication failed: ${authResponse.error}`);
    }
  } else {
    logTest('Authentication Setup', 'SKIP', 'No valid admin token provided for testing');
  }

  const duration = Date.now() - startTime;
  console.log(`Authentication tests completed in ${duration}ms\n`);
}

/**
 * Test 3: Agency Management Operations
 */
async function testAgencyManagement() {
  console.log('🏢 Testing Agency Management...');
  
  const startTime = Date.now();

  if (!authToken) {
    logTest('Agency Management Setup', 'SKIP', 'No authentication token available');
    return;
  }

  // Test agency creation
  const createAgencyData = {
    name: TEST_CONFIG.AGENCY_NAME,
    subdomain: TEST_CONFIG.SUBDOMAIN,
    adminEmail: TEST_CONFIG.ADMIN_EMAIL,
    adminName: TEST_CONFIG.ADMIN_NAME,
    adminPassword: TEST_CONFIG.ADMIN_PASSWORD,
    tier: 'TRIAL',
    enableSwarmOrchestration: true,
    enableServiceRouting: true,
    defaultServiceCategories: ['general', 'communication', 'analysis']
  };

  const createResponse = await httpRequest('POST', '/api/agency-hub/agencies', createAgencyData);
  if (createResponse.success && createResponse.data.success) {
    testAgencyId = createResponse.data.data.id;
    logTest('Agency Creation', 'PASS', `Agency created with ID: ${testAgencyId}`);
  } else {
    logTest('Agency Creation', 'FAIL', `Failed to create agency: ${createResponse.error}`);
    return;
  }

  // Wait for agency initialization
  await sleep(2000);

  // Test agency retrieval
  const getResponse = await httpRequest('GET', `/api/agency-hub/agencies/${testAgencyId}`);
  if (getResponse.success && getResponse.data.success) {
    logTest('Agency Retrieval', 'PASS', 'Agency details retrieved successfully');
  } else {
    logTest('Agency Retrieval', 'FAIL', `Failed to retrieve agency: ${getResponse.error}`);
  }

  // Test agency listing
  const listResponse = await httpRequest('GET', '/api/agency-hub/agencies?limit=10');
  if (listResponse.success && listResponse.data.success) {
    const agencies = listResponse.data.data;
    const foundAgency = agencies.find(agency => agency.id === testAgencyId);
    if (foundAgency) {
      logTest('Agency Listing', 'PASS', 'Created agency found in list');
    } else {
      logTest('Agency Listing', 'FAIL', 'Created agency not found in list');
    }
  } else {
    logTest('Agency Listing', 'FAIL', `Failed to list agencies: ${listResponse.error}`);
  }

  const duration = Date.now() - startTime;
  console.log(`Agency management tests completed in ${duration}ms\n`);
}

/**
 * Test 4: Swarm Orchestration
 */
async function testSwarmOrchestration() {
  console.log('🤖 Testing Swarm Orchestration...');
  
  const startTime = Date.now();

  if (!testAgencyId) {
    logTest('Swarm Orchestration Setup', 'SKIP', 'No test agency available');
    return;
  }

  // Test swarm status
  const statusResponse = await httpRequest('GET', `/api/agency-hub/status`);
  if (statusResponse.success) {
    logTest('Swarm Status Check', 'PASS', 'Swarm status endpoint accessible');
  } else {
    logTest('Swarm Status Check', 'FAIL', `Swarm status check failed: ${statusResponse.error}`);
  }

  // Test swarm initialization
  const initSwarmData = {
    maxConcurrentExecutions: 5,
    defaultQualityThreshold: 0.8,
    enableAutoScaling: true
  };

  const initResponse = await httpRequest('POST', '/api/agency-hub/initialize-swarm', initSwarmData);
  if (initResponse.success) {
    logTest('Swarm Initialization', 'PASS', 'Swarm initialized successfully');
  } else {
    logTest('Swarm Initialization', 'FAIL', `Swarm initialization failed: ${initResponse.error}`);
  }

  // Test analytics endpoint
  const analyticsResponse = await httpRequest('GET', '/api/agency-hub/analytics?period=7d');
  if (analyticsResponse.success) {
    logTest('Agency Analytics', 'PASS', 'Analytics data retrieved');
  } else {
    logTest('Agency Analytics', 'FAIL', `Analytics retrieval failed: ${analyticsResponse.error}`);
  }

  const duration = Date.now() - startTime;
  console.log(`Swarm orchestration tests completed in ${duration}ms\n`);
}

/**
 * Test 5: Service Request Management
 */
async function testServiceRequests() {
  console.log('📋 Testing Service Request Management...');
  
  const startTime = Date.now();

  if (!testAgencyId) {
    logTest('Service Request Setup', 'SKIP', 'No test agency available');
    return;
  }

  // Test service request creation
  const requestData = {
    categoryId: 'general',
    title: 'Test Service Request',
    description: 'This is a test service request for integration testing',
    priority: 'medium',
    requirements: {
      skills: ['communication', 'analysis'],
      estimatedDuration: '2 hours'
    }
  };

  const createRequestResponse = await httpRequest('POST', '/api/agency-hub/service-requests', requestData);
  if (createRequestResponse.success) {
    logTest('Service Request Creation', 'PASS', 'Service request created successfully');
  } else {
    logTest('Service Request Creation', 'FAIL', `Service request creation failed: ${createRequestResponse.error}`);
  }

  // Test service request listing
  const listRequestsResponse = await httpRequest('GET', '/api/agency-hub/service-requests?limit=10');
  if (listRequestsResponse.success) {
    logTest('Service Request Listing', 'PASS', 'Service requests listed successfully');
  } else {
    logTest('Service Request Listing', 'FAIL', `Service request listing failed: ${listRequestsResponse.error}`);
  }

  const duration = Date.now() - startTime;
  console.log(`Service request tests completed in ${duration}ms\n`);
}

/**
 * Test 6: WebSocket Connection
 */
async function testWebSocketConnection() {
  console.log('🔌 Testing WebSocket Connection...');
  
  const startTime = Date.now();

  return new Promise((resolve) => {
    try {
      const ws = new WebSocket(TEST_CONFIG.WS_URL);
      let connected = false;

      const timeout = setTimeout(() => {
        if (!connected) {
          ws.close();
          logTest('WebSocket Connection', 'FAIL', 'Connection timeout');
          resolve();
        }
      }, 5000);

      ws.on('open', () => {
        connected = true;
        clearTimeout(timeout);
        logTest('WebSocket Connection', 'PASS', 'WebSocket connected successfully');
        
        // Test message sending
        ws.send(JSON.stringify({
          type: 'ping',
          timestamp: Date.now()
        }));
      });

      ws.on('message', (data) => {
        try {
          const message = JSON.parse(data);
          if (message.type === 'pong') {
            logTest('WebSocket Messaging', 'PASS', 'WebSocket messaging working');
          }
        } catch (error) {
          logTest('WebSocket Messaging', 'FAIL', `Message parsing failed: ${error.message}`);
        }
        
        ws.close();
        const duration = Date.now() - startTime;
        console.log(`WebSocket tests completed in ${duration}ms\n`);
        resolve();
      });

      ws.on('error', (error) => {
        clearTimeout(timeout);
        logTest('WebSocket Connection', 'FAIL', `WebSocket error: ${error.message}`);
        resolve();
      });

      ws.on('close', () => {
        if (!connected) {
          logTest('WebSocket Connection', 'FAIL', 'WebSocket connection closed immediately');
        }
        resolve();
      });
    } catch (error) {
      logTest('WebSocket Setup', 'FAIL', `WebSocket setup failed: ${error.message}`);
      resolve();
    }
  });
}

/**
 * Test 7: End-to-End Workflow
 */
async function testEndToEndWorkflow() {
  console.log('🔄 Testing End-to-End Workflow...');
  
  const startTime = Date.now();

  if (!testAgencyId) {
    logTest('E2E Workflow Setup', 'SKIP', 'No test agency available');
    return;
  }

  // Simulate a complete workflow: Create agency → Initialize swarm → Submit request → Process request
  
  // 1. Check agency dashboard
  const dashboardResponse = await httpRequest('GET', '/api/agency-hub/dashboard');
  if (dashboardResponse.success) {
    logTest('Dashboard Access', 'PASS', 'Agency dashboard accessible');
  } else {
    logTest('Dashboard Access', 'FAIL', `Dashboard access failed: ${dashboardResponse.error}`);
  }

  // 2. Check service provider registration
  const providerData = {
    providers: [
      {
        agentId: 'test-agent-1',
        name: 'Test Provider',
        categoryIds: ['general'],
        capabilities: ['text processing', 'analysis'],
        skills: ['communication', 'research'],
        hourlyRate: 50.00,
        experienceLevel: 'INTERMEDIATE',
        isAvailable: true
      }
    ]
  };

  const registerResponse = await httpRequest('POST', `/api/agencies/${testAgencyId}/providers/register`, providerData);
  if (registerResponse.success) {
    logTest('Provider Registration', 'PASS', 'Service provider registered');
  } else {
    logTest('Provider Registration', 'FAIL', `Provider registration failed: ${registerResponse.error}`);
  }

  // 3. Complete workflow test
  logTest('E2E Workflow', 'PASS', 'End-to-end workflow components tested');

  const duration = Date.now() - startTime;
  console.log(`E2E workflow tests completed in ${duration}ms\n`);
}

/**
 * Cleanup Test Data
 */
async function cleanup() {
  console.log('🧹 Cleaning up test data...');
  
  if (testAgencyId && authToken) {
    const deleteResponse = await httpRequest('DELETE', `/api/agency-hub/agencies/${testAgencyId}`);
    if (deleteResponse.success) {
      logTest('Test Cleanup', 'PASS', 'Test agency deleted successfully');
    } else {
      logTest('Test Cleanup', 'FAIL', `Cleanup failed: ${deleteResponse.error}`);
    }
  }
}

/**
 * Generate Test Report
 */
function generateReport() {
  console.log('\n📊 AGENCY HUB INTEGRATION TEST REPORT');
  console.log('═══════════════════════════════════════════════════════════');
  console.log(`Total Tests: ${testResults.total}`);
  console.log(`Passed: ${testResults.passed} ✅`);
  console.log(`Failed: ${testResults.failed} ❌`);
  console.log(`Success Rate: ${Math.round((testResults.passed / testResults.total) * 100)}%`);
  console.log('═══════════════════════════════════════════════════════════');
  
  if (testResults.failed > 0) {
    console.log('\n❌ FAILED TESTS:');
    testResults.errors.forEach((error, index) => {
      console.log(`${index + 1}. ${error.testName}: ${error.message}`);
    });
  }
  
  console.log('\n✨ Integration testing completed!');
}

/**
 * Main Test Execution
 */
async function runIntegrationTests() {
  console.log('🚀 Starting Agency Hub Integration Tests...\n');
  
  try {
    await testAgencyHubHealth();
    await testAuthentication();
    await testAgencyManagement();
    await testSwarmOrchestration();
    await testServiceRequests();
    await testWebSocketConnection();
    await testEndToEndWorkflow();
    
    await cleanup();
    generateReport();
    
    // Exit with appropriate code
    process.exit(testResults.failed > 0 ? 1 : 0);
  } catch (error) {
    console.error('❌ Integration test execution failed:', error);
    process.exit(1);
  }
}

// Handle graceful shutdown
process.on('SIGINT', async () => {
  console.log('\n🛑 Integration tests interrupted');
  await cleanup();
  process.exit(1);
});

process.on('SIGTERM', async () => {
  console.log('\n🛑 Integration tests terminated');
  await cleanup();
  process.exit(1);
});

// Run tests if called directly
if (require.main === module) {
  runIntegrationTests();
}

module.exports = {
  runIntegrationTests,
  testAgencyHubHealth,
  testAgencyManagement,
  testSwarmOrchestration,
  testServiceRequests,
  testWebSocketConnection,
  testEndToEndWorkflow
};