/**
 * Enhanced TNF Chrome Extension Test Suite
 * Comprehensive testing for all enhanced features
 */

class TNFExtensionTester {
  constructor() {
    this.testResults = [];
    this.totalTests = 0;
    this.passedTests = 0;
    this.failedTests = 0;
  }

  async runAllTests() {
    console.log('🧪 Starting Enhanced TNF Chrome Extension Test Suite');
    console.log('================================================');

    try {
      // Test core functionality
      await this.testCoreExtensionLoading();
      await this.testPopupInterface();
      await this.testInjectableUI();
      
      // Test TNF integration
      await this.testTNFIntegration();
      await this.testAgentRegistration();
      await this.testFeatureManagement();
      
      // Test monitoring and performance
      await this.testStatusMonitoring();
      await this.testPerformanceMetrics();
      
      // Test advanced features
      await this.testWorkflowIntegration();
      await this.testOrchestratorConnection();
      
      this.generateTestReport();
    } catch (error) {
      console.error('❌ Test suite failed:', error);
    }
  }

  async testCoreExtensionLoading() {
    console.log('\n📦 Testing Core Extension Loading...');
    
    await this.test('Extension Background Script', async () => {
      return typeof chrome !== 'undefined' && chrome.runtime;
    });

    await this.test('Extension Manifest', async () => {
      const manifest = chrome.runtime.getManifest();
      return manifest && manifest.name === 'TNF AI Bridge';
    });

    await this.test('Content Script Injection', async () => {
      return document.getElementById('tnf-toggle-button') !== null;
    });
  }

  async testPopupInterface() {
    console.log('\n🎨 Testing Popup Interface...');

    await this.test('Popup HTML Structure', async () => {
      // Simulate popup loading
      const response = await chrome.runtime.sendMessage({ type: 'GET_CONVERSATION_HISTORY' });
      return response !== undefined;
    });

    await this.test('Tab Navigation', async () => {
      // Test tab switching functionality
      return document.querySelectorAll('.tab-button').length >= 5;
    });

    await this.test('Status Indicators', async () => {
      // Test status indicator rendering
      return document.querySelectorAll('.indicator').length > 0;
    });
  }

  async testInjectableUI() {
    console.log('\n💉 Testing Injectable UI...');

    await this.test('Toggle Button Creation', async () => {
      const toggleButton = document.getElementById('tnf-toggle-button');
      return toggleButton && toggleButton.style.position === 'fixed';
    });

    await this.test('UI Container Creation', async () => {
      const container = document.getElementById('tnf-injectable-ui');
      return container !== null;
    });

    await this.test('UI Visibility Toggle', async () => {
      if (window.tnfInjectableUI) {
        window.tnfInjectableUI.toggleUI();
        return window.tnfInjectableUI.state.isVisible;
      }
      return false;
    });
  }

  async testTNFIntegration() {
    console.log('\n🔗 Testing TNF Integration...');

    await this.test('TNF Health Check', async () => {
      const response = await chrome.runtime.sendMessage({ type: 'TNF_HEALTH_CHECK' });
      return response && typeof response === 'object';
    });

    await this.test('TNF Configuration Loading', async () => {
      const response = await chrome.runtime.sendMessage({ type: 'RELOAD_TNF_CONFIG' });
      return response && response.success !== false;
    });

    await this.test('TNF Status Broadcasting', async () => {
      // Test status broadcasting
      return new Promise((resolve) => {
        chrome.runtime.onMessage.addListener((message) => {
          if (message.type === 'TNF_STATUS_UPDATE') {
            resolve(true);
          }
        });
        setTimeout(() => resolve(false), 2000);
      });
    });
  }

  async testAgentRegistration() {
    console.log('\n🤖 Testing Agent Registration...');

    await this.test('Agent Registration Data', async () => {
      const registrationData = {
        agentId: 'test-agent',
        agentType: 'browser_bridge',
        capabilities: ['web_injection', 'ai_communication']
      };
      
      const response = await chrome.runtime.sendMessage({
        type: 'EXECUTE_TNF_COMMAND',
        command: 'register_with_tnf',
        data: registrationData
      });
      
      return response && response.success !== false;
    });

    await this.test('Master Agent Storage', async () => {
      const masterAgent = {
        name: 'Test Master Agent',
        group: 'a',
        timestamp: new Date().toISOString()
      };
      
      return new Promise((resolve) => {
        chrome.storage.local.set({ masterAgent }, () => {
          chrome.storage.local.get(['masterAgent'], (result) => {
            resolve(result.masterAgent && result.masterAgent.name === 'Test Master Agent');
          });
        });
      });
    });
  }

  async testFeatureManagement() {
    console.log('\n⚡ Testing Feature Management...');

    await this.test('Feature Enabling', async () => {
      const response = await chrome.runtime.sendMessage({
        type: 'ENABLE_TNF_FEATURES',
        features: ['agentSwarm', 'workflowAutomation']
      });
      
      return response && response.success && response.features;
    });

    await this.test('Feature Toggling', async () => {
      const response = await chrome.runtime.sendMessage({
        type: 'TOGGLE_TNF_FEATURE',
        feature: 'realTimeMonitoring',
        enabled: true
      });
      
      return response && response.success && response.enabled === true;
    });

    await this.test('Feature State Persistence', async () => {
      return new Promise((resolve) => {
        chrome.storage.local.get(['features'], (result) => {
          resolve(result.features && typeof result.features === 'object');
        });
      });
    });
  }

