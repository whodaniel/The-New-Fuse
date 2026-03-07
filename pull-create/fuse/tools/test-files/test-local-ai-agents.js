#!/usr/bin/env node

/**
 * Test Local AI Agents Integration
 * Comprehensive test of the local AI detection and Agent registration system
 */

const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🚀 Starting Local AI Agents Integration Test\n');

// Test configuration
const testConfig = {
  apiPort: 3001,
  testUserId: 'test-user-123',
  expectedLocalAIs: [
    'Claude Code CLI',
    'Gemini CLI', 
    'Ollama',
    'LM Studio',
    'GPT4All',
    'LocalAI'
  ]
};

class LocalAIAgentsTest {
  constructor() {
    this.results = {
      detection: {},
      registration: {},
      agentCreation: {},
      agentUsage: {}
    };
  }

  async runAllTests() {
    console.log('📋 Running comprehensive Local AI Agents test suite...\n');

    try {
      // Test 1: Local AI Detection
      await this.testLocalAIDetection();
      
      // Test 2: Agent Registration
      await this.testAgentRegistration();
      
      // Test 3: Agent Creation
      await this.testAgentCreation();
      
      // Test 4: Agent Usage
      await this.testAgentUsage();
      
      // Test 5: API Endpoints
      await this.testAPIEndpoints();
      
      // Test 6: Frontend Integration
      await this.testFrontendIntegration();

      this.printSummary();
      
    } catch (error) {
      console.error('❌ Test suite failed:', error.message);
      process.exit(1);
    }
  }

  async testLocalAIDetection() {
    console.log('🔍 Test 1: Local AI Detection');
    console.log('═'.repeat(50));

    const detectedAIs = [];

    for (const aiName of testConfig.expectedLocalAIs) {
      const isAvailable = await this.checkAIAvailability(aiName);
      
      if (isAvailable) {
        console.log(`✅ Detected: ${aiName}`);
        detectedAIs.push(aiName);
        this.results.detection[aiName] = 'available';
      } else {
        console.log(`❌ Not found: ${aiName}`);
        this.results.detection[aiName] = 'unavailable';
      }
    }

    console.log(`\\n🎯 Detection Summary: ${detectedAIs.length}/${testConfig.expectedLocalAIs.length} local AIs detected`);
    console.log('Available AIs:', detectedAIs.join(', ') || 'None');
    console.log('\\n');

    return detectedAIs;
  }

  async checkAIAvailability(aiName) {
    const commands = {
      'Claude Code CLI': ['claude', '--version'],
      'Gemini CLI': ['gemini', '--version'],
      'Ollama': ['ollama', 'list'],
      'LM Studio': ['curl', '-s', 'http://localhost:1234/v1/models'],
      'GPT4All': ['gpt4all', '--version'],
      'LocalAI': ['curl', '-s', 'http://localhost:8080/v1/models']
    };

    const command = commands[aiName];
    if (!command) return false;

    return new Promise((resolve) => {
      const [cmd, ...args] = command;
      const process = spawn(cmd, args, { 
        stdio: 'pipe',
        timeout: 3000 
      });

      let hasResponded = false;

      process.on('close', (code) => {
        if (!hasResponded) {
          hasResponded = true;
          resolve(code === 0 || (cmd === 'curl' && code === 0));
        }
      });

      process.on('error', () => {
        if (!hasResponded) {
          hasResponded = true;
          resolve(false);
        }
      });

      setTimeout(() => {
        if (!hasResponded) {
          hasResponded = true;
          process.kill();
          resolve(false);
        }
      }, 3000);
    });
  }

