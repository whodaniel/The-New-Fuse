/**
 * TNF Chrome Extension - AI Connector Service
 * Handles injection and communication with various AI platforms
 */

import { 
  AI_PLATFORMS, 
  SELECTORS, 
  TIMEOUTS, 
  ERROR_TYPES,
  LIMITS 
} from '../config/constants.js';
import { handleError, withErrorBoundary } from '../utils/ErrorHandler.js';
import { getState, setState } from '../utils/StateManager.js';
import responseMonitorFactory from './ResponseMonitor.js';

class AIConnector {
  constructor(aiType) {
    this.aiType = aiType;
    this.isInjecting = false;
    this.injectionHistory = [];
    this.retryCount = 0;
    this.maxRetries = LIMITS.MAX_INJECTION_RETRIES;
  }

  /**
   * Inject text into AI platform and monitor response
   * @param {string} text - Text to inject
   * @param {string} conversationId - Conversation identifier
   * @param {Object} options - Injection options
   */
  async inject(text, conversationId, options = {}) {
    if (this.isInjecting) {
      throw new Error('Injection already in progress');
    }

    this.isInjecting = true;
    this.retryCount = 0;
    const startTime = Date.now();

    try {
      console.log(`💬 Starting injection into ${this.aiType}: ${text.substring(0, 50)}...`);
      
      // Validate injection prerequisites
      await this.validateInjectionEnvironment();
      
      // Perform injection with retries
      const success = await this.performInjectionWithRetries(text, options);
      
      if (!success) {
        throw new Error(`Failed to inject text after ${this.maxRetries} attempts`);
      }
      
      // Start response monitoring
      await this.startResponseMonitoring(conversationId, options);
      
      // Record successful injection
      this.recordInjectionSuccess(text, Date.now() - startTime);
      
      console.log(`✅ Injection completed successfully in ${Date.now() - startTime}ms`);
      
      return { success: true, duration: Date.now() - startTime };
      
    } catch (error) {
      this.recordInjectionFailure(text, error, Date.now() - startTime);
      handleError(error, { 
        component: 'AIConnector', 
        method: 'inject',
        aiType: this.aiType,
        text: text.substring(0, 100)
      });
      throw error;
    } finally {
      this.isInjecting = false;
    }
  }

  /**
   * Validate that injection environment is ready
   */
  async validateInjectionEnvironment() {
    // Check if page is ready
    if (document.readyState !== 'complete') {
      await this.waitForPageReady();
    }
    
    // Check if AI platform is correct
    const currentAI = this.detectCurrentAI();
    if (currentAI !== this.aiType) {
      throw new Error(`AI platform mismatch. Expected ${this.aiType}, found ${currentAI}`);
    }
    
    // Check if required elements are available
    const inputElement = await this.findInputElement();
    if (!inputElement) {
      throw new Error(ERROR_TYPES.INPUT_ELEMENT_NOT_FOUND);
    }
  }

  /**
   * Wait for page to be ready
   */
  async waitForPageReady(timeout = TIMEOUTS.INJECTION_TIMEOUT) {
    return new Promise((resolve, reject) => {
      if (document.readyState === 'complete') {
        resolve();
        return;
      }
      
      const timer = setTimeout(() => {
        reject(new Error('Page ready timeout'));
      }, timeout);
      
      const handler = () => {
        if (document.readyState === 'complete') {
          clearTimeout(timer);
          document.removeEventListener('readystatechange', handler);
          resolve();
        }
      };
      
      document.addEventListener('readystatechange', handler);
    });
  }

  /**
   * Perform injection with retry logic
   */
  async performInjectionWithRetries(text, options) {
    while (this.retryCount < this.maxRetries) {
      try {
        this.retryCount++;
        console.log(`🔄 Injection attempt ${this.retryCount}/${this.maxRetries}`);
        
        // Find input element
        const inputElement = await this.findInputElement();
        if (!inputElement) {
          throw new Error(ERROR_TYPES.INPUT_ELEMENT_NOT_FOUND);
        }
        
        // Clear and inject text
        await this.clearInput(inputElement);
        await this.injectText(inputElement, text);
        
        // Verify injection
        const verification = await this.verifyInjection(inputElement, text);
        if (!verification.success) {
          throw new Error(`Text injection verification failed: ${verification.error}`);
        }
        
        // Send message
        await this.sendMessage();
        
        return true;
        
      } catch (error) {
        console.warn(`❌ Injection attempt ${this.retryCount} failed:`, error.message);
        
        if (this.retryCount >= this.maxRetries) {
          throw error;
        }
        
        // Wait before retry with exponential backoff
        const delay = Math.min(1000 * Math.pow(2, this.retryCount - 1), 5000);
        await this.sleep(delay);
      }
    }
    
    return false;
  }

