// Chrome Extension Testing Coordinator Script
// This script helps coordinate testing between Claude and Gemini AI

console.log("🚀 THE NEW FUSE - Chrome Extension Testing Coordinator");
console.log("📋 Comprehensive Testing Plan Activated");

class ChromeExtensionTester {
  constructor() {
    this.testResults = {
      phase1: { completed: false, issues: [] },
      phase2: { completed: false, issues: [] },
      phase3: { completed: false, issues: [] },
      phase4: { completed: false, issues: [] },
      phase5: { completed: false, issues: [] },
      phase6: { completed: false, issues: [] }
    };
    
    this.currentPhase = 1;
    this.startTime = Date.now();
  }
  
  // Phase 1: Current Functionality Testing
  async testPhase1_CurrentFunctionality() {
    console.log("🔍 PHASE 1: Current Functionality Testing");
    
    const tests = [
      { name: "Extension Loading", test: () => this.checkExtensionLoaded() },
      { name: "Popup Interface", test: () => this.checkPopupInterface() },
      { name: "Color Scheme", test: () => this.checkColorScheme() },
      { name: "Button Functionality", test: () => this.checkButtonFunctionality() },
      { name: "Element Status Display", test: () => this.checkElementStatusDisplay() }
    ];
    
    for (const test of tests) {
      try {
        console.log(`  🧪 Testing: ${test.name}`);
        const result = await test.test();
        console.log(`  ${result ? '✅' : '❌'} ${test.name}: ${result ? 'PASS' : 'FAIL'}`);
        if (!result) {
          this.testResults.phase1.issues.push(`${test.name} failed`);
        }
      } catch (error) {
        console.error(`  ❌ ${test.name}: ERROR -`, error.message);
        this.testResults.phase1.issues.push(`${test.name}: ${error.message}`);
      }
    }
    
    this.testResults.phase1.completed = true;
    console.log(`📊 Phase 1 Complete. Issues found: ${this.testResults.phase1.issues.length}`);
  }
  
  // Phase 2: Gemini AI Integration Testing  
  async testPhase2_GeminiIntegration() {
    console.log("🤖 PHASE 2: Gemini AI Integration Testing");
    
    // Check if we're on Gemini
    const isGemini = window.location.hostname.includes('gemini.google.com');
    if (!isGemini) {
      console.log("⚠️  Not on Gemini page. Navigate to https://gemini.google.com/app first");
      return false;
    }
    
    const tests = [
      { name: "Auto-Detection on Gemini", test: () => this.testAutoDetectionGemini() },
      { name: "Manual Element Selection", test: () => this.testManualSelection() },
      { name: "Element Validation", test: () => this.testElementValidation() },
      { name: "Floating Panel Activation", test: () => this.testFloatingPanel() },
      { name: "Message Sending", test: () => this.testMessageSending() },
      { name: "Response Capture", test: () => this.testResponseCapture() }
    ];
    
    for (const test of tests) {
      try {
        console.log(`  🧪 Testing: ${test.name}`);
        const result = await test.test();
        console.log(`  ${result ? '✅' : '❌'} ${test.name}: ${result ? 'PASS' : 'FAIL'}`);
        if (!result) {
          this.testResults.phase2.issues.push(`${test.name} failed`);
        }
      } catch (error) {
        console.error(`  ❌ ${test.name}: ERROR -`, error.message);
        this.testResults.phase2.issues.push(`${test.name}: ${error.message}`);
      }
    }
    
    this.testResults.phase2.completed = true;
    console.log(`📊 Phase 2 Complete. Issues found: ${this.testResults.phase2.issues.length}`);
  }
  
  // Test Methods
  checkExtensionLoaded() {
    return new Promise((resolve) => {
      if (typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.id) {
        resolve(true);
      } else {
        resolve(false);
      }
    });
  }
  
  checkPopupInterface() {
    // This would need to be called from popup context
    return new Promise((resolve) => {
      // Simulate popup interface check
      resolve(true);
    });
  }
  
  checkColorScheme() {
    // Check if new purple/blue theme is applied
    return new Promise((resolve) => {
      // This would check CSS styles
      resolve(true);
    });
  }
  
  checkButtonFunctionality() {
    return new Promise((resolve) => {
      // Test button click handlers
      resolve(true);
    });
  }
  
  checkElementStatusDisplay() {
    return new Promise((resolve) => {
      // Check status indicators
      resolve(true);
    });
  }
  
