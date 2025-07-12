/**
 * Debug script to test ChatGPT selectors
 * Run this in the browser console on ChatGPT to test selectors
 */

console.log('🔍 ChatGPT Selector Debug Tool');

// Test input selectors
const inputSelectors = [
  '#prompt-textarea',
  'div[contenteditable="true"]',
  'p[contenteditable="true"]',
  'textarea',
  '[role="textbox"]'
];

console.log('\n📝 Testing input selectors:');
inputSelectors.forEach(selector => {
  const elements = document.querySelectorAll(selector);
  console.log(`${selector}: ${elements.length} elements found`);
  if (elements.length > 0) {
    console.log('  → First element:', elements[0]);
  }
});

// Test send button selectors
const buttonSelectors = [
  'button[data-testid="send-button"]',
  'button[aria-label="Send prompt"]',
  'button[type="submit"]',
  'button:has(svg)'
];

console.log('\n🔘 Testing send button selectors:');
buttonSelectors.forEach(selector => {
  try {
    const elements = document.querySelectorAll(selector);
    console.log(`${selector}: ${elements.length} elements found`);
    if (elements.length > 0) {
      console.log('  → First element:', elements[0]);
      console.log('  → Disabled?', elements[0].disabled);
    }
  } catch (e) {
    console.log(`${selector}: Error - ${e.message}`);
  }
});

// Test injection
console.log('\n💉 Testing message injection:');
const testMessage = 'Test message from debug script';

// Find best input element
let inputElement = null;
for (const selector of inputSelectors) {
  const element = document.querySelector(selector);
  if (element) {
    inputElement = element;
    console.log(`✅ Using input selector: ${selector}`);
    break;
  }
}

if (inputElement) {
  // Clear and set content
  inputElement.focus();
  
  if (inputElement.tagName === 'TEXTAREA') {
    inputElement.value = testMessage;
    inputElement.dispatchEvent(new Event('input', { bubbles: true }));
  } else {
    inputElement.textContent = testMessage;
    inputElement.dispatchEvent(new Event('input', { bubbles: true }));
  }
  
  console.log('✅ Message injected successfully');
  
  // Find and test send button
  let sendButton = null;
  for (const selector of buttonSelectors) {
    try {
      const element = document.querySelector(selector);
      if (element && !element.disabled) {
        sendButton = element;
        console.log(`✅ Using send button: ${selector}`);
        break;
      }
    } catch (e) {
      // Skip invalid selectors
    }
  }
  
  if (sendButton) {
    console.log('🔘 Send button found and ready');
    console.log('   To test clicking, run: sendButton.click()');
    
    // Store for manual testing
    window.debugSendButton = sendButton;
    window.debugInputElement = inputElement;
  } else {
    console.log('❌ No enabled send button found');
  }
} else {
  console.log('❌ No input element found');
}

// Export for testing
window.debugChatGPT = {
  inputSelectors,
  buttonSelectors,
  inputElement,
  sendButton: window.debugSendButton,
  testInjection: (message) => {
    if (window.debugInputElement) {
      window.debugInputElement.textContent = message;
      window.debugInputElement.dispatchEvent(new Event('input', { bubbles: true }));
      console.log('Message injected:', message);
    }
  },
  testSend: () => {
    if (window.debugSendButton) {
      window.debugSendButton.click();
      console.log('Send button clicked');
    }
  }
};

console.log('\n🎯 Debug tools available:');
console.log('- window.debugChatGPT.testInjection("your message")');
console.log('- window.debugChatGPT.testSend()');
console.log('- window.debugInputElement');
console.log('- window.debugSendButton');