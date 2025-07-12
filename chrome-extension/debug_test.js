// Debug test script to check if content script is loaded
console.log('🔍 Debug test: Checking if content script is loaded...');

// Check if content script exists
if (window.tnfAIContentScript) {
  console.log('✅ Content script is loaded');
} else {
  console.log('❌ Content script is NOT loaded');
}

// Check if injectable UI exists
if (window.tnfInjectableUI) {
  console.log('✅ Injectable UI is loaded');
} else {
  console.log('❌ Injectable UI is NOT loaded');
}

// Test message sending
function testMessageSending() {
  console.log('🧪 Testing message sending...');
  
  chrome.runtime.sendMessage({
    type: 'SEND_TO_RELAY',
    payload: {
      type: 'AI_AUTOMATION_REQUEST',
      automation: 'inject_message',
      payload: {
        targetAI: 'gemini',
        content: 'Test message from debug script',
        conversationId: `debug-${Date.now()}`,
        source: 'debug-test'
      }
    }
  }, (response) => {
    console.log('📬 Message send response:', response);
  });
}

// Wait for DOM to be ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', testMessageSending);
} else {
  testMessageSending();
}