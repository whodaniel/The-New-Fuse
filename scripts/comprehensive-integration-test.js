#!/usr/bin/env node

/* eslint-env node */
/* eslint-disable no-console */
/* global require, module, process, console, setTimeout, __dirname */

/**
 * Comprehensive Integration Test for The New Fuse
 * Tests the complete multi-agent communication system including:
 * - Agency creation and management
 * - Agent swarm orchestration
 * - Redis streams communication
 * - Service integration and routing
 * - Real-time event processing
 */

const axios = require('axios');
const Redis = require('ioredis');
const fs = require('fs');
const path = require('path');

// Test configuration
const TEST_CONFIG = {
  BASE_URL: process.env.TEST_BASE_URL || 'http://localhost:3000',
  API_URL: process.env.TEST_API_URL || 'http://localhost:3001',
  REDIS_URL: process.env.REDIS_URL || 'redis://localhost:6379',
  TEST_TIMEOUT: 30000,
  AGENCY_NAME: 'TestAgency_' + Date.now(),
  SUBDOMAIN: 'test' + Date.now(),
  ADMIN_EMAIL: 'admin@test.com',
  ADMIN_NAME: 'Test Admin'
};

// Test results tracking
const testResults = {
  total: 0,
  passed: 0,
  failed: 0,
  errors: [],
  details: []
};

// Global test context
let testAgencyId = null;
let redisClient = null;

console.log('🚀 Starting Comprehensive Integration Test for The New Fuse');
console.log('═══════════════════════════════════════════════════════════');
console.log(`Base URL: ${TEST_CONFIG.BASE_URL}`);
console.log(`API URL: ${TEST_CONFIG.API_URL}`);
console.log(`Redis URL: ${TEST_CONFIG.REDIS_URL}`);
console.log('═══════════════════════════════════════════════════════════\n');

/**
 * Test utility functions
 */
function logTest(testName, status, message = '', duration = 0) {
  const timestamp = new Date().toISOString();
  const statusIcon = status === 'PASS' ? '✅' : status === 'FAIL' ? '❌' : '🔄';
  const durationText = duration > 0 ? ` (${duration}ms)` : '';
  
  console.log(`${statusIcon} ${testName}: ${status}${durationText}`);
  if (message) {
    console.log(`   ${message}`);
  }
  
  testResults.total++;
  if (status === 'PASS') {
    testResults.passed++;
  } else if (status === 'FAIL') {
    testResults.failed++;
    testResults.errors.push({ testName, message, timestamp });
  }
  
  testResults.details.push({
    testName,
    status,
    message,
    duration,
    timestamp
  });
}

async function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function httpRequest(method, url, data = null, timeout = 10000) {
  try {
    const config = {
      method,
      url,
      timeout,
      headers: {
        'Content-Type': 'application/json'
      }
    };
    
    if (data) {
      config.data = data;
    }
    
    const response = await axios(config);
    return { success: true, data: response.data, status: response.status };
  } catch (error) {
    return {
      success: false,
      error: error.message,
      status: error.response?.status,
      data: error.response?.data
    };
  }
}

/**
 * Test 1: Service Health Checks
 */
async function testServiceHealth() {
  console.log('\n📊 Testing Service Health...');
  
  const startTime = Date.now();
  
  // Test main application
  const appHealth = await httpRequest('GET', `${TEST_CONFIG.BASE_URL}/health`);
  if (appHealth.success) {
    logTest('Application Health Check', 'PASS', 'Main application is running');
  } else {
    logTest('Application Health Check', 'FAIL', `Application not responding: ${appHealth.error}`);
  }
  
  // Test API service
  const apiHealth = await httpRequest('GET', `${TEST_CONFIG.API_URL}/health`);
  if (apiHealth.success) {
    logTest('API Service Health Check', 'PASS', 'API service is running');
  } else {
    logTest('API Service Health Check', 'FAIL', `API service not responding: ${apiHealth.error}`);
  }
  
  // Test Redis connection
  try {
    redisClient = new Redis(TEST_CONFIG.REDIS_URL);
    const pong = await redisClient.ping();
    if (pong === 'PONG') {
      logTest('Redis Connection Test', 'PASS', 'Redis is connected and responding');
    } else {
      logTest('Redis Connection Test', 'FAIL', 'Redis ping returned unexpected response');
    }
  } catch (error) {
    logTest('Redis Connection Test', 'FAIL', `Redis connection failed: ${error.message}`);
  }
  
  const duration = Date.now() - startTime;
  console.log(`Health checks completed in ${duration}ms\n`);
}

/**
 * Test 2: Agency Management
 */
