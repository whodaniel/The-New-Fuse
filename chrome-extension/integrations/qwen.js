// Qwen chat integration
class QwenIntegration {
  constructor() {
    this.messageObserver = null;
    this.chatContainer = null;
  }

  initialize() {
    this.findChatContainer();
    if (this.chatContainer) {
      this.setupMessageObserver();
      this.injectExtractButtons();
    }
  }

  findChatContainer() {
    // Find the main chat container (adjust selectors as needed)
    this.chatContainer = document.querySelector('.chat-messages, .message-list');
  }

  setupMessageObserver() {
    // Watch for new messages and inject buttons
    this.messageObserver = new MutationObserver((mutations) => {
      mutations.forEach(mutation => {
        mutation.addedNodes.forEach(node => {
          if (node.nodeType === Node.ELEMENT_NODE && 
              node.classList.contains('message')) {
            this.processMessageNode(node);
          }
        });
      });
    });

    this.messageObserver.observe(this.chatContainer, {
      childList: true,
      subtree: true
    });
  }

  processMessageNode(messageNode) {
    // Only process AI responses
    if (!messageNode.classList.contains('assistant')) return;

    // Find code blocks
    const codeBlocks = messageNode.querySelectorAll('pre code');
    codeBlocks.forEach(code => {
      window.TheFuse.domUtils.injectButton(code, {
        icon: '📋',
        title: 'Send code to VSCode',
        position: 'before',
        onClick: () => this.handleCodeExtraction(code)
      });
    });

    // Find the main message text
    const messageText = messageNode.querySelector('.message-content');
    if (messageText) {
      window.TheFuse.domUtils.injectButton(messageText, {
        icon: '🔗',
        title: 'Send to VSCode',
        position: 'after',
        onClick: () => this.handleMessageExtraction(messageText)
      });
    }
  }

  handleCodeExtraction(codeElement) {
    const code = codeElement.textContent;
    
    chrome.runtime.sendMessage({
      type: 'CODE_INPUT',
      code: code
    });

    window.TheFuse.domUtils.injectNotification('Code sent to VSCode');
    window.TheFuse.MessageLogger.log({
      type: 'code_extraction',
      content: code,
      source: 'qwen'
    });
  }

  handleMessageExtraction(messageElement) {
    const text = messageElement.textContent;
    
    chrome.runtime.sendMessage({
      type: 'TO_RELAY',
      data: {
        text,
        source: 'qwen',
        timestamp: new Date().toISOString()
      }
    });

    window.TheFuse.domUtils.injectNotification('Message sent to VSCode');
    window.TheFuse.MessageLogger.log({
      type: 'message_extraction',
      content: text,
      source: 'qwen'
    });
  }

  injectExtractButtons() {
    // Add extract buttons to existing messages
    const messages = this.chatContainer.querySelectorAll('.message.assistant');
    messages.forEach(message => this.processMessageNode(message));
  }

  cleanup() {
    if (this.messageObserver) {
      this.messageObserver.disconnect();
    }
  }
}

// Export integration
window.TheFuse = window.TheFuse || {};
window.TheFuse.QwenIntegration = new QwenIntegration();