  /**
   * Find input element for AI platform
   */
  async findInputElement() {
    const selectors = SELECTORS[this.aiType.toUpperCase()]?.INPUT || [];
    
    for (const selector of selectors) {
      const elements = document.querySelectorAll(selector);
      
      for (const element of elements) {
        if (this.validateInputElement(element)) {
          console.log(`✅ Found input element: ${selector}`);
          return element;
        }
      }
    }
    
    // Try generic selectors as fallback
    const fallbackSelectors = [
      'div[contenteditable="true"]',
      'textarea',
      'input[type="text"]'
    ];
    
    for (const selector of fallbackSelectors) {
      const elements = document.querySelectorAll(selector);
      
      for (const element of elements) {
        if (this.validateInputElement(element)) {
          console.log(`⚠️ Found input element with fallback selector: ${selector}`);
          return element;
        }
      }
    }
    
    return null;
  }

  /**
   * Validate input element
   */
  validateInputElement(element) {
    if (!element) return false;
    
    const rect = element.getBoundingClientRect();
    const isVisible = rect.width > 0 && rect.height > 0;
    const isReasonableSize = rect.width > 50 && rect.height > 10;
    const isNotDisabled = !element.disabled && !element.hasAttribute('readonly');
    const isNotTNF = !element.closest('#tnf-injectable-ui');
    
    return isVisible && isReasonableSize && isNotDisabled && isNotTNF;
  }

  /**
   * Clear input element content
   */
  async clearInput(element) {
    try {
      element.focus();
      await this.sleep(100);
      
      if (element.tagName === 'TEXTAREA' || element.tagName === 'INPUT') {
        element.value = '';
        element.dispatchEvent(new Event('input', { bubbles: true }));
      } else {
        // For contenteditable elements
        element.textContent = '';
        element.innerHTML = '';
        element.dispatchEvent(new Event('input', { bubbles: true }));
      }
      
      await this.sleep(100);
    } catch (error) {
      throw new Error(`Failed to clear input: ${error.message}`);
    }
  }

  /**
   * Inject text into element using multiple strategies
   */
  async injectText(element, text) {
    const strategies = [
      () => this.injectViaClipboard(element, text),
      () => this.injectViaSimulation(element, text),
      () => this.injectViaDirect(element, text)
    ];
    
    for (const strategy of strategies) {
      try {
        await strategy();
        console.log(`✅ Text injection successful`);
        return;
      } catch (error) {
        console.warn(`⚠️ Injection strategy failed:`, error.message);
      }
    }
    
    throw new Error('All text injection strategies failed');
  }

  /**
   * Inject text via clipboard
   */
  async injectViaClipboard(element, text) {
    if (!navigator.clipboard) {
      throw new Error('Clipboard API not available');
    }
    
    await navigator.clipboard.writeText(text);
    element.focus();
    
    // Simulate Ctrl+V
    element.dispatchEvent(new KeyboardEvent('keydown', {
      key: 'v',
      code: 'KeyV',
      keyCode: 86,
      ctrlKey: true,
      bubbles: true
    }));
    
    await this.sleep(200);
  }

  /**
   * Inject text via typing simulation
   */
  async injectViaSimulation(element, text) {
    element.focus();
    
    for (let i = 0; i < text.length; i++) {
      const char = text.charAt(i);
      
      // Simulate input events
      element.dispatchEvent(new InputEvent('beforeinput', {
        inputType: 'insertText',
        data: char,
        bubbles: true
      }));
      
      // Update content
      if (element.tagName === 'TEXTAREA' || element.tagName === 'INPUT') {
        element.value += char;
      } else {
        element.textContent += char;
      }
      
      // Trigger change events
      element.dispatchEvent(new Event('input', { bubbles: true }));
      
      // Small delay for natural typing
      if (i % 10 === 0) await this.sleep(5);
    }
  }

  /**
   * Inject text via direct assignment
   */
  async injectViaDirect(element, text) {
    element.focus();
    
    if (element.tagName === 'TEXTAREA' || element.tagName === 'INPUT') {
      element.value = text;
    } else {
      element.textContent = text;
      element.innerHTML = this.sanitizeHTML(text);
    }
    
    // Trigger events
    element.dispatchEvent(new Event('input', { bubbles: true }));
    element.dispatchEvent(new Event('change', { bubbles: true }));
    element.dispatchEvent(new KeyboardEvent('keyup', { bubbles: true }));
  }