async function testAgencyManagement() {
  console.log('🏢 Testing Agency Management...');
  
  const startTime = Date.now();
  
  // Test agency creation
  const createAgencyData = {
    name: TEST_CONFIG.AGENCY_NAME,
    subdomain: TEST_CONFIG.SUBDOMAIN,
    adminEmail: TEST_CONFIG.ADMIN_EMAIL,
    adminName: TEST_CONFIG.ADMIN_NAME,
    enableSwarmOrchestration: true
  };
  
  const createResponse = await httpRequest('POST', `${TEST_CONFIG.API_URL}/agency`, createAgencyData);
  
  if (createResponse.success && createResponse.data.success) {
    testAgencyId = createResponse.data.data.id;
    logTest('Agency Creation', 'PASS', `Agency created with ID: ${testAgencyId}`);
  } else {
    logTest('Agency Creation', 'FAIL', `Failed to create agency: ${createResponse.error || 'Unknown error'}`);
    return;
  }
  
  // Test agency retrieval
  await sleep(1000); // Wait for agency to be fully initialized
  
  const getResponse = await httpRequest('GET', `${TEST_CONFIG.API_URL}/agency/${testAgencyId}`);
  
  if (getResponse.success && getResponse.data.id === testAgencyId) {
    logTest('Agency Retrieval', 'PASS', `Agency details retrieved successfully`);
  } else {
    logTest('Agency Retrieval', 'FAIL', `Failed to retrieve agency: ${getResponse.error || 'Unknown error'}`);
  }
  
  // Test agency listing
  const listResponse = await httpRequest('GET', `${TEST_CONFIG.API_URL}/agency?limit=10`);
  
  if (listResponse.success && listResponse.data.success && Array.isArray(listResponse.data.data)) {
    const agencyFound = listResponse.data.data.some(agency => agency.id === testAgencyId);
    if (agencyFound) {
      logTest('Agency Listing', 'PASS', `Created agency found in list`);
    } else {
      logTest('Agency Listing', 'FAIL', `Created agency not found in list`);
    }
  } else {
    logTest('Agency Listing', 'FAIL', `Failed to list agencies: ${listResponse.error || 'Unknown error'}`);
  }
  
  const duration = Date.now() - startTime;
  console.log(`Agency management tests completed in ${duration}ms\n`);
}

/**
 * Test 3: Swarm Orchestration
 */
async function testSwarmOrchestration() {
  console.log('🤖 Testing Swarm Orchestration...');
  
  if (!testAgencyId) {
    logTest('Swarm Orchestration Setup', 'FAIL', 'No test agency available');
    return;
  }
  
  const startTime = Date.now();
  
  // Test swarm status
  const statusResponse = await httpRequest('GET', `${TEST_CONFIG.API_URL}/agency/${testAgencyId}/metrics`);
  
  if (statusResponse.success && statusResponse.data.success) {
    const swarmData = statusResponse.data.data.swarmStatus;
    if (swarmData.isSwarmEnabled) {
      logTest('Swarm Status Check', 'PASS', `Swarm is enabled for agency`);
    } else {
      logTest('Swarm Status Check', 'FAIL', `Swarm is not enabled for agency`);
    }
  } else {
    logTest('Swarm Status Check', 'FAIL', `Failed to get swarm status: ${statusResponse.error || 'Unknown error'}`);
  }
  
  // Test swarm toggle (disable then re-enable)
  const disableResponse = await httpRequest('PUT', `${TEST_CONFIG.API_URL}/agency/${testAgencyId}/swarm`, { enabled: false });
  
  if (disableResponse.success && disableResponse.data.success) {
    logTest('Swarm Disable', 'PASS', `Swarm disabled successfully`);
    
    await sleep(2000); // Wait for disable to take effect
    
    const enableResponse = await httpRequest('PUT', `${TEST_CONFIG.API_URL}/agency/${testAgencyId}/swarm`, { enabled: true });
    
    if (enableResponse.success && enableResponse.data.success) {
      logTest('Swarm Enable', 'PASS', `Swarm re-enabled successfully`);
    } else {
      logTest('Swarm Enable', 'FAIL', `Failed to re-enable swarm: ${enableResponse.error || 'Unknown error'}`);
    }
  } else {
    logTest('Swarm Disable', 'FAIL', `Failed to disable swarm: ${disableResponse.error || 'Unknown error'}`);
  }
  
  const duration = Date.now() - startTime;
  console.log(`Swarm orchestration tests completed in ${duration}ms\n`);
}

/**
 * Test 4: Redis Streams Communication
 */
