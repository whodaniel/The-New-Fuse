/**
 * TNF Chrome Extension - Chat Interface Component
 * Modular chat interface with reactive state management
 */

import { UI_CONFIG, TIMEOUTS } from '../config/constants.js';
import { handleError, withErrorBoundary } from '../utils/ErrorHandler.js';
import { getState, subscribe, addConversationMessage, clearConversationHistory } from '../utils/StateManager.js';

class ChatInterface {
  constructor(container) {
    this.container = container;
    this.unsubscribe = null;
    this.renderThrottle = null;
    this.expandedMessages = new Set();
    
    this.init();
  }

  /**
   * Initialize chat interface
   */
  init() {
    this.render();
    this.setupEventListeners();
    this.subscribeToState();
  }

  /**
   * Subscribe to state changes
   */
  subscribeToState() {
    this.unsubscribe = subscribe((newState, prevState) => {
      // Only re-render if conversation history changed
      if (newState.conversations.history !== prevState.conversations?.history) {
        this.throttledRender();
      }
    }, ['conversations.history']);
  }

  /**
   * Throttled rendering for performance
   */
  throttledRender() {
    if (this.renderThrottle) {
      clearTimeout(this.renderThrottle);
    }
    
    this.renderThrottle = setTimeout(() => {
      this.render();
      this.renderThrottle = null;
    }, TIMEOUTS.RENDER_THROTTLE);
  }

  /**
   * Render chat interface
   */
  render = withErrorBoundary(() => {
    const state = getState();
    const { conversations } = state;
    
    this.container.innerHTML = `
      <div class="chat-interface">
        ${this.renderConversationSection(conversations)}
        ${this.renderInputSection(state)}
      </div>
    `;
    
    this.attachEventListeners();
  }, { component: 'ChatInterface', method: 'render' });

  /**
   * Render conversation history section
   */
  renderConversationSection(conversations) {
    return `
      <div class="conversation-section">
        <div class="section-title">
          <span>Conversation History</span>
          <span class="message-count">${conversations.history.length}</span>
        </div>
        <div class="chat-log" id="tnf-chat-log">
          ${this.renderMessages(conversations.history)}
        </div>
        <div class="button-group">
          <button class="button button-secondary" id="tnf-clear-history-btn">
            Clear History
          </button>
          <button class="button button-secondary" id="tnf-refresh-btn">
            Refresh
          </button>
          <button class="button button-secondary" id="tnf-export-btn">
            Export
          </button>
        </div>
      </div>
    `;
  }

  /**
   * Render messages in chat log
   */
  renderMessages(messages) {
    if (messages.length === 0) {
      return '<div class="no-messages">No conversation yet.</div>';
    }

    return messages.map(msg => this.renderMessage(msg)).join('');
  }

  /**
   * Render individual message
   */
  renderMessage(msg) {
    const timestamp = this.formatTimestamp(msg.timestamp);
    const messageType = this.getMessageType(msg.source);
    const senderName = this.getSenderDisplayName(msg.source);
    const { displayContent, isCollapsed } = this.processMessageContent(msg.content, msg.id);
    
    return `
      <div class="chat-message ${messageType}" data-message-id="${msg.id}">
        <div class="message-header">
          <div class="message-sender-info">
            <span class="message-sender">${senderName}</span>
            ${this.renderMessageMetadata(msg)}
          </div>
          <span class="message-timestamp">${timestamp}</span>
        </div>
        <div class="message-content" ${isCollapsed ? `data-full-content="${this.escapeHTML(msg.content)}"` : ''}>
          ${displayContent}
          ${isCollapsed ? this.renderExpandButton(msg.id) : ''}
        </div>
        ${this.renderMessageActions(msg)}
      </div>
    `;
  }

  /**
   * Render message metadata badges
   */
  renderMessageMetadata(msg) {
    let badges = '';
    
    if (msg.metadata?.score) {
      const quality = msg.metadata.score >= 0.8 ? 'high' : 
                     msg.metadata.score >= 0.6 ? 'medium' : 'low';
      badges += `<span class="quality-badge quality-${quality}">${quality}</span>`;
    }
    
    if (msg.type === 'AI_RESPONSE_ENHANCED') {
      badges += '<span class="enhanced-badge">Enhanced</span>';
    }
    
    return badges;
  }

  /**
   * Render expand button for collapsed messages
   */
  renderExpandButton(messageId) {
    return `
      <br>
      <button class="expand-btn" data-message-id="${messageId}">
        Show More
      </button>
    `;
  }