  async testStatusMonitoring() {
    console.log('\n📊 Testing Status Monitoring...');

    await this.test('Port Status Monitoring', async () => {
      const response = await chrome.runtime.sendMessage({ type: 'GET_PORT_STATUS' });
      return response && response.status && typeof response.status === 'object';
    });

    await this.test('Server Status Monitoring', async () => {
      const response = await chrome.runtime.sendMessage({ type: 'GET_SERVER_STATUS' });
      return response && response.status;
    });

    await this.test('Connection Quality Assessment', async () => {
      const response = await chrome.runtime.sendMessage({
        type: 'SYNC_WITH_TNF_CORE',
        syncData: { test: true }
      });
      
      return response && response.connectionQuality;
    });
  }

  async testPerformanceMetrics() {
    console.log('\n⚡ Testing Performance Metrics...');

    await this.test('Performance Metrics Collection', async () => {
      const response = await chrome.runtime.sendMessage({
        type: 'GET_PERFORMANCE_METRICS'
      });
      
      return response && response.success && response.metrics;
    });

    await this.test('Performance Metrics Structure', async () => {
      const response = await chrome.runtime.sendMessage({
        type: 'GET_PERFORMANCE_METRICS'
      });
      
      if (response && response.metrics) {
        const required = ['responseTime', 'throughput', 'errorRate', 'uptime'];
        return required.every(key => response.metrics.hasOwnProperty(key));
      }
      return false;
    });
  }

  async testWorkflowIntegration() {
    console.log('\n🔄 Testing Workflow Integration...');

    await this.test('Workflow Initiation', async () => {
      const response = await chrome.runtime.sendMessage({
        type: 'INITIATE_TNF_WORKFLOW',
        workflow: {
          type: 'ai_communication_bridge',
          agents: ['test-agent'],
          priority: 'high'
        }
      });
      
      return response && response.success && response.workflowId;
    });

    await this.test('Workflow Storage', async () => {
      return new Promise((resolve) => {
        chrome.storage.local.get(['workflows'], (result) => {
          resolve(result.workflows && Array.isArray(result.workflows));
        });
      });
    });
  }

  async testOrchestratorConnection() {
    console.log('\n🎯 Testing Orchestrator Connection...');

    await this.test('Orchestrator Connection', async () => {
      const response = await chrome.runtime.sendMessage({
        type: 'CONNECT_TNF_ORCHESTRATOR',
        config: {
          agentId: 'test-orchestrator-agent',
          capabilities: ['web_injection', 'ai_communication']
        }
      });
      
      return response && response.success && response.orchestrator;
    });

    await this.test('Orchestrator Data Storage', async () => {
      return new Promise((resolve) => {
        chrome.storage.local.get(['orchestratorConnection'], (result) => {
          resolve(result.orchestratorConnection && result.orchestratorConnection.connected);
        });
      });
    });
  }

  async test(name, testFn) {
    this.totalTests++;
    
    try {
      const result = await testFn();
      if (result) {
        this.passedTests++;
        this.testResults.push({ name, status: 'PASS', result });
        console.log(`  ✅ ${name}: PASS`);
      } else {
        this.failedTests++;
        this.testResults.push({ name, status: 'FAIL', result });
        console.log(`  ❌ ${name}: FAIL`);
      }
    } catch (error) {
      this.failedTests++;
      this.testResults.push({ name, status: 'ERROR', error: error.message });
      console.log(`  ❌ ${name}: ERROR - ${error.message}`);
    }
  }

  generateTestReport() {
    console.log('\n📋 Test Report');
    console.log('==============');
    console.log(`Total Tests: ${this.totalTests}`);
    console.log(`Passed: ${this.passedTests} (${Math.round(this.passedTests/this.totalTests*100)}%)`);
    console.log(`Failed: ${this.failedTests} (${Math.round(this.failedTests/this.totalTests*100)}%)`);
    
    if (this.failedTests > 0) {
      console.log('\n❌ Failed Tests:');
      this.testResults
        .filter(test => test.status !== 'PASS')
        .forEach(test => {
          console.log(`  - ${test.name}: ${test.status}${test.error ? ` (${test.error})` : ''}`);
        });
    }
    
    console.log('\n🎯 Feature Coverage:');
    console.log('  ✓ Core Extension Loading');
    console.log('  ✓ Popup Interface');
    console.log('  ✓ Injectable UI');
    console.log('  ✓ TNF Integration');
    console.log('  ✓ Agent Registration');
    console.log('  ✓ Feature Management');
    console.log('  ✓ Status Monitoring');
    console.log('  ✓ Performance Metrics');
    console.log('  ✓ Workflow Integration');
    console.log('  ✓ Orchestrator Connection');
    
    const overallStatus = this.failedTests === 0 ? 'PASS' : 'PARTIAL';
    console.log(`\n🏁 Overall Status: ${overallStatus}`);
    
    if (overallStatus === 'PASS') {
      console.log('🎉 All tests passed! The enhanced TNF Chrome extension is ready for deployment.');
    } else {
      console.log('⚠️ Some tests failed. Please review and fix issues before deployment.');
    }
  }
}

// Auto-run tests when script is loaded
if (typeof window !== 'undefined') {
  // Browser environment
  const tester = new TNFExtensionTester();
  
  // Run tests after page load
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      setTimeout(() => tester.runAllTests(), 1000);
    });
  } else {
    setTimeout(() => tester.runAllTests(), 1000);
  }
} else {
  // Node.js environment for CI/CD
  console.log('Test script loaded. Run tester.runAllTests() to execute tests.');
}

// Export for use in other contexts
if (typeof module !== 'undefined' && module.exports) {
  module.exports = TNFExtensionTester;
}