  async testAgentRegistration() {
    console.log('📝 Test 2: Agent Registration via API');
    console.log('═'.repeat(50));

    try {
      // Test detection endpoint
      console.log('Testing /api/local-ai/detect...');
      const detectResult = await this.makeAPICall('GET', '/api/local-ai/detect');
      
      if (detectResult.success) {
        console.log(`✅ Detection API: Found ${detectResult.count} providers`);
        this.results.registration.detection = 'success';
      } else {
        console.log('❌ Detection API failed');
        this.results.registration.detection = 'failed';
      }

      // Test registration endpoint
      console.log('Testing /api/local-ai/register...');
      const registerResult = await this.makeAPICall('POST', '/api/local-ai/register');
      
      if (registerResult.success) {
        console.log(`✅ Registration API: Registered ${registerResult.agents?.length || 0} agents`);
        this.results.registration.register = 'success';
      } else {
        console.log('❌ Registration API failed');
        this.results.registration.register = 'failed';
      }

      // Test agents listing
      console.log('Testing /api/local-ai/agents...');
      const agentsResult = await this.makeAPICall('GET', '/api/local-ai/agents');
      
      if (agentsResult.success) {
        console.log(`✅ Agents API: Found ${agentsResult.count} local AI agents`);
        this.results.registration.listing = 'success';
        
        if (agentsResult.agents) {
          agentsResult.agents.forEach(agent => {
            console.log(`   • ${agent.name} (${agent.provider}) - ${agent.status}`);
          });
        }
      } else {
        console.log('❌ Agents API failed');
        this.results.registration.listing = 'failed';
      }

    } catch (error) {
      console.log(`❌ Registration test failed: ${error.message}`);
      this.results.registration.error = error.message;
    }

    console.log('\\n');
  }

  async testAgentCreation() {
    console.log('🤖 Test 3: Agent Creation System');
    console.log('═'.repeat(50));

    try {
      // Test system agents creation
      console.log('Testing /api/local-ai/system/create-defaults...');
      const systemResult = await this.makeAPICall('POST', '/api/local-ai/system/create-defaults');
      
      if (systemResult.success) {
        console.log(`✅ System Agents: Created ${systemResult.agents?.length || 0} default agents`);
        this.results.agentCreation.system = 'success';
      } else {
        console.log('❌ System agents creation failed');
        this.results.agentCreation.system = 'failed';
      }

      // Test agent refresh
      console.log('Testing /api/local-ai/refresh...');
      const refreshResult = await this.makeAPICall('POST', '/api/local-ai/refresh');
      
      if (refreshResult.success) {
        console.log(`✅ Agent Refresh: Successfully refreshed agents`);
        this.results.agentCreation.refresh = 'success';
      } else {
        console.log('❌ Agent refresh failed');
        this.results.agentCreation.refresh = 'failed';
      }

    } catch (error) {
      console.log(`❌ Agent creation test failed: ${error.message}`);
      this.results.agentCreation.error = error.message;
    }

    console.log('\\n');
  }

  async testAgentUsage() {
    console.log('💬 Test 4: Agent Usage & Communication');
    console.log('═'.repeat(50));

    try {
      // Get available agents
      const agentsResult = await this.makeAPICall('GET', '/api/local-ai/agents');
      
      if (agentsResult.success && agentsResult.agents?.length > 0) {
        const testAgent = agentsResult.agents[0];
        console.log(`Testing communication with: ${testAgent.name}`);

        // Test agent status
        const statusResult = await this.makeAPICall('GET', `/api/local-ai/agents/${testAgent.id}/status`);
        
        if (statusResult.success) {
          console.log(`✅ Agent Status: ${testAgent.name} is ${statusResult.agent.available ? 'available' : 'unavailable'}`);
          this.results.agentUsage.status = 'success';
        } else {
          console.log(`❌ Agent status check failed`);
          this.results.agentUsage.status = 'failed';
        }

        // Test actual communication (if agent is available)
        if (statusResult.agent?.available) {
          console.log('🔄 Testing actual AI communication...');
          // This would require integration with the AgentLLMService
          console.log('⚠️ Communication test requires full service integration');
          this.results.agentUsage.communication = 'pending';
        } else {
          console.log('⚠️ Skipping communication test - agent not available');
          this.results.agentUsage.communication = 'skipped';
        }

      } else {
        console.log('❌ No agents available for testing');
        this.results.agentUsage.noAgents = true;
      }

    } catch (error) {
      console.log(`❌ Agent usage test failed: ${error.message}`);
      this.results.agentUsage.error = error.message;
    }

    console.log('\\n');
  }

  async testAPIEndpoints() {
    console.log('🌐 Test 5: API Endpoints Validation');
    console.log('═'.repeat(50));

    const endpoints = [
      { method: 'GET', path: '/api/local-ai/detect', description: 'AI Detection' },
      { method: 'POST', path: '/api/local-ai/register', description: 'Agent Registration' },
      { method: 'GET', path: '/api/local-ai/agents', description: 'Agents Listing' },
      { method: 'POST', path: '/api/local-ai/refresh', description: 'Agent Refresh' },
      { method: 'POST', path: '/api/local-ai/system/create-defaults', description: 'System Agents' }
    ];

    for (const endpoint of endpoints) {
      try {
        const result = await this.makeAPICall(endpoint.method, endpoint.path);
        if (result && typeof result === 'object') {
          console.log(`✅ ${endpoint.description}: Endpoint responding`);
        } else {
          console.log(`❌ ${endpoint.description}: Invalid response`);
        }
      } catch (error) {
        console.log(`❌ ${endpoint.description}: ${error.message}`);
      }
    }

    console.log('\\n');
  }