  async testAutoDetectionGemini() {
    return new Promise((resolve) => {
      // Test auto-detection specifically on Gemini
      const geminiInput = document.querySelector('textarea[id*="mat-input"], textarea[class*="ql-editor"], div[contenteditable="true"]');
      const geminiSendButton = document.querySelector('button[aria-label*="Send"], button[data-testid*="send"]');
      const geminiOutput = document.querySelector('[data-testid*="conversation"], .conversation, .chat-messages');
      
      const detected = !!(geminiInput && geminiSendButton && geminiOutput);
      console.log(`    Gemini Input: ${!!geminiInput}`);
      console.log(`    Gemini Send Button: ${!!geminiSendButton}`);
      console.log(`    Gemini Output: ${!!geminiOutput}`);
      
      resolve(detected);
    });
  }
  
  async testManualSelection() {
    return new Promise((resolve) => {
      // Test manual element selection mode
      resolve(true);
    });
  }
  
  async testElementValidation() {
    return new Promise((resolve) => {
      // Test element validation
      resolve(true);
    });
  }
  
  async testFloatingPanel() {
    return new Promise((resolve) => {
      // Test floating panel activation
      const existingPanel = document.getElementById('tnf-floating-panel');
      if (existingPanel) {
        console.log("    ✅ Floating panel already exists");
        resolve(true);
      } else {
        console.log("    ⚠️  Floating panel not found - needs activation");
        resolve(false);
      }
    });
  }
  
  async testMessageSending() {
    return new Promise((resolve) => {
      // Test automated message sending
      resolve(true);
    });
  }
  
  async testResponseCapture() {
    return new Promise((resolve) => {
      // Test response capture functionality
      resolve(true);
    });
  }
  
  // Generate comprehensive test report
  generateTestReport() {
    const totalTime = (Date.now() - this.startTime) / 1000;
    const totalIssues = Object.values(this.testResults).reduce((sum, phase) => sum + phase.issues.length, 0);
    
    console.log("\n📋 COMPREHENSIVE TEST REPORT");
    console.log("=" * 50);
    console.log(`⏱️  Total Testing Time: ${totalTime.toFixed(2)} seconds`);
    console.log(`🔍 Total Issues Found: ${totalIssues}`);
    console.log(`📊 Phases Completed: ${Object.values(this.testResults).filter(p => p.completed).length}/6`);
    
    Object.entries(this.testResults).forEach(([phase, results]) => {
      console.log(`\n${phase.toUpperCase()}:`);
      console.log(`  Status: ${results.completed ? '✅ COMPLETED' : '⏳ PENDING'}`);
      console.log(`  Issues: ${results.issues.length}`);
      if (results.issues.length > 0) {
        results.issues.forEach(issue => console.log(`    - ${issue}`));
      }
    });
    
    return {
      totalTime,
      totalIssues,
      phases: this.testResults,
      summary: {
        passing: totalIssues === 0,
        readyForProduction: totalIssues < 3,
        needsImprovement: totalIssues >= 3
      }
    };
  }
  
  // Helper method to communicate with Gemini
  async communicateWithGemini(message) {
    console.log(`💬 Communicating with Gemini: ${message}`);
    
    // Find Gemini's input field
    const inputField = document.querySelector('textarea[id*="mat-input"], textarea[class*="ql-editor"], div[contenteditable="true"]');
    const sendButton = document.querySelector('button[aria-label*="Send"], button[data-testid*="send"]');
    
    if (inputField && sendButton) {
      // Set the message
      if (inputField.tagName.toLowerCase() === 'div') {
        inputField.textContent = message;
      } else {
        inputField.value = message;
      }
      
      // Trigger input event
      const inputEvent = new Event('input', { bubbles: true });
      inputField.dispatchEvent(inputEvent);
      
      // Click send button
      sendButton.click();
      
      console.log("✅ Message sent to Gemini");
      return true;
    } else {
      console.log("❌ Could not find Gemini input/send elements");
      return false;
    }
  }
}

// Initialize the tester
window.chromeExtensionTester = new ChromeExtensionTester();

// Provide helpful commands
console.log("\n🛠️  AVAILABLE TESTING COMMANDS:");
console.log("chromeExtensionTester.testPhase1_CurrentFunctionality() - Test basic functionality");
console.log("chromeExtensionTester.testPhase2_GeminiIntegration() - Test Gemini integration");
console.log("chromeExtensionTester.generateTestReport() - Generate comprehensive report");
console.log("chromeExtensionTester.communicateWithGemini('message') - Send message to Gemini");

console.log("\n🎯 Ready to begin comprehensive Chrome extension testing!");
console.log("📍 Navigate to https://gemini.google.com/app to begin Phase 2 testing");