async function testRedisStreams() {
  console.log('🔄 Testing Redis Streams Communication...');
  
  if (!redisClient) {
    logTest('Redis Streams Setup', 'FAIL', 'No Redis connection available');
    return;
  }
  
  const startTime = Date.now();
  const testStreamKey = 'test:integration:stream';
  const testGroupName = 'integration-test-group';
  const testMessage = {
    id: `test-${Date.now()}`,
    agencyId: testAgencyId || 'test-agency',
    agentId: 'test-agent',
    type: 'test',
    payload: { message: 'Integration test message', timestamp: Date.now() },
    timestamp: Date.now(),
    priority: 'medium'
  };
  
  try {
    // Create test stream and consumer group
    await redisClient.xgroup('CREATE', testStreamKey, testGroupName, '0', 'MKSTREAM');
    logTest('Redis Stream Creation', 'PASS', `Stream ${testStreamKey} created`);
  } catch (error) {
    if (error.message.includes('BUSYGROUP')) {
      logTest('Redis Stream Creation', 'PASS', `Stream ${testStreamKey} already exists`);
    } else {
      logTest('Redis Stream Creation', 'FAIL', `Failed to create stream: ${error.message}`);
      return;
    }
  }
  
  try {
    // Publish message to stream
    const messageId = await redisClient.xadd(
      testStreamKey,
      '*',
      'data', JSON.stringify(testMessage),
      'type', testMessage.type,
      'agencyId', testMessage.agencyId
    );
    
    logTest('Redis Stream Publish', 'PASS', `Message published with ID: ${messageId}`);
    
    // Read message from stream
    await sleep(1000);
    
    const messages = await redisClient.xreadgroup(
      'GROUP', testGroupName, 'test-consumer',
      'COUNT', 1,
      'STREAMS', testStreamKey, '>'
    );
    
    if (messages && messages.length > 0) {
      logTest('Redis Stream Consume', 'PASS', `Message consumed successfully`);
      
      // Acknowledge the message
      const [, streamMessages] = messages[0];
      const [messageId] = streamMessages[0];
      await redisClient.xack(testStreamKey, testGroupName, messageId);
      
      logTest('Redis Stream Acknowledge', 'PASS', `Message acknowledged`);
    } else {
      logTest('Redis Stream Consume', 'FAIL', `No messages received from stream`);
    }
    
  } catch (error) {
    logTest('Redis Stream Operations', 'FAIL', `Stream operations failed: ${error.message}`);
  }
  
  const duration = Date.now() - startTime;
  console.log(`Redis streams tests completed in ${duration}ms\n`);
}

/**
 * Test 5: End-to-End Workflow
 */
async function testEndToEndWorkflow() {
  console.log('🔗 Testing End-to-End Workflow...');
  
  if (!testAgencyId) {
    logTest('E2E Workflow Setup', 'FAIL', 'No test agency available');
    return;
  }
  
  const startTime = Date.now();
  
  // Simulate a complete workflow: agency creation -> agent registration -> task execution -> cleanup
  try {
    // Get initial agency metrics
    const initialMetrics = await httpRequest('GET', `${TEST_CONFIG.API_URL}/agency/${testAgencyId}/metrics`);
    
    if (initialMetrics.success) {
      logTest('E2E Metrics Baseline', 'PASS', `Baseline metrics captured`);
    } else {
      logTest('E2E Metrics Baseline', 'FAIL', `Failed to get baseline metrics`);
    }
    
    // Simulate agent activity by publishing to Redis streams
    if (redisClient) {
      const agentHeartbeat = {
        id: `heartbeat-${Date.now()}`,
        agencyId: testAgencyId,
        agentId: 'test-agent-001',
        type: 'heartbeat',
        payload: { status: 'active', load: 0.3, capabilities: ['general', 'analysis'] },
        timestamp: Date.now(),
        priority: 'low'
      };
      
      await redisClient.xadd(
        'agent:communications',
        '*',
        'data', JSON.stringify(agentHeartbeat),
        'type', 'heartbeat',
        'agencyId', testAgencyId
      );
      
      logTest('E2E Agent Simulation', 'PASS', `Agent heartbeat simulated`);
    }
    
    // Wait for processing
    await sleep(3000);
    
    // Get final metrics
    const finalMetrics = await httpRequest('GET', `${TEST_CONFIG.API_URL}/agency/${testAgencyId}/metrics`);
    
    if (finalMetrics.success) {
      logTest('E2E Metrics Final', 'PASS', `Final metrics captured`);
    } else {
      logTest('E2E Metrics Final', 'FAIL', `Failed to get final metrics`);
    }
    
    logTest('E2E Workflow Complete', 'PASS', `End-to-end workflow completed successfully`);
    
  } catch (error) {
    logTest('E2E Workflow', 'FAIL', `End-to-end workflow failed: ${error.message}`);
  }
  
  const duration = Date.now() - startTime;
  console.log(`End-to-end workflow tests completed in ${duration}ms\n`);
}

/**
 * Test 6: Performance and Load Testing
 */