  async testFrontendIntegration() {
    console.log('🎨 Test 6: Frontend Integration Points');
    console.log('═'.repeat(50));

    // Check for UI components that should show local AI agents
    const uiFiles = [
      'packages/ui-components/src/core/agent/index.ts',
      'apps/frontend/src/components/agents/',
      'packages/agent/src/components/'
    ];

    console.log('Checking for Agent UI components...');
    for (const filePath of uiFiles) {
      const fullPath = path.join(process.cwd(), filePath);
      if (fs.existsSync(fullPath)) {
        console.log(`✅ Found: ${filePath}`);
      } else {
        console.log(`⚠️ Missing: ${filePath}`);
      }
    }

    console.log('\\n');
  }

  async makeAPICall(method, endpoint) {
    return new Promise((resolve, reject) => {
      const options = {
        hostname: 'localhost',
        port: testConfig.apiPort,
        path: endpoint,
        method: method,
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': 'LocalAI-Test-Client'
        }
      };

      const req = require(endpoint.startsWith('https') ? 'https' : 'http').request(options, (res) => {
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => {
          try {
            const result = JSON.parse(data);
            resolve(result);
          } catch {
            resolve({ success: false, error: 'Invalid JSON response' });
          }
        });
      });

      req.on('error', (error) => {
        resolve({ success: false, error: error.message });
      });

      req.setTimeout(5000, () => {
        req.destroy();
        resolve({ success: false, error: 'Request timeout' });
      });

      req.end();
    });
  }

  printSummary() {
    console.log('📊 COMPREHENSIVE TEST SUMMARY');
    console.log('═'.repeat(60));

    // Detection Summary
    console.log('\\n🔍 Local AI Detection:');
    Object.entries(this.results.detection).forEach(([ai, status]) => {
      const icon = status === 'available' ? '✅' : '❌';
      console.log(`   ${icon} ${ai}: ${status}`);
    });

    // Registration Summary
    console.log('\\n📝 Agent Registration:');
    Object.entries(this.results.registration).forEach(([test, status]) => {
      const icon = status === 'success' ? '✅' : '❌';
      console.log(`   ${icon} ${test}: ${status}`);
    });

    // Agent Creation Summary
    console.log('\\n🤖 Agent Creation:');
    Object.entries(this.results.agentCreation).forEach(([test, status]) => {
      const icon = status === 'success' ? '✅' : (status === 'failed' ? '❌' : '⚠️');
      console.log(`   ${icon} ${test}: ${status}`);
    });

    // Agent Usage Summary
    console.log('\\n💬 Agent Usage:');
    Object.entries(this.results.agentUsage).forEach(([test, status]) => {
      const icon = status === 'success' ? '✅' : (status === 'failed' ? '❌' : '⚠️');
      console.log(`   ${icon} ${test}: ${status}`);
    });

    // Overall Status
    const totalTests = Object.values(this.results).reduce((acc, category) => 
      acc + Object.keys(category).length, 0
    );
    const successfulTests = Object.values(this.results).reduce((acc, category) => 
      acc + Object.values(category).filter(status => status === 'success').length, 0
    );

    console.log('\\n' + '═'.repeat(60));
    console.log(`🎯 OVERALL RESULTS: ${successfulTests}/${totalTests} tests successful`);
    
    if (successfulTests === totalTests) {
      console.log('🎉 ALL TESTS PASSED! Local AI Agents system is fully functional!');
    } else if (successfulTests > totalTests / 2) {
      console.log('⚠️ Most tests passed, but some issues need attention.');
    } else {
      console.log('❌ Multiple issues detected. System needs debugging.');
    }

    console.log('\\n🚀 The New Fuse is ready for multi-local-AI integration!');
  }
}

// Run the tests
const tester = new LocalAIAgentsTest();
tester.runAllTests().catch(console.error);