  /**
   * Sanitize HTML to prevent XSS
   */
  sanitizeHTML(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  /**
   * Verify text injection was successful
   */
  async verifyInjection(element, expectedText) {
    await this.sleep(100);
    
    const actualText = element.value || element.textContent || element.innerText || '';
    const trimmedExpected = expectedText.trim();
    const trimmedActual = actualText.trim();
    
    const exactMatch = trimmedActual === trimmedExpected;
    const partialMatch = trimmedActual.includes(trimmedExpected);
    const lengthMatch = Math.abs(trimmedActual.length - trimmedExpected.length) < 10;
    
    return {
      success: exactMatch || (partialMatch && lengthMatch),
      method: exactMatch ? 'exact' : partialMatch ? 'partial' : 'failed',
      expected: trimmedExpected.length,
      actual: trimmedActual.length,
      error: exactMatch || partialMatch ? null : 'Text content mismatch'
    };
  }

  /**
   * Send message using platform-specific send button
   */
  async sendMessage() {
    const sendButton = await this.findSendButton();
    
    if (sendButton) {
      await this.waitForButtonReady(sendButton);
      await this.clickButton(sendButton);
      console.log('✅ Send button clicked');
    } else {
      // Fallback to keyboard shortcut
      console.log('⚠️ Send button not found, using keyboard shortcut');
      await this.sendViaKeyboard();
    }
  }

  /**
   * Find send button for AI platform
   */
  async findSendButton() {
    const selectors = SELECTORS[this.aiType.toUpperCase()]?.SEND || [];
    
    for (const selector of selectors) {
      const buttons = document.querySelectorAll(selector);
      
      for (const button of buttons) {
        if (this.validateSendButton(button)) {
          console.log(`✅ Found send button: ${selector}`);
          return button;
        }
      }
    }
    
    // Try generic selectors
    const fallbackSelectors = [
      'button[aria-label*="Send"]',
      'button[type="submit"]',
      'button:has(svg)'
    ];
    
    for (const selector of fallbackSelectors) {
      const buttons = document.querySelectorAll(selector);
      
      for (const button of buttons) {
        if (this.validateSendButton(button)) {
          console.log(`⚠️ Found send button with fallback: ${selector}`);
          return button;
        }
      }
    }
    
    return null;
  }

  /**
   * Validate send button
   */
  validateSendButton(button) {
    if (!button) return false;
    
    const rect = button.getBoundingClientRect();
    const isVisible = rect.width > 0 && rect.height > 0;
    const isEnabled = !button.disabled && !button.hasAttribute('disabled');
    const isNotTNF = !button.closest('#tnf-injectable-ui');
    
    return isVisible && isEnabled && isNotTNF;
  }

  /**
   * Wait for send button to be ready
   */
  async waitForButtonReady(button, timeout = TIMEOUTS.SEND_BUTTON_WAIT) {
    const startTime = Date.now();
    
    while (Date.now() - startTime < timeout) {
      if (!button.disabled && !button.hasAttribute('disabled')) {
        return true;
      }
      await this.sleep(100);
    }
    
    throw new Error('Send button not ready within timeout');
  }

  /**
   * Click button with proper event simulation
   */
  async clickButton(button) {
    button.focus();
    await this.sleep(100);
    
    // Use native click for better compatibility
    button.click();
    
    await this.sleep(200);
  }

  /**
   * Send message via keyboard shortcut
   */
  async sendViaKeyboard() {
    // Find the currently focused element or input element
    const activeElement = document.activeElement || await this.findInputElement();
    
    if (activeElement) {
      activeElement.focus();
      
      // Send Enter key
      activeElement.dispatchEvent(new KeyboardEvent('keydown', {
        key: 'Enter',
        code: 'Enter',
        keyCode: 13,
        bubbles: true
      }));
      
      await this.sleep(100);
    }
  }

  /**
   * Start response monitoring
   */
  async startResponseMonitoring(conversationId, options) {
    try {
      const performanceMode = getState('ui.performanceMode');
      const monitorOptions = {
        ...options,
        performanceMode
      };
      
      await responseMonitorFactory.startMonitoring(this.aiType, conversationId, monitorOptions);
      console.log(`👁️ Response monitoring started for ${this.aiType}`);
      
    } catch (error) {
      handleError(error, { 
        component: 'AIConnector', 
        method: 'startResponseMonitoring',
        aiType: this.aiType 
      });
    }
  }

  /**
   * Detect current AI platform
   */
  detectCurrentAI() {
    const hostname = window.location.hostname;
    if (hostname.includes('chatgpt.com')) return AI_PLATFORMS.CHATGPT;
    if (hostname.includes('claude.ai')) return AI_PLATFORMS.CLAUDE;
    if (hostname.includes('gemini.google.com')) return AI_PLATFORMS.GEMINI;
    if (hostname.includes('perplexity.ai')) return AI_PLATFORMS.PERPLEXITY;
    if (hostname.includes('poe.com')) return AI_PLATFORMS.POE;
    if (hostname.includes('character.ai')) return AI_PLATFORMS.CHARACTER;
    return 'unknown';
  }

  /**
   * Record successful injection for analytics
   */
  recordInjectionSuccess(text, duration) {
    const record = {
      timestamp: new Date().toISOString(),
      aiType: this.aiType,
      textLength: text.length,
      duration,
      retryCount: this.retryCount,
      success: true
    };
    
    this.injectionHistory.push(record);
    this.limitHistorySize();
    
    // Update performance metrics
    const currentMetrics = getState('performance');
    const newMetrics = {
      totalOperations: currentMetrics.totalOperations + 1,
      injectionLatency: duration,
      successRate: this.calculateSuccessRate()
    };
    
    setState({ performance: { ...currentMetrics, ...newMetrics } }, 'UPDATE_PERFORMANCE');
    
    console.log(`📊 Injection success recorded: ${duration}ms`);
  }

  /**
   * Record failed injection for analytics
   */
  recordInjectionFailure(text, error, duration) {
    const record = {
      timestamp: new Date().toISOString(),
      aiType: this.aiType,
      textLength: text.length,
      duration,
      retryCount: this.retryCount,
      success: false,
      error: error.message
    };
    
    this.injectionHistory.push(record);
    this.limitHistorySize();
    
    // Update performance metrics
    const currentMetrics = getState('performance');
    const newMetrics = {
      totalOperations: currentMetrics.totalOperations + 1,
      successRate: this.calculateSuccessRate()
    };
    
    setState({ performance: { ...currentMetrics, ...newMetrics } }, 'UPDATE_PERFORMANCE');
    
    console.log(`📊 Injection failure recorded: ${error.message}`);
  }

  /**
   * Calculate success rate from injection history
   */
  calculateSuccessRate() {
    if (this.injectionHistory.length === 0) return 100;
    
    const successCount = this.injectionHistory.filter(record => record.success).length;
    return Math.round((successCount / this.injectionHistory.length) * 100);
  }

  /**
   * Limit injection history size
   */
  limitHistorySize() {
    if (this.injectionHistory.length > 100) {
      this.injectionHistory = this.injectionHistory.slice(-100);
    }
  }

  /**
   * Get injection statistics
   */
  getStatistics() {
    const totalInjections = this.injectionHistory.length;
    const successfulInjections = this.injectionHistory.filter(r => r.success).length;
    const failedInjections = totalInjections - successfulInjections;
    
    const durations = this.injectionHistory
      .filter(r => r.success)
      .map(r => r.duration);
    
    const averageDuration = durations.length > 0 
      ? durations.reduce((a, b) => a + b, 0) / durations.length 
      : 0;
    
    return {
      aiType: this.aiType,
      totalInjections,
      successfulInjections,
      failedInjections,
      successRate: this.calculateSuccessRate(),
      averageDuration: Math.round(averageDuration),
      isInjecting: this.isInjecting,
      recentHistory: this.injectionHistory.slice(-10)
    };
  }

  /**
   * Sleep utility
   */
  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Cleanup resources
   */
  cleanup() {
    this.isInjecting = false;
    this.injectionHistory = [];
    responseMonitorFactory.stopMonitoring(this.aiType);
  }
}

/**
 * AI Connector Factory
 * Creates and manages AI connectors for different platforms
 */
class AIConnectorFactory {
  constructor() {
    this.connectors = new Map();
  }

