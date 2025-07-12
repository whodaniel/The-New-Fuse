// content_script.js

// Listen for messages from the background script
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "injectText") {
    // NOTE: You must change this selector to target the correct input field on the webpage.
    const textInput = document.querySelector('div[role="textbox"] p'); 
    if (textInput) {
      textInput.textContent = request.text;
      textInput.dispatchEvent(new Event('input', { bubbles: true }));
      textInput.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', code: 'Enter', keyCode: 13, bubbles: true }));
    }
  } else if (request.action === "clickSend") {
    // NOTE: You must change this selector to target the correct button.
    const sendButton = document.querySelector('button[aria-label="Send message"]');
    if (sendButton) {
      sendButton.click();
    }
  } else if (request.action === "getText") {
      // NOTE: This is a simplified example. A MutationObserver (below) is a more robust way to get new text.
      const lastResponse = Array.from(document.querySelectorAll('[data-message-author-role="model"]')).pop();
      if(lastResponse){
          chrome.runtime.sendMessage({
              from: 'content',
              data: {
                  action: 'receiveText',
                  text: lastResponse.innerText
              }
          });
      }
  }
});

// A more robust method to watch for new AI responses on the page.
const observer = new MutationObserver((mutationsList, observer) => {
    for(const mutation of mutationsList) {
        if (mutation.type === 'childList' && mutation.addedNodes.length > 0) {
            mutation.addedNodes.forEach(node => {
                // NOTE: You must change this selector to identify the specific container of a new message.
                if (node.nodeType === 1 && node.matches('[data-message-author-role="model"]')) { // Targeting Gemini's model response
                     chrome.runtime.sendMessage({
                        from: 'content',
                        data: {
                            action: 'receiveText',
                            text: node.innerText
                        }
                    });
                }
            });
        }
    }
});

// NOTE: You must change this selector to target the main chat container.
const chatContainer = document.querySelector('main'); 
if (chatContainer) {
    observer.observe(chatContainer, { childList: true, subtree: true });
}