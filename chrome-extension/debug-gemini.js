/**
 * Debug script for Gemini selectors
 * Run this in browser console on Gemini to find correct selectors
 */

console.log('🔍 Gemini Selector Debug Tool');
console.log('Current URL:', window.location.href);

// Test various input selectors
const inputSelectors = [
  'div[contenteditable="true"]',
  'textarea[placeholder*="prompt"]',
  'div[role="textbox"]',
  'textarea[aria-label*="prompt"]',
  'div[aria-label*="prompt"]',
  'textarea',
  'div[contenteditable]',
  '[data-testid*="input"]',
  '[placeholder*="prompt"]',
  '[placeholder*="here"]',
  'textbox',
  'input[type="text"]'
];

console.log('\n📝 Testing Gemini input selectors:');
inputSelectors.forEach(selector => {
  try {
    const elements = document.querySelectorAll(selector);
    console.log(`${selector}: ${elements.length} elements found`);
    if (elements.length > 0) {
      elements.forEach((el, i) => {
        console.log(`  → Element ${i}:`, el);
        console.log(`    - Tag: ${el.tagName}`);
        console.log(`    - Placeholder: ${el.placeholder || 'none'}`);
        console.log(`    - Aria-label: ${el.getAttribute('aria-label') || 'none'}`);
        console.log(`    - ID: ${el.id || 'none'}`);
        console.log(`    - Classes: ${el.className || 'none'}`);
        console.log(`    - Content: "${el.textContent?.substring(0, 50) || 'none'}"`);
      });
    }
  } catch (e) {
    console.log(`${selector}: Error - ${e.message}`);
  }
});

// Test button selectors
const buttonSelectors = [
  'button[aria-label="Send message"]',
  'button[aria-label*="Send"]',
  'button[data-testid="send-button"]',
  'button[type="submit"]',
  'button:contains("Send")',
  'button[title*="Send"]',
  'button svg[aria-label*="Send"]',
  'button[aria-label*="submit"]'
];

console.log('\n🔘 Testing Gemini button selectors:');
buttonSelectors.forEach(selector => {
  try {
    const elements = document.querySelectorAll(selector);
    console.log(`${selector}: ${elements.length} elements found`);
    if (elements.length > 0) {
      elements.forEach((el, i) => {
        console.log(`  → Button ${i}:`, el);
        console.log(`    - Text: "${el.textContent?.trim() || 'none'}"`);
        console.log(`    - Aria-label: ${el.getAttribute('aria-label') || 'none'}`);
        console.log(`    - Disabled: ${el.disabled}`);
        console.log(`    - Type: ${el.type || 'none'}`);
      });
    }
  } catch (e) {
    console.log(`${selector}: Error - ${e.message}`);
  }
});

// Find the actual input element by looking for common patterns
console.log('\n🎯 Finding actual input element:');
let foundInput = null;

// Look for textbox role
const textboxes = document.querySelectorAll('[role="textbox"]');
console.log(`Found ${textboxes.length} textbox elements`);
textboxes.forEach((el, i) => {
  console.log(`Textbox ${i}:`, el);
  if (el.getAttribute('placeholder')?.includes('prompt')) {
    foundInput = el;
    console.log('✅ Found input with prompt placeholder!');
  }
});

// Look for textarea with prompt
const textareas = document.querySelectorAll('textarea');
console.log(`Found ${textareas.length} textarea elements`);
textareas.forEach((el, i) => {
  console.log(`Textarea ${i}:`, el);
  console.log(`  - Placeholder: ${el.placeholder}`);
  if (el.placeholder?.includes('prompt')) {
    foundInput = el;
    console.log('✅ Found textarea with prompt placeholder!');
  }
});

// Look for contenteditable
const editables = document.querySelectorAll('[contenteditable="true"]');
console.log(`Found ${editables.length} contenteditable elements`);
editables.forEach((el, i) => {
  console.log(`Contenteditable ${i}:`, el);
  console.log(`  - Text: "${el.textContent?.trim()}"`);
});

if (foundInput) {
  console.log('\n✅ Best input element found:', foundInput);
  console.log('Testing injection...');
  
  // Test injection
  const testMessage = 'Debug test message';
  foundInput.focus();
  
  if (foundInput.tagName === 'TEXTAREA') {
    foundInput.value = testMessage;
    foundInput.dispatchEvent(new Event('input', { bubbles: true }));
  } else {
    foundInput.textContent = testMessage;
    foundInput.dispatchEvent(new Event('input', { bubbles: true }));
  }
  
  console.log('✅ Test message injected');
  
  // Look for send button after injection
  setTimeout(() => {
    const sendButtons = document.querySelectorAll('button[aria-label*="Send"]');
    console.log(`Found ${sendButtons.length} send buttons after injection`);
    sendButtons.forEach((btn, i) => {
      console.log(`Send button ${i}:`, btn);
      console.log(`  - Aria-label: ${btn.getAttribute('aria-label')}`);
      console.log(`  - Disabled: ${btn.disabled}`);
      console.log(`  - Text: "${btn.textContent?.trim()}"`);
    });
    
    if (sendButtons.length > 0) {
      window.debugSendButton = sendButtons[0];
      console.log('✅ Send button available at window.debugSendButton');
      console.log('To test: window.debugSendButton.click()');
    }
  }, 1000);
  
  window.debugInput = foundInput;
  console.log('✅ Input available at window.debugInput');
} else {
  console.log('❌ No suitable input element found');
}

// Export debug tools
window.debugGemini = {
  inputSelectors,
  buttonSelectors,
  foundInput,
  testInjection: (message) => {
    if (window.debugInput) {
      window.debugInput.focus();
      if (window.debugInput.tagName === 'TEXTAREA') {
        window.debugInput.value = message;
        window.debugInput.dispatchEvent(new Event('input', { bubbles: true }));
      } else {
        window.debugInput.textContent = message;
        window.debugInput.dispatchEvent(new Event('input', { bubbles: true }));
      }
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
console.log('- window.debugGemini.testInjection("your message")');
console.log('- window.debugGemini.testSend()');
console.log('- window.debugInput');
console.log('- window.debugSendButton');