  /**
   * Get connector for AI platform
   * @param {string} aiType - AI platform type
   */
  getConnector(aiType) {
    if (!this.connectors.has(aiType)) {
      this.connectors.set(aiType, new AIConnector(aiType));
    }
    return this.connectors.get(aiType);
  }

  /**
   * Inject text into specific AI platform
   * @param {string} aiType - AI platform type
   * @param {string} text - Text to inject
   * @param {string} conversationId - Conversation ID
   * @param {Object} options - Injection options
   */
  async inject(aiType, text, conversationId, options = {}) {
    const connector = this.getConnector(aiType);
    return await connector.inject(text, conversationId, options);
  }

  /**
   * Get statistics for all connectors
   */
  getStatistics() {
    const stats = {};
    
    for (const [aiType, connector] of this.connectors) {
      stats[aiType] = connector.getStatistics();
    }
    
    return stats;
  }

  /**
   * Cleanup all connectors
   */
  cleanup() {
    for (const connector of this.connectors.values()) {
      connector.cleanup();
    }
    this.connectors.clear();
  }
}

// Create singleton factory
const aiConnectorFactory = new AIConnectorFactory();

// Cleanup on page unload
window.addEventListener('beforeunload', () => {
  aiConnectorFactory.cleanup();
});

export { AIConnector, AIConnectorFactory };
export default aiConnectorFactory;