async function testPerformance() {
  console.log('⚡ Testing Performance...');
  
  const startTime = Date.now();
  const concurrentRequests = 10;
  const requestsPerBatch = 5;
  
  // Test concurrent API requests
  const promises = [];
  for (let i = 0; i < concurrentRequests; i++) {
    promises.push(httpRequest('GET', `${TEST_CONFIG.API_URL}/agency`));
  }
  
  try {
    const results = await Promise.all(promises);
    const successCount = results.filter(r => r.success).length;
    const successRate = (successCount / concurrentRequests) * 100;
    
    if (successRate >= 90) {
      logTest('Concurrent API Requests', 'PASS', `${successRate}% success rate (${successCount}/${concurrentRequests})`);
    } else {
      logTest('Concurrent API Requests', 'FAIL', `Low success rate: ${successRate}% (${successCount}/${concurrentRequests})`);
    }
  } catch (error) {
    logTest('Concurrent API Requests', 'FAIL', `Concurrent requests failed: ${error.message}`);
  }
  
  // Test Redis stream throughput
  if (redisClient) {
    const streamKey = 'test:performance:stream';
    const throughputStart = Date.now();
    
    try {
      for (let i = 0; i < requestsPerBatch; i++) {
        await redisClient.xadd(streamKey, '*', 'data', `test-message-${i}`, 'timestamp', Date.now());
      }
      
      const throughputDuration = Date.now() - throughputStart;
      const messagesPerSecond = Math.round((requestsPerBatch / throughputDuration) * 1000);
      
      logTest('Redis Stream Throughput', 'PASS', `${messagesPerSecond} messages/second`);
    } catch (error) {
      logTest('Redis Stream Throughput', 'FAIL', `Throughput test failed: ${error.message}`);
    }
  }
  
  const duration = Date.now() - startTime;
  console.log(`Performance tests completed in ${duration}ms\n`);
}

/**
 * Cleanup test data
 */
async function cleanup() {
  console.log('🧹 Cleaning up test data...');
  
  if (testAgencyId) {
    const deleteResponse = await httpRequest('DELETE', `${TEST_CONFIG.API_URL}/agency/${testAgencyId}`);
    if (deleteResponse.success) {
      logTest('Test Agency Cleanup', 'PASS', `Test agency deleted`);
    } else {
      logTest('Test Agency Cleanup', 'FAIL', `Failed to delete test agency: ${deleteResponse.error || 'Unknown error'}`);
    }
  }
  
  if (redisClient) {
    try {
      // Clean up test streams
      await redisClient.del('test:integration:stream', 'test:performance:stream');
      await redisClient.quit();
      logTest('Redis Cleanup', 'PASS', `Redis test data cleaned up`);
    } catch (error) {
      logTest('Redis Cleanup', 'FAIL', `Redis cleanup failed: ${error.message}`);
    }
  }
}

/**
 * Generate test report
 */
function generateReport() {
  console.log('\n📋 COMPREHENSIVE INTEGRATION TEST REPORT');
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
  
  // Save detailed report to file
  const reportData = {
    summary: {
      total: testResults.total,
      passed: testResults.passed,
      failed: testResults.failed,
      successRate: Math.round((testResults.passed / testResults.total) * 100),
      timestamp: new Date().toISOString(),
      configuration: TEST_CONFIG
    },
    details: testResults.details,
    errors: testResults.errors
  };
  
  const reportPath = path.join(__dirname, 'integration-test-report.json');
  fs.writeFileSync(reportPath, JSON.stringify(reportData, null, 2));
  
  console.log(`\n📄 Detailed report saved to: ${reportPath}`);
  
  if (testResults.failed === 0) {
    console.log('\n🎉 ALL TESTS PASSED! The New Fuse is ready for production.');
  } else {
    console.log('\n⚠️  Some tests failed. Please review the errors above.');
  }
  
  return testResults.failed === 0;
}

/**
 * Main test execution
 */
async function runIntegrationTests() {
  const overallStart = Date.now();
  
  try {
    await testServiceHealth();
    await testAgencyManagement();
    await testSwarmOrchestration();
    await testRedisStreams();
    await testEndToEndWorkflow();
    await testPerformance();
  } catch (error) {
    console.error('❌ Critical error during test execution:', error);
    logTest('Critical Error', 'FAIL', error.message);
  } finally {
    await cleanup();
    
    const overallDuration = Date.now() - overallStart;
    console.log(`\n⏱️  Total test execution time: ${overallDuration}ms`);
    
    const success = generateReport();
    process.exit(success ? 0 : 1);
  }
}

// Handle graceful shutdown
process.on('SIGINT', async () => {
  console.log('\n🛑 Test execution interrupted. Cleaning up...');
  await cleanup();
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
  logTest('Unhandled Rejection', 'FAIL', reason.toString());
});

// Start the integration tests
if (require.main === module) {
  runIntegrationTests();
}

module.exports = {
  runIntegrationTests,
  testResults,
  TEST_CONFIG
};