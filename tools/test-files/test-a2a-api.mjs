#!/usr/bin/env node

/**
 * Simple A2A API Test Script
 * Tests the A2A endpoints without relying on package imports
 */

import fetch from 'node-fetch';

const API_BASE_URL = 'http://localhost:3000/api';
const A2A_BASE_URL = `${API_BASE_URL}/a2a`;

async function testA2AAPI() {
  console.log('🚀 Testing A2A API Endpoints...\n');

  try {
    // Test 1: Health Check
    console.log('📋 Test 1: Health Check');
    const healthResponse = await fetch(`${A2A_BASE_URL}/health`);
    
    if (healthResponse.ok) {
      const healthData = await healthResponse.json();
      console.log('✅ Health check passed:', healthData);
    } else {
      console.log('❌ Health check failed:', healthResponse.status);
      return;
    }

    // Test 2: Agent Registration
    console.log('\n📋 Test 2: Agent Registration');
    const agentData = {
      agentId: 'test-agent-api',
      name: 'Test Agent via API',
      type: 'ASSISTANT',
      version: '1.0.0',
      description: 'Test agent registered via API',
      capabilities: ['chat', 'search'],
      endpoints: {
        webhook: 'http://localhost:3001/webhook'
      }
    };

    const registerResponse = await fetch(`${A2A_BASE_URL}/agents/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(agentData)
    });

    if (registerResponse.ok) {
      const registerData = await registerResponse.json();
      console.log('✅ Agent registration successful:', registerData);
    } else {
      const errorText = await registerResponse.text();
      console.log('❌ Agent registration failed:', registerResponse.status, errorText);
    }

    // Test 3: Agent Discovery
    console.log('\n🔍 Test 3: Agent Discovery');
    const discoveryResponse = await fetch(`${A2A_BASE_URL}/agents`);
    
    if (discoveryResponse.ok) {
      const agents = await discoveryResponse.json();
      console.log('✅ Agent discovery successful:', agents);
    } else {
      console.log('❌ Agent discovery failed:', discoveryResponse.status);
    }

    // Test 4: Message Sending
    console.log('\n💬 Test 4: Message Sending');
    const messageData = {
      fromAgentId: 'test-agent-api',
      toAgentId: 'test-agent-api', // Send to self for testing
      content: 'Hello from API test!',
      type: 'REQUEST',
      priority: 'MEDIUM'
    };

    const messageResponse = await fetch(`${A2A_BASE_URL}/messages/send`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(messageData)
    });

    if (messageResponse.ok) {
      const messageResult = await messageResponse.json();
      console.log('✅ Message sending successful:', messageResult);
    } else {
      const errorText = await messageResponse.text();
      console.log('❌ Message sending failed:', messageResponse.status, errorText);
    }

    console.log('\n🎉 A2A API tests completed!');

  } catch (error) {
    console.error('❌ Test failed with error:', error.message);
    console.log('\n💡 Make sure the API server is running on http://localhost:3000');
    console.log('💡 You can start it with: npm run dev:api');
  }
}

// Check if this script is being run directly
if (import.meta.url === `file://${process.argv[1]}`) {
  testA2AAPI();
}

export { testA2AAPI };
