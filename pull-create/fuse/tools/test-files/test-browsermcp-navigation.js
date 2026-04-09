#!/usr/bin/env node

/**
 * Test script to validate BrowserMCP navigation functionality
 */

const WebSocket = require('ws');

console.log('🧪 Testing BrowserMCP Navigation Functionality...\n');

async function testBrowserMCPNavigation() {
  return new Promise((resolve, reject) => {
    console.log('🔌 Connecting to BrowserMCP server at ws://localhost:3025...');
    
    const ws = new WebSocket('ws://localhost:3025');
    const testResults = {
      connection: false,
      navigation: false,
      pageInteraction: false,
      screenshot: false
    };
    
    let testStep = 0;
    const tests = [
      {
        name: 'Navigation to google.com',
        command: { type: 'navigate', url: 'https://google.com' },
        expectedResponse: 'navigation_result'
      },
      {
        name: 'Click search button',
        command: { type: 'click', selector: 'input[name="btnK"]' },
        expectedResponse: 'click_result'
      },
      {
        name: 'Get page info',
        command: { type: 'get_page_info' },
        expectedResponse: 'response'
      },
      {
        name: 'Take screenshot',
        command: { type: 'screenshot' },
        expectedResponse: 'response'
      }
    ];
    
    ws.on('open', () => {
      console.log('✅ Connected to BrowserMCP server');
      testResults.connection = true;
      
      // Start first test after connection established message
      setTimeout(() => {
        runNextTest();
      }, 1000);
    });
    
    ws.on('message', (data) => {
      try {
        const message = JSON.parse(data.toString());
        console.log('📨 Received:', message.type, message.message || '');
        
        if (message.type === 'connection_established') {
          console.log('🎉 Server capabilities:', message.capabilities);
          return;
        }
        
        // Process test responses
        const currentTest = tests[testStep - 1];
        if (currentTest && message.type === currentTest.expectedResponse) {
          console.log(`✅ Test ${testStep}: ${currentTest.name} - SUCCESS`);
          
          // Mark specific tests as passed
          if (message.type === 'navigation_result') testResults.navigation = true;
          if (message.type === 'click_result') testResults.pageInteraction = true;
          if (message.type === 'response') {
            if (currentTest.command.type === 'screenshot') testResults.screenshot = true;
          }
          
          // Continue to next test
          runNextTest();
        }
      } catch (error) {
        console.error('❌ Error parsing message:', error);
      }
    });
    
    ws.on('close', () => {
      console.log('🔌 Disconnected from BrowserMCP server');
      resolve(testResults);
    });
    
    ws.on('error', (error) => {
      console.error('❌ WebSocket error:', error);
      reject(error);
    });
    
    function runNextTest() {
      if (testStep >= tests.length) {
        console.log('\n🏁 All tests completed!');
        ws.close();
        return;
      }
      
      const test = tests[testStep];
      console.log(`\n🚀 Running test ${testStep + 1}: ${test.name}`);
      console.log(`📤 Sending:`, test.command);
      
      ws.send(JSON.stringify(test.command));
      testStep++;
      
      // Timeout for each test
      setTimeout(() => {
        if (testStep <= tests.length) {
          runNextTest();
        }
      }, 3000);
    }
  });
}

async function main() {
  try {
    console.log('=' .repeat(60));
    console.log('🌐 BrowserMCP Navigation Test Suite');
    console.log('=' .repeat(60));
    
    const results = await testBrowserMCPNavigation();
    
    console.log('\n📊 TEST RESULTS SUMMARY:');
    console.log('=' .repeat(40));
    console.log(`🔌 Connection: ${results.connection ? '✅ PASS' : '❌ FAIL'}`);
    console.log(`🌐 Navigation: ${results.navigation ? '✅ PASS' : '❌ FAIL'}`);
    console.log(`👆 Page Interaction: ${results.pageInteraction ? '✅ PASS' : '❌ FAIL'}`);
    console.log(`📸 Screenshot: ${results.screenshot ? '✅ PASS' : '❌ FAIL'}`);
    
    const passedTests = Object.values(results).filter(Boolean).length;
    const totalTests = Object.keys(results).length;
    
    console.log(`\n🎯 Overall Score: ${passedTests}/${totalTests} tests passed`);
    
    if (results.connection && results.navigation) {
      console.log('\n🎉 BrowserMCP basic functionality is working!');
      console.log('✅ Ready for live browser automation');
    } else {
      console.log('\n⚠️  Some functionality needs attention');
    }
    
  } catch (error) {
    console.error('❌ Test suite failed:', error);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}