  /**
   * Render message actions
   */
  renderMessageActions(msg) {
    return `
      <div class="message-actions">
        <button class="action-btn copy-btn" data-message-id="${msg.id}" title="Copy message">
          📋
        </button>
        <button class="action-btn retry-btn" data-message-id="${msg.id}" title="Retry message" ${msg.source === 'human-popup' ? '' : 'style="display: none;"'}>
          🔄
        </button>
      </div>
    `;
  }

  /**
   * Process message content for display
   */
  processMessageContent(content, messageId) {
    if (!content) return { displayContent: '', isCollapsed: false };
    
    // Handle object content
    if (typeof content === 'object') {
      content = JSON.stringify(content, null, 2);
    }
    
    const maxLength = 500;
    const isExpanded = this.expandedMessages.has(messageId);
    
    if (content.length <= maxLength || isExpanded) {
      return { 
        displayContent: this.formatMessageContent(content), 
        isCollapsed: false 
      };
    }
    
    const truncated = content.substring(0, maxLength) + '...';
    return { 
      displayContent: this.formatMessageContent(truncated), 
      isCollapsed: true 
    };
  }

  /**
   * Format message content with proper escaping and line breaks
   */
  formatMessageContent(content) {
    return this.escapeHTML(content)
      .replace(/\n/g, '<br>')
      .replace(/```([\s\S]*?)```/g, '<pre><code>$1</code></pre>')
      .replace(/`([^`]+)`/g, '<code>$1</code>');
  }

  /**
   * Escape HTML for security
   */
  escapeHTML(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  /**
   * Get message type for styling
   */
  getMessageType(source) {
    if (source === 'human-popup' || source === 'You') {
      return 'user-message';
    }
    return 'ai-message';
  }

  /**
   * Get display name for sender
   */
  getSenderDisplayName(source) {
    if (source === 'human-popup') return 'You';
    if (source === 'gemini') return 'Gemini';
    if (source === 'chatgpt') return 'ChatGPT';
    if (source === 'claude') return 'Claude';
    if (source === 'perplexity') return 'Perplexity';
    if (source === 'poe') return 'Poe';
    if (source === 'character') return 'Character.AI';
    return source.charAt(0).toUpperCase() + source.slice(1);
  }

  /**
   * Format timestamp for display
   */
  formatTimestamp(timestamp) {
    try {
      const date = new Date(timestamp);
      return date.toLocaleTimeString();
    } catch (error) {
      return 'Invalid time';
    }
  }

  /**
   * Render input section
   */
  renderInputSection(state) {
    const { conversations } = state;
    
    return `
      <div class="input-section">
        <div class="section-title">Send Message to AI</div>
        <div class="ai-selector-container">
          <select class="ai-select" id="tnf-target-ai">
            ${this.renderAIOptions(conversations.currentAI)}
          </select>
        </div>
        <div class="message-input-container">
          <textarea 
            class="message-input" 
            id="tnf-message-input" 
            placeholder="Type your message here..."
            rows="3"
          ></textarea>
        </div>
        <div class="button-group">
          <button class="button button-secondary" id="tnf-clear-btn">
            Clear
          </button>
          <button class="button button-primary" id="tnf-send-btn">
            Send
          </button>
        </div>
        <div class="input-hints">
          <small>Tip: Use Ctrl+Enter to send quickly</small>
        </div>
      </div>
    `;
  }

  /**
   * Render AI platform options
   */
  renderAIOptions(currentAI) {
    const aiOptions = [
      { value: '', text: 'Select AI Platform...' },
      { value: 'chatgpt', text: 'ChatGPT' },
      { value: 'claude', text: 'Claude' },
      { value: 'gemini', text: 'Gemini' },
      { value: 'perplexity', text: 'Perplexity' },
      { value: 'poe', text: 'Poe' },
      { value: 'character', text: 'Character.AI' }
    ];

    return aiOptions.map(option => 
      `<option value="${option.value}" ${option.value === currentAI ? 'selected' : ''}>
        ${option.text}
      </option>`
    ).join('');
  }

  /**
   * Setup event listeners
   */
  setupEventListeners() {
    // This will be called after render to avoid duplicate listeners
  }

  /**
   * Attach event listeners to dynamically created elements
   */
  attachEventListeners() {
    // Message actions
    this.container.addEventListener('click', this.handleClick.bind(this));
    
    // Keyboard shortcuts
    const messageInput = this.container.querySelector('#tnf-message-input');
    if (messageInput) {
      messageInput.addEventListener('keydown', this.handleKeydown.bind(this));
      messageInput.addEventListener('input', this.handleInputChange.bind(this));
    }

    // Auto-scroll chat log
    this.scrollToBottom();
  }

  /**
   * Handle click events
   */
  handleClick = withErrorBoundary((event) => {
    const { target } = event;
    
    if (target.id === 'tnf-send-btn') {
      this.sendMessage();
    } else if (target.id === 'tnf-clear-btn') {
      this.clearInput();
    } else if (target.id === 'tnf-clear-history-btn') {
      this.clearHistory();
    } else if (target.id === 'tnf-refresh-btn') {
      this.refreshHistory();
    } else if (target.id === 'tnf-export-btn') {
      this.exportHistory();
    } else if (target.classList.contains('expand-btn')) {
      this.expandMessage(target.dataset.messageId);
    } else if (target.classList.contains('copy-btn')) {
      this.copyMessage(target.dataset.messageId);
    } else if (target.classList.contains('retry-btn')) {
      this.retryMessage(target.dataset.messageId);
    }
  }, { component: 'ChatInterface', method: 'handleClick' });

  /**
   * Handle keyboard events
   */
  handleKeydown = withErrorBoundary((event) => {
    if (event.ctrlKey && event.key === 'Enter') {
      event.preventDefault();
      this.sendMessage();
    }
  }, { component: 'ChatInterface', method: 'handleKeydown' });

  /**
   * Handle input changes
   */
  handleInputChange = withErrorBoundary((event) => {
    // Auto-resize textarea
    const textarea = event.target;
    textarea.style.height = 'auto';
    textarea.style.height = Math.min(textarea.scrollHeight, 120) + 'px';
  }, { component: 'ChatInterface', method: 'handleInputChange' });

  /**
   * Send message
   */
  sendMessage = withErrorBoundary(async () => {
    const messageInput = this.container.querySelector('#tnf-message-input');
    const targetAISelect = this.container.querySelector('#tnf-target-ai');
    
    const message = messageInput?.value?.trim();
    const targetAI = targetAISelect?.value;

    if (!message || !targetAI) {
      this.showNotification('Please enter a message and select an AI platform.', 'warning');
      return;
    }

    // Add user message to history immediately
    addConversationMessage({
      source: 'human-popup',
      content: message,
      type: 'USER_MESSAGE',
      timestamp: new Date().toISOString()
    });

    // Clear input
    messageInput.value = '';
    messageInput.style.height = 'auto';

    // Send to background script for injection
    try {
      const response = await this.sendToBackground({
        type: 'POPUP_INJECT',
        targetAI: targetAI,
        content: message,
        conversationId: `chat-interface-${Date.now()}`
      });

      if (!response?.success) {
        throw new Error(response?.error || 'Injection failed');
      }

      this.showNotification('Message sent successfully!', 'success');
      
    } catch (error) {
      this.showNotification(`Failed to send message: ${error.message}`, 'error');
      handleError(error, { component: 'ChatInterface', method: 'sendMessage' });
    }
  }, { component: 'ChatInterface', method: 'sendMessage' });

  /**
   * Clear input field
   */
  clearInput() {
    const messageInput = this.container.querySelector('#tnf-message-input');
    if (messageInput) {
      messageInput.value = '';
      messageInput.style.height = 'auto';
      messageInput.focus();
    }
  }

  /**
   * Clear conversation history
   */
  clearHistory = withErrorBoundary(() => {
    if (confirm('Are you sure you want to clear the conversation history?')) {
      clearConversationHistory();
      this.showNotification('Conversation history cleared.', 'info');
    }
  }, { component: 'ChatInterface', method: 'clearHistory' });

  /**
   * Refresh history from background
   */
  refreshHistory = withErrorBoundary(async () => {
    try {
      await this.sendToBackground({ type: 'REQUEST_HISTORY_FROM_RELAY' });
      this.showNotification('History refreshed.', 'info');
    } catch (error) {
      this.showNotification('Failed to refresh history.', 'error');
    }
  }, { component: 'ChatInterface', method: 'refreshHistory' });

  /**
   * Export conversation history
   */
  exportHistory = withErrorBoundary(() => {
    const state = getState();
    const data = {
      conversations: state.conversations.history,
      exportedAt: new Date().toISOString(),
      platform: state.conversations.currentAI
    };
    
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = `tnf-conversation-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    
    URL.revokeObjectURL(url);
    this.showNotification('Conversation exported successfully!', 'success');
  }, { component: 'ChatInterface', method: 'exportHistory' });

  /**
   * Expand collapsed message
   */
  expandMessage(messageId) {
    this.expandedMessages.add(messageId);
    
    const messageElement = this.container.querySelector(`[data-message-id="${messageId}"]`);
    if (messageElement) {
      const contentElement = messageElement.querySelector('.message-content');
      const fullContent = contentElement.getAttribute('data-full-content');
      
      if (fullContent) {
        contentElement.innerHTML = this.formatMessageContent(fullContent);
      }
    }
  }

  /**
   * Copy message to clipboard
   */
  copyMessage = withErrorBoundary(async (messageId) => {
    const state = getState();
    const message = state.conversations.history.find(msg => msg.id === messageId);
    
    if (message) {
      try {
        await navigator.clipboard.writeText(message.content);
        this.showNotification('Message copied to clipboard!', 'success');
      } catch (error) {
        // Fallback for older browsers
        this.fallbackCopyToClipboard(message.content);
      }
    }
  }, { component: 'ChatInterface', method: 'copyMessage' });

  /**
   * Fallback copy to clipboard method
   */
  fallbackCopyToClipboard(text) {
    const textArea = document.createElement('textarea');
    textArea.value = text;
    document.body.appendChild(textArea);
    textArea.select();
    document.execCommand('copy');
    document.body.removeChild(textArea);
    this.showNotification('Message copied to clipboard!', 'success');
  }

  /**
   * Retry sending a message
   */
  retryMessage = withErrorBoundary(async (messageId) => {
    const state = getState();
    const message = state.conversations.history.find(msg => msg.id === messageId);
    
    if (message && message.source === 'human-popup') {
      const messageInput = this.container.querySelector('#tnf-message-input');
      if (messageInput) {
        messageInput.value = message.content;
        messageInput.focus();
        this.showNotification('Message loaded for retry. Click Send when ready.', 'info');
      }
    }
  }, { component: 'ChatInterface', method: 'retryMessage' });

  /**
   * Show notification to user
   */
  showNotification(message, type = 'info') {
    // Create notification element
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.textContent = message;
    
    // Style notification
    Object.assign(notification.style, {
      position: 'fixed',
      top: '20px',
      right: '20px',
      padding: '12px 16px',
      borderRadius: '6px',
      color: 'white',
      fontWeight: '500',
      zIndex: '9999999',
      opacity: '0',
      transform: 'translateX(100%)',
      transition: 'all 0.3s ease'
    });
    
    // Set background color based on type
    const colors = {
      success: '#28a745',
      error: '#dc3545',
      warning: '#ffc107',
      info: '#007bff'
    };
    notification.style.backgroundColor = colors[type] || colors.info;
    
    document.body.appendChild(notification);
    
    // Animate in
    setTimeout(() => {
      notification.style.opacity = '1';
      notification.style.transform = 'translateX(0)';
    }, 10);
    
    // Auto-remove after 3 seconds
    setTimeout(() => {
      notification.style.opacity = '0';
      notification.style.transform = 'translateX(100%)';
      setTimeout(() => {
        if (notification.parentNode) {
          notification.parentNode.removeChild(notification);
        }
      }, 300);
    }, 3000);
  }

  /**
   * Send message to background script
   */
  sendToBackground(message) {
    return new Promise((resolve, reject) => {
      if (!chrome?.runtime?.id) {
        reject(new Error('Extension context not available'));
        return;
      }
      
      chrome.runtime.sendMessage(message, response => {
        if (chrome.runtime.lastError) {
          reject(new Error(chrome.runtime.lastError.message));
        } else {
          resolve(response);
        }
      });
    });
  }

  /**
   * Scroll chat log to bottom
   */
  scrollToBottom() {
    const chatLog = this.container.querySelector('#tnf-chat-log');
    if (chatLog) {
      chatLog.scrollTop = chatLog.scrollHeight;
    }
  }

  /**
   * Cleanup component
   */
  cleanup() {
    if (this.unsubscribe) {
      this.unsubscribe();
      this.unsubscribe = null;
    }
    
    if (this.renderThrottle) {
      clearTimeout(this.renderThrottle);
      this.renderThrottle = null;
    }
    
    this.expandedMessages.clear();
  }

  /**
   * Get component statistics
   */
  getStatistics() {
    const state = getState();
    return {
      messageCount: state.conversations.history.length,
      expandedMessages: this.expandedMessages.size,
      currentAI: state.conversations.currentAI,
      isRendering: !!this.renderThrottle
    };
  }
}

export default ChatInterface;
